import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '@/lib/supabase'
import { usePlatformStore } from './platform-store'
import { useTypographyStore } from './typography'

export interface Brand {
  id: string
  name: string
  description: string | null
  type: 'master' | 'sub'
  created_at: string
  updated_at: string
}

interface BrandStore {
  brands: Brand[]
  currentBrand: Brand | null
  isLoading: boolean
  error: string | null
  fetchBrands: () => Promise<void>
  createBrand: (brand: { 
    name: string
    description?: string | null
    type: 'master' | 'sub' 
  }) => Promise<void>
  updateBrand: (id: string, updates: Partial<Brand>) => Promise<void>
  deleteBrand: (id: string) => Promise<void>
  setCurrentBrand: (id: string | null) => Promise<void>
  fetchBrand: (brandId: string) => Promise<void>
}

// Type for raw brand data from Supabase
type RawBrandResponse = {
  id: string;
  name: string;
  description: string | null;
  type: 'master' | 'sub';
  created_at: string;
  updated_at: string;
}

// Type guard for raw brand data
function isBrand(obj: unknown): obj is Brand {
  if (!obj || typeof obj !== 'object') return false;
  
  const b = obj as any;
  return (
    typeof b.id === 'string' &&
    typeof b.name === 'string' &&
    (b.description === null || typeof b.description === 'string') &&
    (b.type === 'master' || b.type === 'sub') &&
    typeof b.created_at === 'string' &&
    typeof b.updated_at === 'string'
  );
}

export const useBrandStore = create<BrandStore>((set, get) => ({
  brands: [],
  currentBrand: null,
  isLoading: false,
  error: null,

  fetchBrands: async () => {
    try {
      const { data: rawData, error } = await supabase
        .from('brands')
        .select('*')
        .returns<RawBrandResponse[]>()

      if (error) throw error
      if (!rawData) throw new Error('No brands found')

      const validBrands = rawData.filter(isBrand)
      if (validBrands.length !== rawData.length) {
        console.warn('Some brand data was invalid and filtered out')
      }

      set({ 
        brands: validBrands,
        error: null 
      })
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'An error occurred' })
    }
  },

  createBrand: async (brand) => {
    try {
      const { data: rawData, error } = await supabase
        .from('brands')
        .insert([brand])
        .select()
        .returns<RawBrandResponse>()
        .single()

      if (error) throw error
      if (!rawData) throw new Error('Failed to create brand')
      if (!isBrand(rawData)) throw new Error('Invalid brand data received from server')

      set((state) => ({
        brands: [...state.brands, rawData],
        currentBrand: rawData
      }))
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'An error occurred' })
      throw error
    }
  },

  updateBrand: async (id, updates) => {
    try {
      const { data: rawData, error } = await supabase
        .from('brands')
        .update(updates)
        .eq('id', id)
        .select()
        .returns<RawBrandResponse>()
        .single()

      if (error) throw error
      if (!rawData) throw new Error('Brand not found')
      if (!isBrand(rawData)) throw new Error('Invalid brand data received from server')

      set((state) => ({
        brands: state.brands.map((b) => (b.id === id ? rawData : b)),
        currentBrand: state.currentBrand?.id === id ? rawData : state.currentBrand
      }))
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'An error occurred' })
      throw error
    }
  },

  deleteBrand: async (id) => {
    try {
      const { error } = await supabase
        .from('brands')
        .delete()
        .eq('id', id)

      if (error) throw error

      set((state) => ({
        brands: state.brands.filter((b) => b.id !== id),
        currentBrand: state.currentBrand?.id === id ? null : state.currentBrand
      }))
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'An error occurred' })
      throw error
    }
  },

  setCurrentBrand: async (id) => {
    try {
      if (!id) {
        set({ currentBrand: null })
        return
      }

      const { data: rawData, error } = await supabase
        .from('brands')
        .select('*')
        .eq('id', id)
        .returns<RawBrandResponse>()
        .single()

      if (error) throw error
      if (!rawData) throw new Error('Brand not found')
      if (!isBrand(rawData)) throw new Error('Invalid brand data received from server')

      set({ currentBrand: rawData })
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'An error occurred' })
    }
  },

  fetchBrand: async (brandId) => {
    try {
      const { data: rawData, error } = await supabase
        .from('brands')
        .select('*')
        .eq('id', brandId)
        .returns<RawBrandResponse>()
        .single()

      if (error) throw error
      if (!rawData) throw new Error('Brand not found')
      if (!isBrand(rawData)) throw new Error('Invalid brand data received from server')

      set({ currentBrand: rawData })
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'An error occurred' })
    }
  }
}))