import { createClient } from '@supabase/supabase-js'
import { create } from 'zustand'
import { Font, FontFamily, uploadFont, createFontFamily, getFontFamilies, getFontsByFamily, getFonts, deleteFont } from '@/lib/fonts'
import { useAuth } from '@/providers/auth-provider'
import { supabase } from '@/lib/supabase'
import { useTypographyStore } from '@/store/typography'
import { usePlatformStore } from '@/store/platform-store'

const supabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export type FontCategory = 'sans-serif' | 'serif' | 'monospace' | 'display' | 'handwriting'

interface UploadFontParams {
  id: string
  name: string
  family: string
  familyId: string
  weight: number
  style: string
  format: string
  isVariable: boolean
  variableMode?: 'variable' | 'fixed'
  category: FontCategory
  tags: string[]
}

interface BrandTypography {
  brand_id: string;
  primary_font_id: string | null;
  secondary_font_id: string | null;
  tertiary_font_id: string | null;
  primary_font_scale: string | null;
  secondary_font_scale: string | null;
  tertiary_font_scale: string | null;
  primary_font_styles: FontStyles | null;
  secondary_font_styles: FontStyles | null;
  tertiary_font_styles: FontStyles | null;
}

interface FontStyles {
  weight: string;
  style: string;
  // Add other style properties as needed
}

interface FontState {
  fonts: Font[]
  families: FontFamily[]
  isLoading: boolean
  error: string | null
  brandTypography: Record<string, BrandTypography>
  uploadFont: (file: File, metadata: Partial<Font>) => Promise<void>
  createFamily: (family: Partial<FontFamily>) => Promise<void>
  fetchFamilies: () => Promise<void>
  fetchFontsByFamily: (familyName: string) => Promise<void>
  loadFonts: () => Promise<void>
  deleteFont: (fontId: string) => Promise<void>
  setBrandTypography: (type: 'primary' | 'secondary' | 'tertiary', fontId: string) => void
  saveBrandTypography: (brandId: string, typography: Partial<BrandTypography>) => Promise<void>
  loadBrandTypography: (brandId: string) => Promise<void>
}

// Type for raw Supabase responses
type RawFontFamily = {
  id: string;
  name: string;
  category: string;
  tags: string[];
  user_id: string;
  created_at: string;
  updated_at: string;
}

