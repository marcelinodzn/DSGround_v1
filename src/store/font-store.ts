import { createClient } from '@supabase/supabase-js'
import { create } from 'zustand'
import { Font, FontFamily, uploadFont, createFontFamily, getFontFamilies, getFontsByFamily, getFonts, deleteFont } from '@/lib/fonts'
import { useAuth } from '@/providers/auth-provider'
import { supabase } from '@/lib/supabase'

const supabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

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
  created_at?: string;
  updated_at?: string;
}

interface FontState {
  fonts: Font[]
  families: FontFamily[]
  isLoading: boolean
  error: string | null
  uploadFont: (file: File, metadata: Partial<Font>) => Promise<void>
  createFamily: (family: Partial<FontFamily>) => Promise<void>
  fetchFamilies: () => Promise<void>
  fetchFontsByFamily: (familyName: string) => Promise<void>
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
    set({ isLoading: true, error: null })
    try {
      const families = await getFontFamilies()
      set({ families })
    } catch (error) {
      set({ error: (error as Error).message })
      throw error
    } finally {
      set({ isLoading: false })
    }
  },

  fetchFontsByFamily: async (familyName: string) => {
    set({ isLoading: true, error: null })
    try {
      const fonts = await getFontsByFamily(familyName)
      set({ fonts })
    } catch (error) {
      set({ error: (error as Error).message })
      throw error
    } finally {
      set({ isLoading: false })
    }
  },

  loadFonts: async () => {
    set({ isLoading: true, error: null })
    try {
      const fonts = await getFonts()
      set({ fonts })
    } catch (error) {
      set({ error: (error as Error).message })
      throw error
    } finally {
      set({ isLoading: false })
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

  setBrandTypography: (type, fontId) => 
    set((state) => ({
      brandTypography: {
        ...state.brandTypography,
        [type]: fontId
      }
    })),

  saveBrandTypography: async (brandId: string, typography: Partial<BrandTypography>) => {
    try {
      const { data: existingData } = await supabase
        .from('brand_typography')
        .select('*')
        .eq('brand_id', brandId)
        .single()

      const updateData = {
        brand_id: brandId,
        ...existingData,
        ...typography,
        updated_at: new Date().toISOString(),
        created_at: existingData ? existingData.created_at : new Date().toISOString()
      }

      const { error } = await supabase
        .from('brand_typography')
        .upsert(updateData)

      if (error) throw error

      // Update local state
      set(state => ({
        brandTypography: {
          ...state.brandTypography,
          [brandId]: {
            ...state.brandTypography[brandId],
            ...typography
          }
        }
      }))
    } catch (error) {
      console.error('Error saving brand typography:', error)
      throw error
    }
  },

  loadBrandTypography: async (brandId: string) => {
    try {
      const { data, error } = await supabase
        .from('brand_typography')
        .select('*')
        .eq('brand_id', brandId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // Initialize with empty values if no record exists
          set(state => ({
            brandTypography: {
              ...state.brandTypography,
              [brandId]: {
                brand_id: brandId,
                primary_font_id: null,
                secondary_font_id: null,
                tertiary_font_id: null
              }
            }
          }))
          return
        }
        throw error
      }

      if (data) {
        set(state => ({
          brandTypography: {
            ...state.brandTypography,
            [brandId]: data
          }
        }))
      }
    } catch (error) {
      console.error('Error loading brand typography:', error)
      throw error
    }
  }
}))
