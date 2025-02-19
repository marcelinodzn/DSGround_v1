import { createClient } from '@supabase/supabase-js'
import { create } from 'zustand'
import { Font, FontFamily, uploadFont, createFontFamily, getFontFamilies, getFontsByFamily, getFonts, deleteFont } from '@/lib/fonts'
import { useAuth } from '@/providers/auth-provider'
import { supabase } from '@/lib/supabase'
import { useTypographyStore } from '@/store/typography'
import { usePlatformStore } from '@/store/platform-store'

export type FontCategory = 'serif' | 'sans-serif' | 'monospace' | 'display' | 'handwriting'

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
  uploadFont: (file: File, metadata: Partial<Font>) => Promise<Font>
  createFamily: (family: Partial<FontFamily>) => Promise<void>
  fetchFamilies: () => Promise<void>
  fetchFontsByFamily: (familyId: string) => Promise<void>
  loadFonts: () => Promise<void>
  deleteFont: (fontId: string) => Promise<void>
  brandTypography: Record<string, BrandTypography>
  setBrandTypography: (type: 'primary' | 'secondary' | 'tertiary', fontId: string) => void
  saveBrandTypography: (brandId: string, typography: Partial<BrandTypography>) => Promise<void>
  loadBrandTypography: (brandId: string) => Promise<void>
}

export const useFontStore = create<FontState>((set, get) => ({
  fonts: [],
  families: [],
  isLoading: false,
  error: null,
  brandTypography: {},

  uploadFont: async (file: File, metadata: Partial<Font>) => {
    try {
      set({ isLoading: true, error: null })
      
      // Start with basic metadata
      const fontData = {
        ...metadata,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      const result = await uploadFont(file, fontData)
      await get().loadFonts()
      return result
    } catch (error: any) {
      console.error('Error uploading font:', error?.message || error)
      set({ error: error?.message || 'Failed to upload font' })
      throw error
    } finally {
      set({ isLoading: false })
    }
  },

  createFamily: async (family: Partial<FontFamily>) => {
    try {
      set({ isLoading: true, error: null })
      await createFontFamily(family)
      await get().fetchFamilies()
    } catch (error: any) {
      console.error('Error creating font family:', error?.message || error)
      set({ error: error?.message || 'Failed to create font family' })
      throw error
    } finally {
      set({ isLoading: false })
    }
  },

  fetchFamilies: async () => {
    try {
      set({ isLoading: true, error: null })
      const families = await getFontFamilies()
      set({ families })
    } catch (error: any) {
      console.error('Error fetching font families:', error?.message || error)
      set({ error: error?.message || 'Failed to fetch font families' })
    } finally {
      set({ isLoading: false })
    }
  },

  fetchFontsByFamily: async (familyId: string) => {
    try {
      set({ isLoading: true, error: null })
      const fonts = await getFontsByFamily(familyId)
      set({ fonts })
    } catch (error: any) {
      console.error('Error fetching fonts by family:', error?.message || error)
      set({ error: error?.message || 'Failed to fetch fonts by family' })
    } finally {
      set({ isLoading: false })
    }
  },

  loadFonts: async () => {
    try {
      set({ isLoading: true, error: null })
      const fonts = await getFonts()
      set({ fonts })
    } catch (error: any) {
      console.error('Error loading fonts:', error?.message || error)
      set({ error: error?.message || 'Failed to load fonts' })
    } finally {
      set({ isLoading: false })
    }
  },

  deleteFont: async (fontId: string) => {
    try {
      set({ isLoading: true, error: null })
      await deleteFont(fontId)
      await get().loadFonts()
    } catch (error: any) {
      console.error('Error deleting font:', error?.message || error)
      set({ error: error?.message || 'Failed to delete font' })
      throw error
    } finally {
      set({ isLoading: false })
    }
  },

  setBrandTypography: (type, fontId) => {
    const { currentPlatform } = useTypographyStore.getState()
    if (!currentPlatform) return

    set(state => ({
      brandTypography: {
        ...state.brandTypography,
        [currentPlatform]: {
          ...state.brandTypography[currentPlatform],
          [`${type}_font_id`]: fontId
        }
      }
    }))
  },

  saveBrandTypography: async (brandId: string, typography: Partial<BrandTypography>) => {
    try {
      set({ isLoading: true, error: null })
      
      // First check if record exists
      const { data: existing, error: fetchError } = await supabase
        .from('brand_typography')
        .select('*')
        .eq('brand_id', brandId)
        .single()

      let data;
      let error;

      if (existing) {
        // Update existing record
        const { data: updateData, error: updateError } = await supabase
          .from('brand_typography')
          .update({
            ...typography,
            updated_at: new Date().toISOString()
          })
          .eq('brand_id', brandId)
          .select()
          .single()
        
        data = updateData
        error = updateError
      } else {
        // Insert new record
        const { data: insertData, error: insertError } = await supabase
          .from('brand_typography')
          .insert({
            ...typography,
            brand_id: brandId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single()
        
        data = insertData
        error = insertError
      }

      if (error) throw error

      set(state => ({
        brandTypography: {
          ...state.brandTypography,
          [brandId]: data as BrandTypography
        }
      }))
    } catch (error: any) {
      console.error('Error saving brand typography:', error)
      set({ error: error?.message || 'Failed to save brand typography' })
      throw error
    } finally {
      set({ isLoading: false })
    }
  },

  loadBrandTypography: async (brandId: string) => {
    try {
      set({ isLoading: true, error: null })
      
      const { data, error } = await supabase
        .from('brand_typography')
        .select(`
          *,
          primary_font:primary_font_id (
            id,
            name,
            family,
            weight,
            style,
            format,
            is_variable,
            category,
            tags,
            file_url
          ),
          secondary_font:secondary_font_id (
            id,
            name,
            family,
            weight,
            style,
            format,
            is_variable,
            category,
            tags,
            file_url
          ),
          tertiary_font:tertiary_font_id (
            id,
            name,
            family,
            weight,
            style,
            format,
            is_variable,
            category,
            tags,
            file_url
          )
        `)
        .eq('brand_id', brandId)
        .single()

      if (error) throw error

      set(state => ({
        brandTypography: {
          ...state.brandTypography,
          [brandId]: data as BrandTypography
        }
      }))
    } catch (error: any) {
      console.error('Error loading brand typography:', error?.message || error)
      set({ error: error?.message || 'Failed to load brand typography' })
    } finally {
      set({ isLoading: false })
    }
  }
}))
