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

export const usePlatformStore = create<PlatformStore>((set, get) => ({
  platforms: [],
  currentPlatform: null,
  isLoading: false,
  error: null,

  getPlatform: async (id: string) => {
    set({ isLoading: true })
    try {
      const { data, error } = await supabase
        .from('platforms')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      
      if (!data) throw new Error('Platform not found')

      const platform = data as Platform
      set({ 
        currentPlatform: platform,
        error: null
      })
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'An error occurred' })
    } finally {
      set({ isLoading: false })
    }
  },

  fetchPlatformsByBrand: async (brandId: string) => {
    set({ isLoading: true })
    try {
      const { data, error } = await supabase
        .from('platforms')
        .select('*')
        .eq('brand_id', brandId)

      if (error) throw error

      if (!data) throw new Error('No platforms found')

      const platforms = data as Platform[]
      set({ platforms, error: null })
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'An error occurred' })
    } finally {
      set({ isLoading: false })
    }
  },

  fetchPlatforms: async () => {
    console.warn('Deprecated: Use fetchPlatformsByBrand instead')
    set({ platforms: [], currentPlatform: null })
  },

  addPlatform: async (brandId: string, platform: Partial<Platform>) => {
    try {
      const { data, error } = await supabase
        .from('platforms')
        .insert([
          {
            brand_id: brandId,
            name: platform.name,
            description: platform.description,
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
        ])
        .select()
        .single()

      if (error) throw error
      
      if (!data) throw new Error('Failed to create platform')

      const newPlatform = data as Platform
      set((state) => ({
        platforms: [...state.platforms, newPlatform]
      }))

      return newPlatform
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

      const updatedPlatform = data as Platform
      set((state) => ({
        platforms: state.platforms.map((p) =>
          p.id === id ? updatedPlatform : p
        ),
        currentPlatform: state.currentPlatform?.id === id ? updatedPlatform : state.currentPlatform
      }))

      return updatedPlatform
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

      const { data, error } = await supabase
        .from('platforms')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error

      if (!data) throw new Error('Platform not found')

      const platform = data as Platform
      set({ currentPlatform: platform })
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'An error occurred' })
    }
  },

  resetPlatforms: () => {
    set({ platforms: [], currentPlatform: null })
  }
}))