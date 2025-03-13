'use client'

// Create a new store for platforms
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '@/lib/supabase'

export interface Platform {
  id: string
  brand_id: string
  name: string
  description: string | null
  units: {
    typography: string
    spacing: string
    dimensions: string
    borderWidth: string
    borderRadius: string
  }
  layout: {
    gridColumns: number
    gridGutter: number
    containerPadding: number
    icon?: string
  }
  created_at: string
  updated_at: string
  currentFontRole?: 'primary' | 'secondary' | 'tertiary'
}

interface PlatformStore {
  platforms: Platform[]
  currentPlatform: Platform | null
  isLoading: boolean
  error: string | null
  fetchPlatformsByBrand: (brandId: string) => Promise<void>
  getPlatform: (id: string) => Promise<void>
  addPlatform: (brandId: string, platform: Partial<Platform>) => Promise<Platform>
  updatePlatform: (id: string, updates: Partial<Omit<Platform, 'id' | 'brand_id' | 'created_at'>>) => Promise<Platform | null>
  deletePlatform: (id: string) => Promise<boolean>
  setCurrentPlatform: (id: string | null) => Promise<void>
  resetPlatforms: () => void
}

// Type for raw platform data from Supabase
type RawPlatform = {
  id: string;
  brand_id: string;
  name: string;
  description: string | null;
  units: {
    typography: string;
    spacing: string;
    dimensions: string;
    borderWidth: string;
    borderRadius: string;
  };
  layout: {
    gridColumns: number;
    gridGutter: number;
    containerPadding: number;
    icon?: string;
  };
  created_at: string;
  updated_at: string;
  // Note: currentFontRole is not in the database, it's a client-side property only
};

// Type guard for raw platform data
function isRawPlatform(obj: unknown): obj is RawPlatform {
  if (!obj || typeof obj !== 'object') {
    console.warn('Platform object is not an object:', obj);
    return false;
  }
  
  const p = obj as any;
  
  // Log the object for debugging
  console.log('Validating platform object:', JSON.stringify(p, null, 2));
  
  // Basic required attributes check
  const idValid = typeof p.id === 'string';
  const brandIdValid = typeof p.brand_id === 'string';
  const nameValid = typeof p.name === 'string';
  const descriptionValid = p.description === null || typeof p.description === 'string';
  const createdAtValid = typeof p.created_at === 'string';
  
  const hasBasicProps = idValid && brandIdValid && nameValid && descriptionValid && createdAtValid;
  
  if (!hasBasicProps) {
    console.warn('Platform missing basic required attributes:', {
      id: {value: p.id, valid: idValid, type: typeof p.id},
      brand_id: {value: p.brand_id, valid: brandIdValid, type: typeof p.brand_id},
      name: {value: p.name, valid: nameValid, type: typeof p.name},
      description: {value: p.description, valid: descriptionValid, type: typeof p.description},
      created_at: {value: p.created_at, valid: createdAtValid, type: typeof p.created_at}
    });
    return false;
  }
  
  // Units check with defaults if missing
  if (!p.units || typeof p.units !== 'object') {
    console.log('Platform missing units, adding defaults');
    p.units = {
      typography: 'rem',
      spacing: 'rem',
      dimensions: 'px',
      borderWidth: 'px',
      borderRadius: 'px'
    };
  } else {
    // Ensure all unit properties exist with defaults
    if (typeof p.units.typography !== 'string') p.units.typography = 'rem';
    if (typeof p.units.spacing !== 'string') p.units.spacing = 'rem';
    if (typeof p.units.dimensions !== 'string') p.units.dimensions = 'px';
    if (typeof p.units.borderWidth !== 'string') p.units.borderWidth = 'px';
    if (typeof p.units.borderRadius !== 'string') p.units.borderRadius = 'px';
  }

  // Layout check with defaults if missing
  if (!p.layout || typeof p.layout !== 'object') {
    console.log('Platform missing layout, adding defaults');
    p.layout = {
      gridColumns: 12,
      gridGutter: 16,
      containerPadding: 16
    };
  } else {
    // Ensure all layout properties exist with defaults
    if (typeof p.layout.gridColumns !== 'number') p.layout.gridColumns = 12;
    if (typeof p.layout.gridGutter !== 'number') p.layout.gridGutter = 16;
    if (typeof p.layout.containerPadding !== 'number') p.layout.containerPadding = 16;
  }

  return true;
}