type RawFont = {
  id: string;
  name: string;
  family: string;
  family_id: string;
  weight: number;
  style: string;
  format: string;
  is_variable: boolean;
  variable_mode?: 'variable' | 'fixed';
  category: string;
  tags: string[];
  file_url: string;
  file_key: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

// Type guards for Supabase responses
function isFontFamily(obj: unknown): obj is FontFamily {
  if (!obj || typeof obj !== 'object') return false;
  const f = obj as any;
  return (
    typeof f.id === 'string' &&
    typeof f.name === 'string' &&
    typeof f.category === 'string' &&
    Array.isArray(f.tags) &&
    typeof f.created_at === 'string' &&
    typeof f.updated_at === 'string'
  );
}

function isFont(obj: unknown): obj is Font {
  if (!obj || typeof obj !== 'object') return false;
  const f = obj as any;
  return (
    typeof f.id === 'string' &&
    typeof f.name === 'string' &&
    typeof f.family === 'string' &&
    typeof f.family_id === 'string' &&
    typeof f.weight === 'number' &&
    typeof f.style === 'string' &&
    typeof f.format === 'string' &&
    typeof f.file_url === 'string' &&
    typeof f.file_key === 'string' &&
    typeof f.user_id === 'string'
  );
}

function isBrandTypography(obj: unknown): obj is BrandTypography {
  if (!obj || typeof obj !== 'object') return false;
  const t = obj as any;
  return (
    typeof t.brand_id === 'string' &&
    (t.primary_font_id === null || typeof t.primary_font_id === 'string') &&
    (t.secondary_font_id === null || typeof t.secondary_font_id === 'string') &&
    (t.tertiary_font_id === null || typeof t.tertiary_font_id === 'string') &&
    (t.primary_font_scale === null || typeof t.primary_font_scale === 'string') &&
    (t.secondary_font_scale === null || typeof t.secondary_font_scale === 'string') &&
    (t.tertiary_font_scale === null || typeof t.tertiary_font_scale === 'string')
  );
}

export const useFontStore = create<FontState>((set, get) => ({
  fonts: [],
  families: [],
  isLoading: false,
  error: null,
  brandTypography: {},

  uploadFont: async (file: File, metadata: Partial<Font>) => {
    try {
      const result = await uploadFont(file, metadata)
      if (!isFont(result)) throw new Error('Invalid font data received')
      return
    } catch (error) {
      console.error('Error uploading font:', error)
      throw error
    }
  },

  createFamily: async (family: Partial<FontFamily>) => {
    try {
      // Create basic family first with required fields only
      const { data, error } = await supabaseClient
        .from('font_families')
        .insert({
          id: family.id,
          name: family.name,
          category: family.category,
          tags: family.tags || [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        if (error.code === '23505') {
          // Handle duplicate family name
          const { data: existingFamily } = await supabaseClient
            .from('font_families')
            .select()
            .eq('name', family.name)
            .single()
          
          if (existingFamily) return existingFamily
        }
        throw error
      }

      // Try to update with additional properties
      try {
        const { error: updateError } = await supabaseClient
          .from('font_families')
          .update({
            is_variable: family.is_variable || false,
            variable_mode: family.variable_mode
          })
          .eq('id', family.id)

        if (updateError) {
          console.warn('Could not update additional properties:', updateError)
        }
      } catch (updateError) {
        console.warn('Additional properties not supported:', updateError)
      }

      await get().fetchFamilies()
      return data
    } catch (error: any) {
      console.error('Error in createFontFamily:', error?.message || error)
      throw error
    }
  },

  fetchFamilies: async () => {
    try {
      const { data: rawData, error } = await supabase
        .from('font_families')
        .select('*')
        .returns<RawFontFamily[]>();

      if (error) throw error;
      if (!rawData) throw new Error('No font families found');

      const validFamilies = rawData.filter(isFontFamily);
      set({ families: validFamilies });
    } catch (error) {
      console.error('Error fetching families:', error);
      throw error;
    }
  },

  fetchFontsByFamily: async (familyName: string) => {
    try {
      const { data: rawData, error } = await supabase
        .from('fonts')
        .select('*')
        .eq('family', familyName);

      if (error) throw error;
      if (!rawData) throw new Error('No fonts found');

      // Convert raw data to Font type
      const validFonts = rawData
        .filter((f): f is RawFont => (
          typeof f.id === 'string' &&
          typeof f.name === 'string' &&
          typeof f.family === 'string' &&
          typeof f.family_id === 'string' &&
          typeof f.weight === 'number' &&
          typeof f.style === 'string' &&
          typeof f.format === 'string' &&
          typeof f.file_url === 'string' &&
          typeof f.file_key === 'string' &&
          typeof f.user_id === 'string'
        ))
        .map(f => ({
          ...f,
          is_variable: f.is_variable || false,
        })) as Font[];

      set({ fonts: validFonts });
    } catch (error) {
      console.error('Error fetching fonts:', error);
      throw error;
    }
  },

  loadFonts: async () => {
    try {
      const { data: rawData, error } = await supabase
        .from('fonts')
        .select('*');

      if (error) throw error;
      if (!rawData) throw new Error('No fonts found');

      // Convert raw data to Font type
      const validFonts = rawData
        .filter((f): f is RawFont => (
          typeof f.id === 'string' &&
          typeof f.name === 'string' &&
          typeof f.family === 'string' &&
          typeof f.family_id === 'string' &&
          typeof f.weight === 'number' &&
          typeof f.style === 'string' &&
          typeof f.format === 'string' &&
          typeof f.file_url === 'string' &&
          typeof f.file_key === 'string' &&
          typeof f.user_id === 'string'
        ))
        .map(f => ({
          ...f,
          is_variable: f.is_variable || false,
        })) as Font[];

      set({ fonts: validFonts });
    } catch (error) {
      console.error('Error loading fonts:', error);
      throw error;
    }
  },

  deleteFont: async (fontId: string) => {
    set({ isLoading: true, error: null })
    try {
      await deleteFont(fontId)
      await get().loadFonts() // Refresh the font list
    } catch (error) {
      set({ error: (error as Error).message })
      throw error
    } finally {
      set({ isLoading: false })
    }
  },

  setBrandTypography: (type, fontId) => {
    const { currentPlatform } = usePlatformStore.getState()
    if (!currentPlatform?.id) return

    const currentTypography = get().brandTypography[currentPlatform.id] || {}
    const updatedTypography: BrandTypography = {
      ...currentTypography,
      [`${type}_font_id`]: fontId
    } as BrandTypography

    set(state => ({
      brandTypography: {
        ...state.brandTypography,
        [currentPlatform.id]: updatedTypography
      }
    }))
  },

  saveBrandTypography: async (brandId, typography) => {
    try {
      const { data: rawData, error } = await supabase
        .from('brand_typography')
        .upsert({
          brand_id: brandId,
          ...typography
        })
        .select()
        .single()

      if (error) throw error
      if (!rawData) throw new Error('Failed to save typography')
      if (!isBrandTypography(rawData)) throw new Error('Invalid typography data received')

      set(state => ({
        brandTypography: {
          ...state.brandTypography,
          [brandId]: rawData
        }
      }))
    } catch (error) {
      console.error('Error saving typography:', error)
      throw error
    }
  },

  loadBrandTypography: async (brandId) => {
    try {
      const { data: rawData, error } = await supabase
        .from('brand_typography')
        .select(`
          *,
          primary_font:fonts!brand_typography_primary_font_id_fkey(*),
          secondary_font:fonts!brand_typography_secondary_font_id_fkey(*),
          tertiary_font:fonts!brand_typography_tertiary_font_id_fkey(*)
        `)
        .eq('brand_id', brandId)
        .single()

      if (error) throw error
      if (!rawData) throw new Error('Typography not found')
      if (!isBrandTypography(rawData)) throw new Error('Invalid typography data received')

      set(state => ({
        brandTypography: {
          ...state.brandTypography,
          [brandId]: rawData
        }
      }))
    } catch (error) {
      console.error('Error loading typography:', error)
      throw error
    }
  }
}))
