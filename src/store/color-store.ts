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
  isBaseColor?: boolean; // Flag to indicate if this is the base color
}

// Color palette
export interface ColorPalette {
  id: string;
  brandId: string;
  name: string;
  description?: string;
  baseColor: ColorValues;
  steps: ColorStep[];
  tags?: string[];
  isCore: boolean; // Whether this is a core palette or a secondary/accent palette
}

// Configuration state for palette generation
interface PaletteConfig {
  numSteps: number;
  useLightness: boolean;
  lightnessRange: [number, number];
  chromaRange: [number, number];
  lightnessPreset: 'linear' | 'curved' | 'easeIn' | 'easeOut' | 'custom';
  chromaPreset: 'constant' | 'decrease' | 'increase' | 'custom';
  hueShift: number;
  lockBaseColor: boolean;
  customLightnessValues: number[];
  customChromaValues: number[];
  colorGamutSetting: 'srgb' | 'display-p3' | 'unlimited';
}

// Interface for the color store
interface ColorStore {
  palettes: ColorPalette[];
  currentPaletteId: string | null;
  isLoading: boolean;
  error: string | null;
  paletteConfig: PaletteConfig;
  
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
  
  // Palette configuration operations
  updatePaletteConfig: (config: Partial<PaletteConfig>) => void;
}

// Color conversion and accessibility functions are now imported from @/lib/color-utils

export const useColorStore = create<ColorStore>()(persist((set, get) => ({
  palettes: [],
  currentPaletteId: null,
  isLoading: false,
  error: null,
  paletteConfig: {
    numSteps: 9,
    useLightness: true,
    lightnessRange: [0.05, 0.95],
    chromaRange: [0.01, 0.4],
    lightnessPreset: 'linear',
    chromaPreset: 'constant',
    hueShift: 0,
    lockBaseColor: true,
    customLightnessValues: [],
    customChromaValues: [],
    colorGamutSetting: 'srgb',
  },

  fetchPalettesByBrand: async (brandId: string): Promise<void> => {
    set({ isLoading: true });
    try {
      // First, check if we have an authenticated session
      const { data: { session } } = await supabase.auth.getSession();
      let palettes: any[] = [];
      
      if (session) {
        try {
          // Fetch palettes from Supabase
          const { data, error } = await supabase
            .from('color_palettes')
            .select('*')
            .eq('brandId', brandId);
          
          if (error) throw error;
          palettes = data || [];
        } catch (dbError) {
          console.error('Database error:', dbError);
          // Fall back to local storage if database fails
          palettes = [];
        }
      }
      
      // Set the palettes in the store
      set({ palettes: palettes as ColorPalette[], error: null });
      
      // If we have palettes and no current palette is selected, select the first one
      const state = get();
      if (palettes.length > 0 && !state.currentPaletteId) {
        set({ currentPaletteId: palettes[0].id });
      }
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ isLoading: false });
    }
  },

  createPalette: async (brandId: string, palette: Omit<ColorPalette, 'id'>): Promise<void> => {
    set({ isLoading: true });
    try {
      // Generate a new palette with a unique ID
      const newPalette = {
        ...palette,
        brandId,
        id: `palette-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      };
      
      // Add the palette to the store
      set(state => ({
        palettes: [...state.palettes, newPalette as ColorPalette],
        currentPaletteId: newPalette.id,
        error: null
      }));
      
      // Try to save to Supabase if we have a session
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        try {
          const { error } = await supabase
            .from('color_palettes')
            .insert([{
              id: newPalette.id,
              brandId: newPalette.brandId,
              name: newPalette.name,
              description: newPalette.description,
              baseColor: newPalette.baseColor,
              steps: newPalette.steps,
              tags: newPalette.tags,
              isCore: newPalette.isCore
            }]);
          
          if (error) {
            console.error('Error saving palette to Supabase:', error);
          }
        } catch (dbError) {
          console.error('Exception saving palette to Supabase:', dbError);
        }
      }
    } catch (error) {
      set({ error: (error as Error).message });
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

  addColorStep: async (paletteId: string, step: Omit<ColorStep, 'id'>): Promise<void> => {
    try {
      console.log('Adding color step to palette:', { paletteId, step });
      
      // Generate a new step with a unique ID
      const newStep = {
        ...step,
        id: `step-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      };
      
      // Find the palette and add the step
      set(state => {
        const palettes = [...state.palettes];
        const paletteIndex = palettes.findIndex(p => p.id === paletteId);
        
        if (paletteIndex === -1) {
          console.error('Palette not found:', paletteId);
          return state;
        }
        
        const palette = { ...palettes[paletteIndex] };
        palette.steps = [...palette.steps, newStep];
        palettes[paletteIndex] = palette;
        
        return { palettes, error: null };
      });
      
      // Try to save to Supabase if we have a session
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        try {
          // First get the current palette from Supabase
          const { data: paletteData, error: fetchError } = await supabase
            .from('color_palettes')
            .select('steps')
            .eq('id', paletteId)
            .single();
          
          if (fetchError) {
            console.error('Error fetching palette from Supabase:', fetchError);
            return;
          }
          
          // Update the steps array
          const updatedSteps = Array.isArray(paletteData.steps) ? [...paletteData.steps, newStep] : [newStep];
          
          // Save back to Supabase
          const { error: updateError } = await supabase
            .from('color_palettes')
            .update({ steps: updatedSteps })
            .eq('id', paletteId);
          
          if (updateError) {
            console.error('Error updating palette in Supabase:', updateError);
          }
        } catch (dbError) {
          console.error('Exception updating palette in Supabase:', dbError);
        }
      }
    } catch (error) {
      console.error('Error in addColorStep:', error);
      set({ error: (error as Error).message });
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
  },

  updatePaletteConfig: (config) => {
    set((state) => ({
      paletteConfig: { ...state.paletteConfig, ...config }
    }));
    
    // Regenerate the current palette with the new config
    const state = get();
    regenerateCurrentPalette(state);
  },
}), {
  name: 'color-store'
}));

// Add this function to the store implementation
const regenerateCurrentPalette = async (state: ColorStore) => {
  if (!state.currentPaletteId) return;
  
  const currentPalette = state.palettes.find(p => p.id === state.currentPaletteId);
  if (!currentPalette) return;
  
  // Create palette generation options from the current config
  const paletteOptions = {
    lightnessPreset: state.paletteConfig.lightnessPreset,
    chromaPreset: state.paletteConfig.chromaPreset,
    lightnessRange: state.paletteConfig.lightnessRange,
    chromaRange: state.paletteConfig.chromaRange,
    hueShift: state.paletteConfig.hueShift,
    lockBaseColor: state.paletteConfig.lockBaseColor,
    customLightnessValues: state.paletteConfig.customLightnessValues,
    customChromaValues: state.paletteConfig.customChromaValues
  };
  
  // Generate steps for the palette using the current config
  const generatedSteps = generatePaletteUtil(
    currentPalette.baseColor, 
    state.paletteConfig.numSteps,
    state.paletteConfig.useLightness,
    paletteOptions
  );
  
  // Update the palette in the store and database
  await state.updatePalette(currentPalette.id, {
    steps: generatedSteps as any
  });
};
