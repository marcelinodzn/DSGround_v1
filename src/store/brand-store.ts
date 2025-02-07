import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '@/lib/supabase'

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
  currentBrand: string | null
  isLoading: boolean
  error: string | null
  fetchBrands: () => Promise<void>
  createBrand: (brand: { 
    name: string; 
    description?: string | null; 
    type: 'master' | 'sub' 
  }) => Promise<void>
  updateBrand: (id: string, updates: Partial<Brand>) => Promise<void>
  deleteBrand: (id: string) => Promise<void>
  setCurrentBrand: (id: string | null) => void
}

export const useBrandStore = create<BrandStore>()(
  persist(
    (set, get) => ({
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
          set({ brands: data, error: null })

          const state = get()
          if (!state.currentBrand && data.length > 0) {
            set({ currentBrand: data[0].id })
          }
        } catch (error) {
          set({ error: (error as Error).message })
        } finally {
          set({ isLoading: false })
        }
      },

      createBrand: async (brand) => {
        try {
          const { data, error } = await supabase
            .from('brands')
            .insert({
              name: brand.name,
              description: brand.description || null,
              type: brand.type
            })
            .select()

          if (error) {
            console.error('Supabase error:', error)
            throw error
          }
          
          if (!data) throw new Error('No data returned from insert')
          
          set(state => ({ 
            brands: [...state.brands, data[0]],
            error: null
          }))
        } catch (error) {
          console.error('Create brand error:', error)
          set({ error: (error as Error).message })
          throw error
        }
      },

      updateBrand: async (id, updates) => {
        try {
          const { data, error } = await supabase
            .from('brands')
            .update({
              ...updates,
              updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()

          if (error) throw error
          set(state => ({
            brands: state.brands.map(b => b.id === id ? data[0] : b),
            error: null
          }))
        } catch (error) {
          set({ error: (error as Error).message })
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
          set(state => ({
            brands: state.brands.filter(b => b.id !== id),
            error: null
          }))
        } catch (error) {
          set({ error: (error as Error).message })
          throw error
        }
      },

      setCurrentBrand: (id) => set({ currentBrand: id })
    }),
    {
      name: 'brand-store',
      partialize: (state) => ({ currentBrand: state.currentBrand })
    }
  )
) 