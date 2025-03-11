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

export const useBrandStore = create<BrandStore>((set, get) => ({
  brands: [],
  currentBrand: null,
  isLoading: false,
  error: null,

  fetchBrands: async () => {
    set({ isLoading: true })
    try {
      const { data, error } = await supabase
        .from('brands')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      set({ brands: data as unknown as Brand[], error: null })

      const state = get()
      if (!state.currentBrand && data.length > 0) {
        set({ currentBrand: data[0] as unknown as Brand })
      }
    } catch (error) {
      set({ error: (error as Error).message })
    } finally {
      set({ isLoading: false })
    }
  },

  createBrand: async (brand) => {
    set({ isLoading: true })
    try {
      const { data, error } = await supabase
        .from('brands')
        .insert([brand])
        .select()

      if (error) throw error
      
      set(state => ({
        brands: [...state.brands, data[0] as unknown as Brand],
        currentBrand: data[0] as unknown as Brand
      }))
    } catch (error) {
      set({ error: (error as Error).message })
    } finally {
      set({ isLoading: false })
    }
  },

  updateBrand: async (id, updates) => {
    set({ isLoading: true })
    try {
      const { data, error } = await supabase
        .from('brands')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      
      set(state => ({
        brands: state.brands.map(b => 
          b.id === id ? { ...b, ...data } as Brand : b
        )
      }))
    } catch (error) {
      set({ error: (error as Error).message })
    } finally {
      set({ isLoading: false })
    }
  },

  deleteBrand: async (id) => {
    set({ isLoading: true })
    try {
      const { error } = await supabase
        .from('brands')
        .delete()
        .eq('id', id)

      if (error) throw error
      
      set(state => ({
        brands: state.brands.filter(b => b.id !== id),
        currentBrand: state.currentBrand && state.currentBrand.id === id ? null : state.currentBrand
      }))
    } catch (error) {
      set({ error: (error as Error).message })
    } finally {
      set({ isLoading: false })
    }
  },

  setCurrentBrand: async (id: string | null) => {
    try {
      if (!id) {
        set({ currentBrand: null })
        return
      }

      const state = get()
      const brand = state.brands.find(b => b.id === id)
      if (brand) {
        set({ currentBrand: brand as unknown as Brand })
      } else {
        const { data, error } = await supabase
          .from('brands')
          .select('*')
          .eq('id', id)
          .single()

        if (error) throw error
        set({ currentBrand: data as unknown as Brand })
      }
    } catch (error) {
      set({ error: (error as Error).message })
    }
  },

  fetchBrand: async (brandId) => {
    set({ isLoading: true })
    try {
      const { data, error } = await supabase
        .from('brands')
        .select('*')
        .eq('id', brandId)
        .single()

      if (error) throw error
      
      set({ 
        currentBrand: data as unknown as Brand,
        error: null 
      })
    } catch (error) {
      set({ error: (error as Error).message })
    } finally {
      set({ isLoading: false })
    }
  }
}))