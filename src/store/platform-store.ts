'use client'

// Create a new store for platforms
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { supabase, type Platform } from '@/lib/supabase'

export interface Platform {
  id: string
  name: string
  description: string
  createdAt: string
  units: {
    typography: 'rem' | 'em' | 'ch' | 'ex' | 'vw' | 'vh' | '%' | 'px' | 'pt' | 'pc'
    spacing: 'rem' | 'em' | 'vw' | 'vh' | '%' | 'px'
    dimensions: '%' | 'vw' | 'vh' | 'px' | 'cm' | 'mm' | 'in' | 'm'
  }
  layout: {
    baseSize: number
    gridColumns: number
    gridGutter: number
    containerPadding: number
  }
}

interface PlatformStore {
  platforms: Platform[]
  currentPlatform: string | null
  isLoading: boolean
  error: string | null
  fetchPlatforms: (brandId: string) => Promise<void>
  addPlatform: (brandId: string, platform: Omit<Platform, 'id' | 'brand_id'>) => Promise<void>
  updatePlatform: (id: string, updates: Partial<Platform>) => Promise<void>
  deletePlatform: (id: string) => Promise<void>
  duplicatePlatform: (id: string) => Promise<void>
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

      if (error) throw error
      set({ platforms: data || [], error: null })
    } catch (error) {
      set({ error: (error as Error).message })
    } finally {
      set({ isLoading: false })
    }
  },

  addPlatform: async (brandId, platform) => {
    try {
      const { data, error } = await supabase
        .from('platforms')
        .insert([{
          ...platform,
          brand_id: brandId,
          created_at: new Date().toISOString()
        }])
        .select()

      if (error) throw error
      set(state => ({ 
        platforms: [...state.platforms, data[0]],
        error: null 
      }))
    } catch (error) {
      set({ error: (error as Error).message })
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

      if (error) throw error
      set(state => ({
        platforms: state.platforms.map(p => p.id === id ? data[0] : p),
        error: null
      }))
    } catch (error) {
      set({ error: (error as Error).message })
    }
  },

  deletePlatform: async (id) => {
    try {
      const { error } = await supabase
        .from('platforms')
        .delete()
        .eq('id', id)

      if (error) throw error
      set(state => ({
        platforms: state.platforms.filter(p => p.id !== id),
        error: null
      }))
    } catch (error) {
      set({ error: (error as Error).message })
    }
  },

  duplicatePlatform: async (id) => {
    try {
      const platform = get().platforms.find(p => p.id === id)
      if (!platform) return

      const { data, error } = await supabase
        .from('platforms')
        .insert([{
          ...platform,
          id: undefined, // Let Supabase generate new ID
          name: `${platform.name} (Copy)`,
          created_at: new Date().toISOString()
        }])
        .select()

      if (error) throw error
      set(state => ({ 
        platforms: [...state.platforms, data[0]],
        error: null 
      }))
    } catch (error) {
      set({ error: (error as Error).message })
    }
  },
})) 