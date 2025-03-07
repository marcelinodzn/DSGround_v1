import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '@/lib/supabase'
import { usePlatformStore } from './platform-store'
import { useBrandStore } from './brand-store'
import { v4 as uuidv4 } from 'uuid'
import { convertColor as convertColorUtil, generatePalette as generatePaletteUtil, checkAccessibility } from '@/lib/color-utils'

// Color formats
export type ColorFormat = 'oklch' | 'rgb' | 'hex' | 'cmyk' | 'pantone'

// Color representation in different formats
export interface ColorValues {
  oklch: string; // "oklch(60% 0.15 240)"
  rgb: string;   // "rgb(50, 100, 200)"
  hex: string;   // "#3264C8"
  cmyk?: string; // "cmyk(75%, 50%, 0%, 22%)"
  pantone?: string; // "Pantone 2728 C"
}

// Color step in a palette
export interface ColorStep {
  id: string;
  name: string; // e.g., "100", "200", etc.
  values: ColorValues;
  accessibility: {
    contrastWithWhite: number;
    contrastWithBlack: number;
    wcagAANormal: boolean;
    wcagAALarge: boolean;
    wcagAAA: boolean;
  };
}

// Color palette
export interface ColorPalette {
  id: string;
  name: string;
  description?: string;
  baseColor: ColorValues;
  steps: ColorStep[];
  tags?: string[];
  isCore: boolean; // Whether this is a core palette or a secondary/accent palette
}

// Interface for the color store
interface ColorStore {
  palettes: ColorPalette[];
  currentPaletteId: string | null;
  isLoading: boolean;
  error: string | null;
  
  // Palette CRUD operations
  fetchPalettesByBrand: (brandId: string) => Promise<void>;
  createPalette: (brandId: string, palette: Omit<ColorPalette, 'id'>) => Promise<void>;
  updatePalette: (paletteId: string, updates: Partial<Omit<ColorPalette, 'id'>>) => Promise<void>;
  deletePalette: (paletteId: string) => Promise<void>;
  setCurrentPalette: (paletteId: string | null) => void;
  
  // Color operations
  addColorStep: (paletteId: string, step: Omit<ColorStep, 'id'>) => Promise<void>;
  updateColorStep: (paletteId: string, stepId: string, updates: Partial<Omit<ColorStep, 'id'>>) => Promise<void>;
  deleteColorStep: (paletteId: string, stepId: string) => Promise<void>;
  
  // Color conversion utilities
  convertColor: (color: string, fromFormat: ColorFormat, toFormat: ColorFormat) => string;
  generatePalette: (baseColor: ColorValues, numSteps: number) => ColorStep[];
  calculateAccessibility: (color: string) => ColorStep['accessibility'];
}

// Color conversion and accessibility functions are now imported from @/lib/color-utils

