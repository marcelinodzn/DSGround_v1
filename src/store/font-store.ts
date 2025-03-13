import { create } from 'zustand'
import { Font, FontFamily, FontCategory, uploadFont, createFontFamily, getFontFamilies, getFontsByFamily, getFonts, deleteFont } from '@/lib/fonts'
import { useAuth } from '@/providers/auth-provider'
import { supabase, getCurrentUserId } from '@/lib/supabase'
import { useTypographyStore } from '@/store/typography'
import { usePlatformStore } from '@/store/platform-store'
import { loadFontOnce } from '@/lib/font-utils'

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

// Create a debounce mechanism for typography saving
let saveTypographyDebounceTimers: Record<string, ReturnType<typeof setTimeout>> = {};

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
    console.log('Saving brand typography:', { brandId, typography });
    try {
      // Create a unique key for this save operation based on the brandId and which field is being updated
      const updateKey = Object.keys(typography).find(k => k !== 'brand_id') || 'unknown';
      const debounceKey = `${brandId}:${updateKey}`;
      
      // Clear any existing timeout for this key
      if (saveTypographyDebounceTimers[debounceKey]) {
        clearTimeout(saveTypographyDebounceTimers[debounceKey]);
        console.log(`Debounced previous save for ${debounceKey}`);
      }
      
      // Immediately update the local state for a responsive UI
      set(state => ({
        brandTypography: {
          ...state.brandTypography,
          [brandId]: {
            ...state.brandTypography[brandId],
            ...typography
          }
        }
      }));
      
      // Debounce the actual save operation
      return new Promise<any>((resolve, reject) => {
        saveTypographyDebounceTimers[debounceKey] = setTimeout(async () => {
          try {
            const currentUser = await getCurrentUserId();
            if (!currentUser) {
              throw new Error('Unauthorized');
            }
            
            let { data, error } = await supabase
              .from('brand_typography')
              .select('*')
              .eq('brand_id', brandId)
              .single();
            
            if (!data) {
              // Create a new record with defaults
              ({ data, error } = await supabase
                .from('brand_typography')
                .insert([{
                  ...typography,
                  brand_id: brandId,
                  user_id: currentUser,
                }])
                .select()
                .single());
            } else {
              // Update existing record
              ({ data, error } = await supabase
                .from('brand_typography')
                .update({
                  ...typography,
                  updated_at: new Date().toISOString()
                })
                .eq('brand_id', brandId)
                .select()
                .single());
            }
            
            if (error) {
              throw error;
            }
            
            if (data) {
              // Update typography store after saving
              const typographyStore = useTypographyStore.getState();
              const platformStore = usePlatformStore.getState();
              
              if (platformStore.currentPlatform) {
                // Determine which font role was updated
                if (typography.primary_font_id !== undefined) {
                  typographyStore.updatePlatform(platformStore.currentPlatform.id, {
                    currentFontRole: 'primary',
                    fontId: typography.primary_font_id || undefined
                  });
                } else if (typography.secondary_font_id !== undefined) {
                  typographyStore.updatePlatform(platformStore.currentPlatform.id, {
                    currentFontRole: 'secondary',
                    fontId: typography.secondary_font_id || undefined
                  });
                } else if (typography.tertiary_font_id !== undefined) {
                  typographyStore.updatePlatform(platformStore.currentPlatform.id, {
                    currentFontRole: 'tertiary',
                    fontId: typography.tertiary_font_id || undefined
                  });
                }
                
                // Also reload the font to ensure it's available in the document
                setTimeout(async () => {
                  try {
                    // Get the font ID that was just set
                    const fontId = typography.primary_font_id !== undefined ? typography.primary_font_id :
                                 typography.secondary_font_id !== undefined ? typography.secondary_font_id :
                                 typography.tertiary_font_id;
                    
                    if (fontId) {
                      const font = get().fonts.find(f => f.id === fontId);
                      if (font?.file_url) {
                        console.log(`Re-loading font after selection: ${font.family}`);
                        // Use our new utility for safer font loading with timeout
                        await loadFontOnce(
                          font.family,
                          font.file_url,
                          {
                            weight: font.is_variable ? '1 1000' : `${font.weight || 400}`,
                            style: font.style || 'normal',
                            force: true // Force reload
                          }
                        );
                      }
                    }
                  } catch (loadError) {
                    console.error(`Error reloading font:`, loadError);
                    // Don't throw here to prevent the whole operation from failing
                  }
                }, 100);  // Small delay to ensure state has been updated
              }
              
              resolve(data);
            } else {
              reject(new Error('Failed to save typography data'));
            }
          } catch (saveError) {
            console.error('Error in debounced save:', saveError);
            reject(saveError);
          }
        }, 300); // 300ms debounce time
      });
    } catch (error) {
      console.error('Error saving brand typography:', error);
      throw error;
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
