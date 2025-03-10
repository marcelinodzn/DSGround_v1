import { create } from 'zustand'
import { Font, FontFamily, FontCategory, uploadFont, createFontFamily, getFontFamilies, getFontsByFamily, getFonts, deleteFont } from '@/lib/fonts'
import { useAuth } from '@/providers/auth-provider'
import { supabase, getCurrentUserId } from '@/lib/supabase'
import { useTypographyStore } from '@/store/typography'
import { usePlatformStore } from '@/store/platform-store'

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
  
  // Font operations
  loadFonts: () => Promise<void>
  uploadFont: (file: File, metadata: Partial<Font>) => Promise<Font>
  createFamily: (family: Partial<FontFamily>) => Promise<FontFamily>
  deleteFont: (fontId: string) => Promise<void>
  deleteFamily: (familyId: string) => Promise<void>
  
  // Typography settings
  loadBrandTypography: (brandId: string) => Promise<void>
  updateBrandTypography: (brandId: string, settings: Partial<BrandTypography>) => Promise<void>
  saveBrandTypography: (brandId: string, typography: Partial<BrandTypography>) => Promise<void>
  addFontToBrand: (brandId: string, fontId: string, role: string) => Promise<void>
  removeFontFromBrand: (brandId: string, fontId: string) => Promise<void>
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
      return result as Font
    } catch (error: any) {
      console.error('Error uploading font:', error?.message || error)
      set({ error: error?.message || String(error), isLoading: false })
      throw error
    }
  },

  createFamily: async (family: Partial<FontFamily>) => {
    try {
      // Get current user ID or throw if not authenticated
      const userId = await getCurrentUserId();
      
      // Create basic family first with required fields only
      const { data, error } = await supabase
        .from('font_families')
        .insert({
          id: family.id,
          name: family.name,
          category: family.category,
          tags: family.tags || [],
          user_id: userId, // Add user_id from the session
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        if (error.code === '23505') {
          // Handle duplicate family name
          const { data: existingFamily } = await supabase
            .from('font_families')
            .select()
            .eq('name', family.name || '')
            .single()
          
          if (existingFamily) return existingFamily as FontFamily
        }
        throw error
      }

      // Try to update with additional properties if available
      try {
        if (family.is_variable !== undefined || family.variable_mode !== undefined) {
          const { error: updateError } = await supabase
            .from('font_families')
            .update({
              is_variable: family.is_variable,
              variable_mode: family.variable_mode
            })
            .eq('id', family.id || '')

          if (updateError) {
            console.warn('Could not update additional properties:', updateError)
          }
        }
      } catch (updateError) {
        console.warn('Additional properties not supported:', updateError)
      }

      await get().loadFonts()
      return data as FontFamily
    } catch (error: any) {
      console.error('Error in createFontFamily:', error?.message || error)
      throw error
    }
  },

  fetchFamilies: async () => {
    set({ isLoading: true, error: null })
    try {
      const families = await getFontFamilies()
      set({ families: families as FontFamily[] })
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
      set({ fonts: fonts as Font[], isLoading: false })
    } catch (error) {
      console.error('Error loading fonts:', error)
      set({ error: (error as Error).message, isLoading: false })
      throw error
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
    console.log('Saving brand typography:', { brandId, typography })
    try {
      // First check if record exists
      const { data: existing } = await supabase
        .from('brand_typography')
        .select('*')
        .eq('brand_id', brandId)
        .single()

      let data;
      let error;

      if (existing) {
        // Update existing record
        const result = await supabase
          .from('brand_typography')
          .update({
            ...typography,
            brand_id: brandId
          })
          .eq('brand_id', brandId) // Add WHERE clause
          .select()
          .single()
        
        data = result.data
        error = result.error
      } else {
        // Insert new record
        const result = await supabase
          .from('brand_typography')
          .insert({
            ...typography,
            brand_id: brandId
          })
          .select()
          .single()
        
        data = result.data
        error = result.error
      }

      console.log('Supabase save response:', { data, error })

      if (error) throw error

      if (data) {
        set(state => ({
          brandTypography: {
            ...state.brandTypography,
            [brandId]: data
          }
        }))

        // Update typography store after saving
        const typographyStore = useTypographyStore.getState()
        const platformStore = usePlatformStore.getState()
        
        if (platformStore.currentPlatform && typographyStore.updatePlatform) {
          // Determine which font role was updated
          if (typography.primary_font_id !== undefined) {
            typographyStore.updatePlatform(platformStore.currentPlatform, {
              currentFontRole: 'primary',
              fontId: typography.primary_font_id
            })
          } else if (typography.secondary_font_id !== undefined) {
            typographyStore.updatePlatform(platformStore.currentPlatform, {
              currentFontRole: 'secondary',
              fontId: typography.secondary_font_id
            })
          } else if (typography.tertiary_font_id !== undefined) {
            typographyStore.updatePlatform(platformStore.currentPlatform, {
              currentFontRole: 'tertiary',
              fontId: typography.tertiary_font_id
            })
          }
          
          // Also reload the font to ensure it's available in the document
          setTimeout(async () => {
            // Get the font ID that was just set
            const fontId = typography.primary_font_id !== undefined ? typography.primary_font_id :
                          typography.secondary_font_id !== undefined ? typography.secondary_font_id :
                          typography.tertiary_font_id;
            
            if (fontId) {
              const font = get().fonts.find(f => f.id === fontId);
              if (font?.file_url) {
                try {
                  console.log(`Re-loading font after selection: ${font.family}`);
                  const fontFace = new FontFace(
                    font.family,
                    `url(${font.file_url})`,
                    {
                      weight: font.is_variable ? '1 1000' : `${font.weight || 400}`,
                      style: font.style || 'normal',
                    }
                  );
                  
                  const loadedFont = await fontFace.load();
                  document.fonts.add(loadedFont);
                  console.log(`Font reloaded successfully: ${font.family}`);
                } catch (error) {
                  console.error(`Error reloading font ${font.family}:`, error);
                }
              }
            }
          }, 100);  // Small delay to ensure state has been updated
        }
      }
    } catch (error) {
      console.error('Error saving brand typography:', error)
      throw error
    }
  },

  loadBrandTypography: async (brandId: string) => {
    console.log('Loading brand typography for brand:', brandId)
    try {
      // First ensure fonts are loaded
      await get().loadFonts();
      
      const { data, error } = await supabase
        .from('brand_typography')
        .select('*')
        .eq('brand_id', brandId)
        .single()

      console.log('Supabase typography response:', { data, error })

      if (error) {
        if (error.code === 'PGRST116') {
          // No record exists, create a new one
          const { data: newData, error: insertError } = await supabase
            .from('brand_typography')
            .insert({
              brand_id: brandId,
              primary_font_id: null,
              secondary_font_id: null,
              tertiary_font_id: null,
              primary_font_scale: null,
              secondary_font_scale: null,
              tertiary_font_scale: null,
              primary_font_styles: null,
              secondary_font_styles: null,
              tertiary_font_styles: null
            })
            .select('*')
            .single()

          if (insertError) throw insertError

          set(state => ({
            brandTypography: {
              ...state.brandTypography,
              [brandId]: newData as BrandTypography
            }
          }))
          return
        }
        throw error
      }

      // Now let's preload the font files for immediate use
      const fontIds = [data.primary_font_id, data.secondary_font_id, data.tertiary_font_id].filter(Boolean);
      const { fonts } = get();
      
      // Load web fonts for any fonts that are set
      for (const fontId of fontIds) {
        const font = fonts.find(f => f.id === fontId);
        if (font?.file_url) {
          try {
            // Create and load a web font
            const fontFace = new FontFace(
              font.family,
              `url(${font.file_url})`,
              {
                weight: font.is_variable ? '1 1000' : `${font.weight || 400}`,
                style: font.style || 'normal',
              }
            );
            
            // Load the font and add it to the document
            const loadedFont = await fontFace.load();
            document.fonts.add(loadedFont);
            console.log(`Font loaded successfully: ${font.family}`);
          } catch (error) {
            console.error(`Error loading font ${font.family}:`, error);
          }
        }
      }

      set(state => ({
        brandTypography: {
          ...state.brandTypography,
          [brandId]: data as BrandTypography
        }
      }))
    } catch (error) {
      console.error('Error loading brand typography:', error)
      set(state => ({
        brandTypography: {
          ...state.brandTypography,
          [brandId]: {
            brand_id: brandId,
            primary_font_id: null,
            secondary_font_id: null,
            tertiary_font_id: null,
            primary_font_scale: null,
            secondary_font_scale: null,
            tertiary_font_scale: null,
            primary_font_styles: null,
            secondary_font_styles: null,
            tertiary_font_styles: null
          }
        }
      }))
    }
  },
}))
