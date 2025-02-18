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
      set({ brands: data, error: null })

      const state = get()
      if (!state.currentBrand && data.length > 0) {
        await get().setCurrentBrand(data[0].id)
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
        .single()

      if (error) throw error
      
      set(state => ({
        brands: [...state.brands, data],
        currentBrand: data.id
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
          b.id === id ? { ...b, ...data } : b
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
        currentBrand: state.currentBrand === id ? null : state.currentBrand
      }))
    } catch (error) {
      set({ error: (error as Error).message })
    } finally {
      set({ isLoading: false })
    }
  },

  setCurrentBrand: async (id) => {
    console.log("setCurrentBrand called with id:", id)
    set({ currentBrand: id })
    
    if (id) {
      const platformStore = usePlatformStore.getState()
      
      // Reset platform store
      platformStore.resetPlatforms()
      
      // Fetch platforms for the new brand
      console.log("Fetching platforms for brand id:", id)
      await platformStore.fetchPlatforms(id)
      
      // Get all platforms for this brand
      const { platforms } = platformStore
      console.log("Platforms fetched:", platforms)
      if (platforms.length > 0) {
        // Try to find "Always active" platform first
        const alwaysActivePlatform = platforms.find(p => p.name === "Always active")
        const platformToSelect = alwaysActivePlatform || platforms[0]
        console.log("Platform to select:", platformToSelect)
        
        // Set the current platform
        platformStore.setCurrentPlatform(platformToSelect.id)
        
        // Fetch typography data for the selected platform
        const typographyStore = useTypographyStore.getState()
        await Promise.all([
          typographyStore.fetchTypographySettings(platformToSelect.id),
          typographyStore.fetchTypeStyles(platformToSelect.id)
        ])
      } else {
        console.log("No platforms found for brand id:", id)
        platformStore.setCurrentPlatform('') // Clear the current platform
      }
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
        currentBrand: data,
        error: null 
      })
    } catch (error) {
      set({ error: (error as Error).message })
    } finally {
      set({ isLoading: false })
    }
  }
}))