// Convert raw platform to Platform type
function convertToPlatform(raw: RawPlatform): Platform {
  // Ensure all required fields are present
  const platform: Platform = {
    ...raw,
    // Ensure units exist with defaults for missing properties
    units: raw.units || {
      typography: 'rem',
      spacing: 'rem',
      dimensions: 'px',
      borderWidth: 'px',
      borderRadius: 'px'
    },
    // Ensure layout exists with defaults for missing properties
    layout: raw.layout || {
      gridColumns: 12,
      gridGutter: 16,
      containerPadding: 16
    }
  };
  
  return platform;
}

export const usePlatformStore = create<PlatformStore>((set, get) => ({
  platforms: [],
  currentPlatform: null,
  isLoading: false,
  error: null,

  getPlatform: async (id: string) => {
    set({ isLoading: true })
    try {
      const { data: rawData, error } = await supabase
        .from('platforms')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      
      if (!rawData) throw new Error('Platform not found')
      
      if (!isRawPlatform(rawData)) {
        throw new Error('Invalid platform data received from server')
      }

      set({ 
        currentPlatform: convertToPlatform(rawData),
        error: null
      })
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'An error occurred' })
    } finally {
      set({ isLoading: false })
    }
  },

  fetchPlatformsByBrand: async (brandId: string) => {
    // Add a guard to prevent further execution with an undefined brandId
    if (!brandId) {
      console.warn('No brand ID provided to fetchPlatformsByBrand');
      set({ 
        platforms: [], 
        error: 'No brand ID provided', 
        isLoading: false 
      });
      return;
    }
    
    // Check if we're already loading for this brandId to prevent duplicate calls
    const currentState = get();
    if (currentState.isLoading) {
      console.log(`Already fetching platforms for brand ${brandId}, skipping duplicate request`);
      return;
    }
    
    set({ isLoading: true });
    try {
      console.log(`Fetching platforms for brand ${brandId}`);
      
      const { data: rawData, error } = await supabase
        .from('platforms')
        .select('*')
        .eq('brand_id', brandId);

      if (error) {
        console.error(`Error fetching platforms for brand ${brandId}:`, error);
        set({ 
          error: `Failed to fetch platforms: ${error.message}`,
          isLoading: false
        });
        return;
      }
      
      if (!rawData || rawData.length === 0) {
        console.log(`No platforms found for brand ${brandId}`);
        set({ 
          platforms: [], 
          error: null,
          isLoading: false
        });
        return;
      }
      
      console.log(`Found ${rawData.length} platforms for brand ${brandId}`);
      
      // Filter and convert valid platforms
      const validPlatforms = [];
      for (const platform of rawData) {
        if (isRawPlatform(platform)) {
          validPlatforms.push(convertToPlatform(platform));
        } else {
          console.warn(`Invalid platform data found for ID ${platform.id || 'unknown'}:`, platform);
        }
      }

      if (validPlatforms.length !== rawData.length) {
        console.warn(`${rawData.length - validPlatforms.length} platforms were filtered out due to invalid data`);
      }

      console.log(`Successfully loaded ${validPlatforms.length} platforms for brand ${brandId}`);
      set({ 
        platforms: validPlatforms, 
        error: null,
        isLoading: false
      });
      
      // If we have platforms but no current platform is set, set the first one
      const currentPlatform = get().currentPlatform;
      if (validPlatforms.length > 0 && !currentPlatform) {
        console.log(`Setting current platform to first platform: ${validPlatforms[0].id}`);
        set({ currentPlatform: validPlatforms[0] });
      }
    } catch (error) {
      console.error(`Unexpected error fetching platforms for brand ${brandId}:`, error);
      set({ 
        error: error instanceof Error ? error.message : 'An error occurred',
        isLoading: false
      });
    }
  },

  fetchPlatforms: async () => {
    console.warn('Deprecated: Use fetchPlatformsByBrand instead')
    set({ platforms: [], currentPlatform: null })
  },

  addPlatform: async (brandId: string, platform: Partial<Platform>) => {
    try {
      const newPlatform = {
        brand_id: brandId,
        name: platform.name || 'New Platform',
        description: platform.description || null,
        units: platform.units || {
          typography: 'px',
          spacing: 'px',
          borderWidth: 'px',
          borderRadius: 'px'
        },
        layout: platform.layout || {
          gridColumns: 12,
          gridGutter: 16,
          containerPadding: 16
        }
      }

      const { data, error } = await supabase
        .from('platforms')
        .insert([newPlatform])
        .select()
        .single()

      if (error) throw error
      
      if (!data) throw new Error('Failed to create platform')
      
      // Handle case where data might be an array (happens with mock Supabase)
      const platformData = Array.isArray(data) ? data[0] : data;
      
      if (!isRawPlatform(platformData)) {
        console.error('Invalid platform data structure:', platformData);
        throw new Error('Invalid platform data received from server')
      }

      const convertedPlatform = convertToPlatform(platformData);
      
      set((state) => ({
        platforms: [...state.platforms, convertedPlatform]
      }))

      return convertedPlatform
    } catch (error) {
      console.error('Error adding platform:', error)
      throw error
    }
  },

  updatePlatform: async (id: string, updates: Partial<Omit<Platform, 'id' | 'brand_id' | 'created_at'>>) => {
    try {
      // Log the update attempt for debugging
      console.log(`Attempting to update platform ${id} with:`, updates);
      
      // Check if the platform exists in the local state first
      const existingPlatform = get().platforms.find(p => p.id === id);
      if (!existingPlatform) {
        console.warn(`Platform ${id} not found in local state, attempting to fetch from database`);
        
        // Try to fetch the platform first to verify it exists
        const { data: checkData, error: checkError } = await supabase
          .from('platforms')
          .select('id')
          .eq('id', id)
          .single();
          
        if (checkError || !checkData) {
          console.error(`Platform ${id} not found in database:`, checkError);
          set(state => ({ 
            ...state, 
            error: `Platform ${id} not found. Please refresh the page and try again.` 
          }));
          return existingPlatform || null;
        }
      }

      // Filter out properties that might not exist in the database schema
      // This prevents "column not found" errors
      const safeUpdates: Record<string, any> = {};
      const knownFields = ['name', 'description', 'units', 'layout', 'updated_at'];
      
      Object.entries(updates).forEach(([key, value]) => {
        if (knownFields.includes(key)) {
          safeUpdates[key] = value;
        } else {
          // Log skipped properties for debugging
          console.warn(`Skipping property "${key}" as it may not exist in the database schema`);
          
          // Handle local-only properties by updating the state directly
          if (key === 'currentFontRole' && existingPlatform) {
            // We'll handle currentFontRole in the local state only
            console.log(`Storing "${key}" in local state only`);
          }
        }
      });

      // Proceed with the update using filtered properties
      const { data, error } = await supabase
        .from('platforms')
        .update(safeUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error(`Error updating platform ${id}:`, error);
        set(state => ({ ...state, error: `Failed to update platform: ${error.message}` }));
        return existingPlatform || null;
      }

      if (!data) {
        console.warn(`No data returned when updating platform ${id}`);
        set(state => ({ ...state, error: 'Platform update returned no data' }));
        return existingPlatform || null;
      }
      
      // Validate the returned data
      if (!isRawPlatform(data)) {
        console.error(`Invalid platform data received from server for ${id}:`, data);
        set(state => ({ ...state, error: 'Invalid platform data received from server' }));
        return existingPlatform || null;
      }

      // Update was successful, create the updated platform 
      // merging database values with local-only properties
      const updatedPlatform = convertToPlatform(data);
      
      // Apply any local-only properties from the updates
      if (updates.currentFontRole) {
        updatedPlatform.currentFontRole = updates.currentFontRole;
      } else if (existingPlatform?.currentFontRole) {
        // Preserve the existing currentFontRole if it wasn't updated
        updatedPlatform.currentFontRole = existingPlatform.currentFontRole;
      }
      
      console.log(`Successfully updated platform ${id}:`, updatedPlatform);
      
      set((state) => ({
        ...state,
        error: null,
        platforms: state.platforms.map((p) =>
          p.id === id ? updatedPlatform : p
        ),
        currentPlatform: state.currentPlatform?.id === id ? updatedPlatform : state.currentPlatform
      }));

      return updatedPlatform;
    } catch (error) {
      // Log the error but don't throw it to prevent app crashes
      console.error('Unexpected error updating platform:', error);
      set(state => ({ 
        ...state, 
        error: error instanceof Error 
          ? `Error updating platform: ${error.message}` 
          : 'An unexpected error occurred while updating the platform'
      }));
      return get().platforms.find(p => p.id === id) || null;
    }
  },

  deletePlatform: async (id) => {
    set({ isLoading: true, error: null })
    try {
      const { error } = await supabase
        .from('platforms')
        .delete()
        .eq('id', id)

      if (error) throw error
      
      set(state => ({
        platforms: state.platforms.filter(p => p.id !== id),
        currentPlatform: state.currentPlatform?.id === id ? null : state.currentPlatform
      }))

      return true
    } catch (error) {
      set({ error: (error as Error).message })
      throw error
    } finally {
      set({ isLoading: false })
    }
  },

  setCurrentPlatform: async (id: string | null) => {
    try {
      if (!id) {
        console.log('Setting current platform to null');
        set({ currentPlatform: null, error: null });
        return;
      }

      console.log(`Attempting to set current platform to ${id}`);

      // First check if the platform exists in the current state
      const existingPlatform = get().platforms.find(p => p.id === id);
      if (existingPlatform) {
        console.log(`Platform ${id} found in local state, setting as current`);
        set({ currentPlatform: existingPlatform, error: null });
        return;
      }

      console.log(`Platform ${id} not found in local state, fetching from database`);
      
      // If not found in state, try to fetch from database
      const { data: rawData, error } = await supabase
        .from('platforms')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') { // Not found error
          console.warn(`Platform with ID ${id} not found in database`);
          
          // Check if we have any platforms at all
          const allPlatforms = get().platforms;
          if (allPlatforms.length > 0) {
            // Use the first available platform instead
            const firstPlatform = allPlatforms[0];
            console.log(`Using first available platform ${firstPlatform.id} instead`);
            set({ 
              currentPlatform: firstPlatform, 
              error: `Platform ${id} not found, using ${firstPlatform.name} instead` 
            });
            return;
          }
          
          set({ currentPlatform: null, error: `Platform with ID ${id} not found` });
          return;
        }
        console.error(`Error fetching platform ${id}:`, error);
        set({ currentPlatform: null, error: `Error fetching platform: ${error.message}` });
        return;
      }

      if (!rawData) {
        console.warn(`Platform with ID ${id} not found (no data returned)`);
        set({ currentPlatform: null, error: `Platform with ID ${id} not found` });
        return;
      }
      
      if (!isRawPlatform(rawData)) {
        console.error(`Invalid platform data received from server for ${id}:`, rawData);
        set({ currentPlatform: null, error: 'Invalid platform data received from server' });
        return;
      }

      const platform = convertToPlatform(rawData);
      console.log(`Successfully set current platform to ${id}:`, platform);
      set({ currentPlatform: platform, error: null });
    } catch (error) {
      console.error('Unexpected error setting current platform:', error);
      set({ 
        currentPlatform: null, 
        error: error instanceof Error ? error.message : 'An error occurred' 
      });
    }
  },

  resetPlatforms: () => {
    set({ platforms: [], currentPlatform: null })
  }
}))