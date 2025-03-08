import { supabase, getCurrentUserId } from '@/lib/supabase'
import { v4 as uuidv4 } from 'uuid'

export interface Font {
  id: string
  name: string
  family: string
  family_id: string
  weight: number
  style: string
  format: string
  category: string
  tags: string[]
  file_url: string
  file_key: string
  user_id: string
  created_at: string
  updated_at: string
  is_variable?: boolean
  variable_mode?: 'variable' | 'fixed'
}

export interface FontFamily {
  id: string
  name: string
  category: FontCategory
  tags: string[]
  user_id: string
  created_at: string
  updated_at: string
  is_variable?: boolean
  variable_mode?: 'variable' | 'fixed'
}

export interface FontVersion {
  id: string
  fontId: string
  version: string
  fileUrl: string
  fileKey: string
  createdAt: string
}

export type FontCategory = 'sans-serif' | 'serif' | 'monospace' | 'display' | 'handwriting'

const sanitizeFileName = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // Replace any non-alphanumeric chars with dash
    .replace(/^-+|-+$/g, '') // Remove leading/trailing dashes
}

// Custom function to upload a file directly to Supabase storage using fetch
async function uploadFileToStorage(
  bucket: string,
  path: string,
  file: File,
  contentType: string
): Promise<{ publicUrl: string }> {
  // Get the current session for authentication
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error('Authentication required');
  }
  
  // Get the Supabase URL and API key
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = session.access_token;
  
  if (!supabaseUrl) {
    throw new Error('Supabase URL not found');
  }
  
  // Create the upload URL
  const uploadUrl = `${supabaseUrl}/storage/v1/object/${bucket}/${path}`;
  
  // Convert file to ArrayBuffer
  const arrayBuffer = await file.arrayBuffer();
  
  // Upload the file using fetch
  const response = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': contentType,
      'x-upsert': 'true'
    },
    body: arrayBuffer
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('Upload failed:', response.status, errorText);
    throw new Error(`Upload failed: ${response.status} ${errorText}`);
  }
  
  // Get the public URL
  const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;
  
  return { publicUrl };
}

export async function uploadFont(file: File, metadata: Partial<Font>) {
  try {
    // Check authentication first
    const userId = await getCurrentUserId();
    
    // Generate a unique ID for the font
    const fontId = metadata.id || uuidv4()
    
    // Sanitize file name and create a unique path
    const fileExt = file.name.split('.').pop()?.toLowerCase() || ''
    const sanitizedFamily = sanitizeFileName(metadata.family || '')
    const sanitizedName = sanitizeFileName(metadata.name || '')
    const uniqueFileName = `${sanitizedName}-${fontId}.${fileExt}`
    const filePath = `fonts/${sanitizedFamily}/${uniqueFileName}`

    // Map file extensions to correct MIME types
    const mimeTypes: Record<string, string> = {
      'ttf': 'font/ttf',
      'otf': 'font/otf',
      'woff': 'font/woff',
      'woff2': 'font/woff2'
    };
    
    // Use the correct MIME type based on file extension
    const contentType = mimeTypes[fileExt] || 'application/octet-stream';
    
    console.log(`Uploading font ${file.name} with content type: ${contentType}`);
    
    // Use custom upload function instead of Supabase SDK
    const { publicUrl } = await uploadFileToStorage('fonts', filePath, file, contentType);
    
    console.log('File uploaded successfully, public URL:', publicUrl);

    // Check if font is variable using OpenType.js
    let isVariable = false
    let variableMode = undefined
    
    try {
      const buffer = await file.arrayBuffer()
      const font = window.opentype.parse(buffer)
      isVariable = font.tables && font.tables.fvar !== undefined
      variableMode = isVariable ? 'variable' : undefined
    } catch (error) {
      console.warn('Could not check variable font status:', error)
    }

    // Insert font metadata into the database
    const { data: fontData, error: dbError } = await supabase
      .from('fonts')
      .insert({
        id: fontId,
        name: metadata.name,
        family: metadata.family,
        family_id: metadata.family_id,
        weight: metadata.weight || 400,
        style: metadata.style || 'normal',
        format: fileExt,
        is_variable: isVariable || metadata.is_variable || false,
        variable_mode: variableMode || metadata.variable_mode,
        category: metadata.category,
        tags: metadata.tags || [],
        file_url: publicUrl,
        file_key: filePath,
        user_id: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError);
      throw dbError;
    }

    return fontData
  } catch (error) {
    console.error('Error uploading font:', error)
    throw error
  }
}