export const useColorStore = create<ColorStore>((set, get) => ({
  palettes: [],
  currentPaletteId: null,
  isLoading: false,
  error: null,

  fetchPalettesByBrand: async (brandId: string) => {
    set({ isLoading: true });
    try {
      // First, check if we have an authenticated session
      const { data: { session } } = await supabase.auth.getSession();
      let palettes = [];
      
      if (session) {
        try {
          const { data, error } = await supabase
            .from('color_palettes')
            .select('*')
            .eq('brand_id', brandId);

          if (error) {
            console.error('Error fetching palettes from Supabase:', error);
            // Don't throw, we'll use local palettes or create default ones
          } else {
            // Transform data from database format to our store format
            palettes = data.map(item => ({
              id: item.id,
              name: item.name,
              description: item.description,
              baseColor: item.base_color,
              steps: item.steps || [],
              tags: item.tags,
              isCore: item.is_core
            }));
            console.log('Fetched palettes from Supabase:', palettes.length);
          }
        } catch (dbError) {
          console.error('Exception fetching palettes from Supabase:', dbError);
          // Don't throw, we'll use local palettes or create default ones
        }
      } else {
        console.log('No authenticated session, skipping Supabase fetch');
        // We'll use local palettes or create default ones
      }
      
      // Filter out any local palettes that might have the same brand ID
      // to avoid duplicates when merging with Supabase data
      const currentPalettes = get().palettes;
      const localPalettes = currentPalettes.filter(p => p.id.startsWith('local-'));
      
      // Merge Supabase palettes with local-only palettes
      const mergedPalettes = [...palettes, ...localPalettes];
      
      set({ 
        palettes: mergedPalettes, 
        currentPaletteId: mergedPalettes.length > 0 ? mergedPalettes[0].id : null,
        error: null 
      });
      
      return mergedPalettes;
    } catch (error) {
      console.error('Error in fetchPalettesByBrand:', error);
      set({ error: (error as Error).message });
      return [];
    } finally {
      set({ isLoading: false });
    }
  },

  createPalette: async (brandId: string, palette) => {
    set({ isLoading: true });
    try {
      // Generate a new palette with a unique ID
      const newPalette = {
        id: uuidv4(),
        ...palette
      };

      console.log('Creating new palette:', { brandId, palette: newPalette });

      // Try to add the palette to Supabase, but don't fail if it doesn't work
      try {
        // First, check if we have an authenticated session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          const { error, data } = await supabase
            .from('color_palettes')
            .insert([{
              id: newPalette.id,
              brand_id: brandId,
              name: newPalette.name,
              description: newPalette.description,
              base_color: newPalette.baseColor,
              steps: newPalette.steps,
              tags: newPalette.tags,
              is_core: newPalette.isCore
            }])
            .select();

          if (error) {
            console.error('Error creating palette in Supabase:', error);
            // Don't throw here, we'll continue with local state update
          } else {
            console.log('Palette created successfully in Supabase:', data);
          }
        } else {
          console.log('No authenticated session, creating local-only palette');
          // Mark this palette as local-only
          newPalette.id = `local-${newPalette.id}`;
          if (newPalette.description) {
            newPalette.description += ' (local only)';
          } else {
            newPalette.description = 'Local palette';
          }
        }
      } catch (dbError) {
        console.error('Exception creating palette in Supabase:', dbError);
        // Don't throw here, we'll continue with local state update
      }

      console.log('Palette created successfully in local state:', newPalette);

      // Even if the Supabase operation fails, we'll add the palette to the local state
      // This ensures the UI remains responsive
      set(state => ({
        palettes: [...state.palettes, newPalette],
        currentPaletteId: newPalette.id,
        error: null
      }));

      return newPalette;
    } catch (error) {
      console.error('Error in createPalette:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to create palette' });
      
      // Create a local-only palette as a fallback
      const localPalette = {
        id: uuidv4(),
        ...palette
      };
      
      set(state => ({
        palettes: [...state.palettes, localPalette],
        currentPaletteId: localPalette.id
      }));
      
      return localPalette;
    } finally {
      set({ isLoading: false });
    }
  },

  updatePalette: async (paletteId, updates) => {
    set({ isLoading: true });
    try {
      console.log('Updating palette:', { paletteId, updates });
      
      // First update the local state for immediate UI feedback
      set(state => ({
        palettes: state.palettes.map(p => 
          p.id === paletteId ? { ...p, ...updates } : p
        ),
        error: null
      }));
      
      // Then update in Supabase
      const { error, data } = await supabase
        .from('color_palettes')
        .update({
          name: updates.name,
          description: updates.description,
          base_color: updates.baseColor,
          steps: updates.steps,
          tags: updates.tags,
          is_core: updates.isCore
        })
        .eq('id', paletteId)
        .select();

      if (error) {
        console.error('Error updating palette in Supabase:', error);
        throw error;
      }
      
      console.log('Palette updated successfully:', data);
    } catch (error) {
      console.error('Error in updatePalette:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to update palette' });
      // We don't revert the local state change to avoid UI flickering
      // The next fetch will sync the state with the database
    } finally {
      set({ isLoading: false });
    }
  },

  deletePalette: async (paletteId) => {
    set({ isLoading: true });
    try {
      const { error } = await supabase
        .from('color_palettes')
        .delete()
        .eq('id', paletteId);

      if (error) throw error;

      set(state => {
        const newPalettes = state.palettes.filter(p => p.id !== paletteId);
        return {
          palettes: newPalettes,
          currentPaletteId: state.currentPaletteId === paletteId 
            ? (newPalettes.length > 0 ? newPalettes[0].id : null) 
            : state.currentPaletteId,
          error: null
        };
      });
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ isLoading: false });
    }
  },

  setCurrentPalette: (paletteId) => {
    set({ currentPaletteId: paletteId });
  },

  addColorStep: async (paletteId, step) => {
    try {
      console.log('Adding color step to palette:', { paletteId, step });
      
      // Create a new step with a unique ID
      const newStep = {
        id: uuidv4(),
        ...step,
        // Add default accessibility values if not provided
        accessibility: step.accessibility || {
          contrastWithWhite: 1,
          contrastWithBlack: 1,
          wcagAANormal: false,
          wcagAALarge: false,
          wcagAAA: false
        }
      };
      
      // Update local state first for immediate UI feedback
      set(state => {
        const updatedPalettes = state.palettes.map(p => {
          if (p.id === paletteId) {
            return {
              ...p,
              steps: [...p.steps, newStep]
            };
          }
          return p;
        });

        return { palettes: updatedPalettes, error: null };
      });

      // Update in database
      const palette = get().palettes.find(p => p.id === paletteId);
      if (palette) {
        await get().updatePalette(paletteId, { steps: [...palette.steps, newStep] });
      }
      
      return newStep;
    } catch (error) {
      console.error('Error in addColorStep:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to add color step' });
      return null;
    }
  },

  updateColorStep: async (paletteId, stepId, updates) => {
    set(state => {
      const updatedPalettes = state.palettes.map(p => {
        if (p.id === paletteId) {
          return {
            ...p,
            steps: p.steps.map(s => 
              s.id === stepId ? { ...s, ...updates } : s
            )
          };
        }
        return p;
      });

      return { palettes: updatedPalettes };
    });

    // Update in database
    const palette = get().palettes.find(p => p.id === paletteId);
    if (palette) {
      const updatedSteps = palette.steps.map(s => 
        s.id === stepId ? { ...s, ...updates } : s
      );
      await get().updatePalette(paletteId, { steps: updatedSteps });
    }
  },

  deleteColorStep: async (paletteId, stepId) => {
    set(state => {
      const updatedPalettes = state.palettes.map(p => {
        if (p.id === paletteId) {
          return {
            ...p,
            steps: p.steps.filter(s => s.id !== stepId)
          };
        }
        return p;
      });

      return { palettes: updatedPalettes };
    });

    // Update in database
    const palette = get().palettes.find(p => p.id === paletteId);
    if (palette) {
      const updatedSteps = palette.steps.filter(s => s.id !== stepId);
      await get().updatePalette(paletteId, { steps: updatedSteps });
    }
  },

  convertColor: (color, fromFormat, toFormat) => {
    return convertColorUtil(color, fromFormat, toFormat);
  },

  generatePalette: (baseColor, numSteps, useLightness = true) => {
    try {
      console.log('Generating palette with:', { baseColor, numSteps, useLightness });
      
      // Make sure we have a valid hex color
      let hexColor = '#3264C8'; // Default blue color
      
      if (baseColor) {
        if (typeof baseColor === 'string') {
          // If baseColor is already a string (hex value)
          hexColor = baseColor;
        } else if (typeof baseColor === 'object') {
          // If baseColor is an object with a hex property
          if (baseColor.hex) {
            hexColor = baseColor.hex;
          }
        }
      }
      
      console.log('Using hex color for palette generation:', hexColor);
      
      // Use the color-utils to generate a perceptually uniform palette
      const generatedSteps = generatePaletteUtil(hexColor, numSteps, useLightness);
      
      if (!generatedSteps || !Array.isArray(generatedSteps)) {
        console.error('Invalid steps generated:', generatedSteps);
        throw new Error('Failed to generate palette steps');
      }
      
      // Convert to our ColorStep format
      return generatedSteps.map(step => ({
        id: uuidv4(),
        name: step.name,
        values: step.values,
        accessibility: checkAccessibility(step.values.hex)
      }));
    } catch (error) {
      console.error('Error in generatePalette:', error);
      
      // Return a default set of steps as fallback
      return Array.from({ length: numSteps }).map((_, i) => ({
        id: uuidv4(),
        name: `${(i + 1) * 100}`,
        values: {
          hex: '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0'),
          rgb: 'rgb(100, 100, 100)',
          oklch: 'oklch(50% 0.1 240)'
        },
        accessibility: {
          contrastWithWhite: 2,
          contrastWithBlack: 2,
          wcagAANormal: false,
          wcagAALarge: false,
          wcagAAA: false
        }
      }));
    }
  },

  calculateAccessibility: (color) => {
    return checkAccessibility(color);
  }
}), {
  name: 'color-store'
});
