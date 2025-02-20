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

  fetchPlatformsByBrand: async (brandId: string) => {
    set({ isLoading: true })
    try {
      const { data, error } = await supabase
        .from('platforms')
        .select('*')
        .eq('brand_id', brandId)
        .order('created_at', { ascending: false })

      if (error) throw error
      
      // Ensure proper typing of the data
      const typedData = (data || []) as Platform[]
      
      set({ 
        platforms: typedData,
        error: null,
        // Reset current platform when brand changes
        currentPlatform: null
      })
    } catch (error) {
      set({ error: (error as Error).message })
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
        .insert({
          brand_id: brandId,
          name: platform.name || 'New Platform',
          description: platform.description || '',
          units: platform.units || {
            typography: 'rem',
            spacing: 'rem',
            borderWidth: 'px',
            borderRadius: 'px'
          },
          layout: {
            ...(platform.layout || {
              gridColumns: 12,
              gridGutter: 16,
              containerPadding: 16
            }),
            icon: platform.layout?.icon
          }
        })
        .select()
        .single()

      if (error) throw error

      set((state) => ({
        platforms: [...state.platforms, data]
      }))

      return data
    } catch (error) {
      console.error('Error adding platform:', error)
      throw error
    }
  },

  updatePlatform: async (id, updates) => {
    set({ isLoading: true, error: null })
    try {
      const layoutUpdates = updates.layout ? {
        ...updates.layout,
        icon: updates.layout.icon
      } : undefined

      const { data, error } = await supabase
        .from('platforms')
        .update({
          ...updates,
          layout: layoutUpdates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      set((state) => ({
        platforms: state.platforms.map(p => p.id === id ? { ...p, ...updates } : p),
        currentPlatform: state.currentPlatform?.id === id ? { ...state.currentPlatform, ...updates } : state.currentPlatform,
        isLoading: false
      }))

      return data
    } catch (error) {
      console.error('Error updating platform:', error)
      set({ isLoading: false, error: error.message })
      throw error
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

      const state = get()
      const platform = state.platforms.find(p => p.id === id)
      if (platform) {
        set({ currentPlatform: platform })
      } else {
        const { data, error } = await supabase
          .from('platforms')
          .select('*')
          .eq('id', id)
          .single()

        if (error) throw error
        set({ currentPlatform: data as Platform })
      }
    } catch (error) {
      set({ error: (error as Error).message })
    }
  },

  resetPlatforms: () => {
    set({ platforms: [], currentPlatform: null })
  }
}))