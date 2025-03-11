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
      return result as unknown as Font
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
          try {
            const existingFamily = await supabase
              .from('font_families')
              .select('*')
              .eq('name', family.name || '')
              .single()
            
            if (existingFamily) return existingFamily as unknown as FontFamily
          } catch (error) {
            console.error('Error checking existing family:', error)
            throw error
          }
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

      console.log('Created font family:', data)
      
      // Reload families to ensure we have the latest data
      await get().loadFonts()
      return data as unknown as FontFamily
    } catch (error: any) {
      console.error('Error in createFontFamily:', error?.message || error)
      throw error
    }
  },

  fetchFamilies: async () => {
    set({ isLoading: true, error: null })
    try {
      const families = await getFontFamilies()
      set({ families: families as unknown as FontFamily[] })
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
      set({ fonts: fonts as unknown as Font[] })
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
      set({ fonts: fonts as unknown as Font[], isLoading: false })
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

  setBrandTypography: (type: any, fontId: any) => 
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
            [brandId]: data as unknown as BrandTypography
          }
        }))

        // Update typography store after saving
        const typographyStore = useTypographyStore.getState()
        const platformStore = usePlatformStore.getState()
        
        if (platformStore.currentPlatform) {
          // Determine which font role was updated
          if (typography.primary_font_id !== undefined) {
            typographyStore.updatePlatform(platformStore.currentPlatform.id, {
              currentFontRole: 'primary',
              fontId: typography.primary_font_id || undefined
            })
          } else if (typography.secondary_font_id !== undefined) {
            typographyStore.updatePlatform(platformStore.currentPlatform.id, {
              currentFontRole: 'secondary',
              fontId: typography.secondary_font_id || undefined
            })
          } else if (typography.tertiary_font_id !== undefined) {
            typographyStore.updatePlatform(platformStore.currentPlatform.id, {
              currentFontRole: 'tertiary',
              fontId: typography.tertiary_font_id || undefined
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

  loadBrandTypography: async (brandId: string): Promise<void> => {
    console.log('Loading brand typography for brand:', brandId)
    try {
      set({ isLoading: true });
      const { data, error } = await supabase
        .from('brand_typography')
        .select('*')
        .eq('brand_id', brandId)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      // If we found data, update the state
      if (data) {
        set(state => ({
          brandTypography: {
            ...state.brandTypography,
            [brandId]: data as unknown as BrandTypography
          }
        }));
      }
    } catch (error) {
      console.error('Error loading brand typography:', error);
      set({ error: (error as Error).message });
    } finally {
      set({ isLoading: false });
    }
  },

  deleteFamily: async (familyId: string) => {
    console.log('Deleting font family:', familyId)
    try {
      set({ isLoading: true });
      
      // First, delete all fonts in this family
      const fontsInFamily = get().fonts.filter(font => font.family_id === familyId);
      for (const font of fontsInFamily) {
        await get().deleteFont(font.id);
      }
      
      // Then delete the family itself
      const { error } = await supabase
        .from('font_families')
        .delete()
        .eq('id', familyId);
      
      if (error) throw error;
      
      // Update local state
      set(state => ({
        families: state.families.filter(family => family.id !== familyId)
      }));
    } catch (error) {
      console.error('Error deleting font family:', error);
      set({ error: (error as Error).message });
    } finally {
      set({ isLoading: false });
    }
  },
  
  updateBrandTypography: async (brandId: string, settings: Partial<BrandTypography>) => {
    console.log('Updating brand typography:', { brandId, settings })
    try {
      set({ isLoading: true });
      
      const { error } = await supabase
        .from('brand_typography')
        .update(settings)
        .eq('brand_id', brandId);
      
      if (error) throw error;
      
      // Update local state
      set(state => ({
        brandTypography: {
          ...state.brandTypography,
          [brandId]: {
            ...state.brandTypography[brandId],
            ...settings
          }
        }
      }));
    } catch (error) {
      console.error('Error updating brand typography:', error);
      set({ error: (error as Error).message });
    } finally {
      set({ isLoading: false });
    }
  },
  
  addFontToBrand: async (brandId: string, fontId: string, role: string) => {
    console.log('Adding font to brand:', { brandId, fontId, role })
    try {
      set({ isLoading: true });
      
      // Update the brand typography with the new font
      const update = {
        [`${role}_font_id`]: fontId
      };
      
      await get().updateBrandTypography(brandId, update as any);
    } catch (error) {
      console.error('Error adding font to brand:', error);
      set({ error: (error as Error).message });
    } finally {
      set({ isLoading: false });
    }
  },
  
  removeFontFromBrand: async (brandId: string, fontId: string) => {
    console.log('Removing font from brand:', { brandId, fontId })
    try {
      set({ isLoading: true });
      
      // Get current typography
      const typography = get().brandTypography[brandId];
      if (!typography) return;
      
      // Find which role this font is assigned to
      const updates: any = {};
      if (typography.primary_font_id === fontId) {
        updates.primary_font_id = null;
      }
      if (typography.secondary_font_id === fontId) {
        updates.secondary_font_id = null;
      }
      if (typography.tertiary_font_id === fontId) {
        updates.tertiary_font_id = null;
      }
      
      // Update the brand typography
      await get().updateBrandTypography(brandId, updates);
    } catch (error) {
      console.error('Error removing font from brand:', error);
      set({ error: (error as Error).message });
    } finally {
      set({ isLoading: false });
    }
  }
}))
