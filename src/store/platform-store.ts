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
}

interface PlatformStore {
  platforms: Platform[]
  currentPlatform: Platform | null
  isLoading: boolean
  error: string | null
  fetchPlatformsByBrand: (brandId: string) => Promise<void>
  getPlatform: (id: string) => Promise<void>
  addPlatform: (brandId: string, platform: Partial<Platform>) => Promise<Platform>
  updatePlatform: (id: string, updates: Partial<Omit<Platform, 'id' | 'brand_id' | 'created_at'>>) => Promise<Platform>
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
}

// Type guard for raw platform data
function isRawPlatform(obj: unknown): obj is RawPlatform {
  if (!obj || typeof obj !== 'object') return false;
  
  const p = obj as any;
  
  // Basic required attributes check
  if (
    typeof p.id !== 'string' ||
    typeof p.brand_id !== 'string' ||
    typeof p.name !== 'string' ||
    (p.description !== null && typeof p.description !== 'string') ||
    typeof p.created_at !== 'string' ||
    typeof p.updated_at !== 'string'
  ) {
    console.warn('Platform missing basic required attributes:', p);
    return false;
  }
  
  // Units check with defaults if missing
  if (!p.units || typeof p.units !== 'object') {
    console.warn('Platform missing units, will add defaults:', p.id);
    p.units = {
      typography: 'rem',
      spacing: 'rem',
      borderWidth: 'px',
      borderRadius: 'px'
    };
  } else {
    // Ensure all unit properties exist
    if (typeof p.units.typography !== 'string') p.units.typography = 'rem';
    if (typeof p.units.spacing !== 'string') p.units.spacing = 'rem';
    if (typeof p.units.borderWidth !== 'string') p.units.borderWidth = 'px';
    if (typeof p.units.borderRadius !== 'string') p.units.borderRadius = 'px';
  }
  
  // Layout check with defaults if missing
  if (!p.layout || typeof p.layout !== 'object') {
    console.warn('Platform missing layout, will add defaults:', p.id);
    p.layout = {
      gridColumns: 12,
      gridGutter: 16,
      containerPadding: 16
    };
  } else {
    // Ensure all layout properties exist
    if (typeof p.layout.gridColumns !== 'number') p.layout.gridColumns = 12;
    if (typeof p.layout.gridGutter !== 'number') p.layout.gridGutter = 16;
    if (typeof p.layout.containerPadding !== 'number') p.layout.containerPadding = 16;
    if (p.layout.icon !== undefined && typeof p.layout.icon !== 'string') {
      delete p.layout.icon; // Remove invalid icon
    }
  }
  
  return true;
}

// Convert raw platform to Platform type
function convertToPlatform(raw: RawPlatform): Platform {
  return {
    ...raw,
    // Add any necessary transformations here
  };
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
    set({ isLoading: true });
    try {
      const { data: rawData, error } = await supabase
        .from('platforms')
        .select('*')
        .eq('brand_id', brandId);

      if (error) throw error;
      if (!rawData) throw new Error('No platforms found');
      
      const validPlatforms = rawData
        .filter(isRawPlatform)
        .map(convertToPlatform);

      if (validPlatforms.length !== rawData.length) {
        console.warn('Some platform data was invalid and filtered out');
      }

      set({ platforms: validPlatforms, error: null });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'An error occurred' });
    } finally {
      set({ isLoading: false });
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
      
      if (!isRawPlatform(data)) {
        throw new Error('Invalid platform data received from server')
      }

      set((state) => ({
        platforms: [...state.platforms, convertToPlatform(data)]
      }))

      return convertToPlatform(data)
    } catch (error) {
      console.error('Error adding platform:', error)
      throw error
    }
  },

  updatePlatform: async (id: string, updates: Partial<Omit<Platform, 'id' | 'brand_id' | 'created_at'>>) => {
    try {
      const { data, error } = await supabase
        .from('platforms')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      if (!data) throw new Error('Platform not found')
      
      if (!isRawPlatform(data)) {
        throw new Error('Invalid platform data received from server')
      }

      set((state) => ({
        platforms: state.platforms.map((p) =>
          p.id === id ? convertToPlatform(data) : p
        ),
        currentPlatform: state.currentPlatform?.id === id ? convertToPlatform(data) : state.currentPlatform
      }))

      return convertToPlatform(data)
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error updating platform:', error.message)
        throw error
      }
      throw new Error('An error occurred while updating the platform')
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
        set({ currentPlatform: null })
        return
      }

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

      set({ currentPlatform: convertToPlatform(rawData) })
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'An error occurred' })
    }
  },

  resetPlatforms: () => {
    set({ platforms: [], currentPlatform: null })
  }
}))