export async function createFontFamily(family: Partial<FontFamily>) {
  try {
    console.log('Creating font family in DB:', family);
    
    // Get current user ID or throw if not authenticated
    const userId = await getCurrentUserId();
    
    const { data, error } = await supabase
      .from('font_families')
      .insert({
        id: family.id,
        name: family.name,
        category: family.category,
        tags: family.tags || [],
        user_id: userId, // Add user_id from the session
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating font family in DB:', error);
      throw error;
    }

    console.log('Font family created in DB:', data);
    return data;
  } catch (error) {
    console.error('Error in createFontFamily:', error);
    throw error;
  }
}

export async function getFontFamilies() {
  try {
    const { data, error } = await supabase
      .from('font_families')
      .select('*')
      .order('name')

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error fetching font families:', error)
    throw error
  }
}

export async function getFontsByFamily(familyName: string) {
  try {
    const { data, error } = await supabase
      .from('fonts')
      .select('*')
      .eq('family', familyName)
      .order('weight')

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error fetching fonts:', error)
    throw error
  }
}

export async function getFonts() {
  const { data: fonts, error } = await supabase
    .from('fonts')
    .select('*')
    .order('family', { ascending: true })
    .order('weight', { ascending: true })
  
  if (error) throw error
  return fonts
}

export async function createFontVersion(fontId: string, file: File, version: string) {
  try {
    const versionId = uuidv4()
    const fileExt = file.name.split('.').pop()
    const filePath = `fonts/versions/${fontId}/${version}-${versionId}.${fileExt}`

    // Upload font file to Supabase Storage
    const contentType = {
      'ttf': 'font/ttf',
      'otf': 'font/otf',
      'woff2': 'font/woff2'
    }[fileExt?.toLowerCase() || ''] || 'application/octet-stream'

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('fonts')
      .upload(filePath, file, {
        contentType,
        upsert: true
      })

    if (uploadError) throw uploadError

    // Get the public URL for the uploaded file
    const { data: { publicUrl } } = supabase.storage
      .from('fonts')
      .getPublicUrl(filePath)

    // Insert version metadata into the database
    const { data, error: dbError } = await supabase
      .from('font_versions')
      .insert({
        id: versionId,
        font_id: fontId,
        version,
        file_url: publicUrl,
        file_key: filePath,
      })
      .select()
      .single()

    if (dbError) throw dbError
    return data
  } catch (error) {
    console.error('Error creating font version:', error)
    throw error
  }
}

export async function deleteFontFamily(familyId: string) {
  try {
    // First, get all fonts in this family to delete them too
    const { data: familyFonts, error: queryError } = await supabase
      .from('fonts')
      .select('id, file_key')
      .eq('family_id', familyId)
    
    if (queryError) throw queryError
    
    // Delete all associated fonts first
    if (familyFonts && familyFonts.length > 0) {
      for (const font of familyFonts) {
        // Make sure we have a valid file_key
        if (font && font.file_key && typeof font.file_key === 'string') {
          await supabase.storage
            .from('fonts')
            .remove([font.file_key])
        }
      }
      
      // Then delete all font records
      await supabase
        .from('fonts')
        .delete()
        .eq('family_id', familyId)
    }
    
    // Delete the family from the database
    const { error } = await supabase
      .from('font_families')
      .delete()
      .eq('id', familyId)
    
    if (error) throw error
    
    return { success: true }
  } catch (error) {
    console.error('Error deleting font family:', error)
    throw error
  }
}

export async function deleteFont(fontId: string) {
  try {
    // Get the font to retrieve its file key
    const { data: font, error: getError } = await supabase
      .from('fonts')
      .select('file_key')
      .eq('id', fontId)
      .single()
    
    if (getError) throw getError
    
    // Delete the font file from storage if available
    if (font && font.file_key && typeof font.file_key === 'string') {
      const { error: storageError } = await supabase.storage
        .from('fonts')
        .remove([font.file_key])
      
      if (storageError) throw storageError
    }
    
    // Delete the font record from the database
    const { error } = await supabase
      .from('fonts')
      .delete()
      .eq('id', fontId)
    
    if (error) throw error
    
    return { success: true }
  } catch (error) {
    console.error('Error deleting font:', error)
    throw error
  }
}
