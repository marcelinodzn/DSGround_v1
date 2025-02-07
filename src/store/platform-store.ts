'use client'

// Create a new store for platforms
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { supabase } from '@/lib/supabase'

export interface Platform {
  id: string
  brand_id: string
  name: string
  description: string | null
  units: {
    typography: 'rem' | 'em' | 'px'
    spacing: 'rem' | 'em' | 'px'
    dimensions: 'px' | '%' | 'vw' | 'vh'
  }
  layout: {
    baseSize: number
    gridColumns: number
    gridGutter: number
    containerPadding: number
  }
  created_at: string
  updated_at: string
}

interface PlatformStore {
  platforms: Platform[]
  currentPlatform: string | null
  isLoading: boolean
  error: string | null
  fetchPlatforms: (brandId: string) => Promise<void>
  addPlatform: (brandId: string, platform: {
    name: string
    description?: string | null
    units: Platform['units']
    layout: Platform['layout']
  }) => Promise<void>
  updatePlatform: (id: string, updates: Partial<Omit<Platform, 'id' | 'brand_id' | 'created_at'>>) => Promise<void>
  deletePlatform: (id: string) => Promise<void>
  setCurrentPlatform: (id: string | null) => void
}

export const usePlatformStore = create<PlatformStore>((set, get) => ({
  platforms: [],
  currentPlatform: null,
  isLoading: false,
  error: null,

  fetchPlatforms: async (brandId) => {
    set({ isLoading: true })
    try {
      const { data, error } = await supabase
        .from('platforms')
        .select('*')
        .eq('brand_id', brandId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Fetch platforms error:', error)
        throw error
      }
      set({ platforms: data || [], error: null })
    } catch (error) {
      console.error('Fetch platforms error:', error)
      set({ error: (error as Error).message })
    } finally {
      set({ isLoading: false })
    }
  },

  addPlatform: async (brandId, platform) => {
    try {
      const { data, error } = await supabase
        .from('platforms')
        .insert({
          brand_id: brandId,
          name: platform.name,
          description: platform.description || null,
          units: platform.units,
          layout: platform.layout
        })
        .select()

      if (error) {
        console.error('Add platform error:', error)
        throw error
      }

      if (!data) throw new Error('No data returned from insert')

      set(state => ({ 
        platforms: [...state.platforms, data[0]],
        error: null 
      }))
    } catch (error) {
      console.error('Add platform error:', error)
      set({ error: (error as Error).message })
      throw error
    }
  },

  updatePlatform: async (id, updates) => {
    try {
      const { data, error } = await supabase
        .from('platforms')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()

      if (error) {
        console.error('Update platform error:', error)
        throw error
      }

      set(state => ({
        platforms: state.platforms.map(p => p.id === id ? data[0] : p),
        error: null
      }))
    } catch (error) {
      console.error('Update platform error:', error)
      set({ error: (error as Error).message })
      throw error
    }
  },

  deletePlatform: async (id) => {
    try {
      const { error } = await supabase
        .from('platforms')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Delete platform error:', error)
        throw error
      }

      set(state => ({
        platforms: state.platforms.filter(p => p.id !== id),
        error: null
      }))
    } catch (error) {
      console.error('Delete platform error:', error)
      set({ error: (error as Error).message })
      throw error
    }
  },

  setCurrentPlatform: (id) => set({ currentPlatform: id })
})) 