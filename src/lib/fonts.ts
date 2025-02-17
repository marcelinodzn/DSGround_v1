import { supabase } from './supabase'
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

export async function uploadFont(file: File, metadata: Partial<Font>) {
  try {
    // Generate a unique ID for the font
    const fontId = metadata.id || uuidv4()
    
    // Sanitize file name and create a unique path
    const fileExt = file.name.split('.').pop()
    const sanitizedFamily = sanitizeFileName(metadata.family || '')
    const sanitizedName = sanitizeFileName(metadata.name || '')
    const uniqueFileName = `${sanitizedName}-${fontId}.${fileExt}`
    const filePath = `fonts/${sanitizedFamily}/${uniqueFileName}`

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

    // Check if font is variable using OpenType.js
    let isVariable = false
    let variableMode = undefined
    
    try {
      const buffer = await file.arrayBuffer()
      const font = new window.opentype.Font(buffer)
      isVariable = font.tables.fvar !== undefined
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
        user_id: metadata.user_id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (dbError) {
      // If database insert fails, clean up the uploaded file
      await supabase.storage
        .from('fonts')
        .remove([filePath])
      throw dbError
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
    
    const { data, error } = await supabase
      .from('font_families')
      .insert({
        id: family.id,
        name: family.name,
        category: family.category,
        tags: family.tags || [],
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
    // First, get all fonts in this family
    const { data: fonts, error: fetchError } = await supabase
      .from('fonts')
      .select('*')
      .eq('family_id', familyId)

    if (fetchError) throw fetchError

    // Delete all font files from storage
    for (const font of fonts || []) {
      await supabase.storage
        .from('fonts')
        .remove([font.file_key])
    }

    // Delete the family from the database
    const { error: deleteError } = await supabase
      .from('font_families')
      .delete()
      .eq('id', familyId)

    if (deleteError) throw deleteError
  } catch (error) {
    console.error('Error deleting font family:', error)
    throw error
  }
}

export async function deleteFont(fontId: string) {
  try {
    // Get the font data first to get the file path
    const { data: font, error: fetchError } = await supabase
      .from('fonts')
      .select('file_key')
      .eq('id', fontId)
      .single()
    
    if (fetchError) throw fetchError
    
    // Delete the font file from storage if it exists
    if (font?.file_key) {
      const { error: storageError } = await supabase.storage
        .from('fonts')
        .remove([font.file_key])
      
      if (storageError) throw storageError
    }

    // Delete the font record from the database
    const { error: deleteError } = await supabase
      .from('fonts')
      .delete()
      .eq('id', fontId)
    
    if (deleteError) throw deleteError
  } catch (error) {
    console.error('Error deleting font:', error)
    throw error
  }
}
