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
    typography: 'rem' | 'em' | 'ch' | 'ex' | 'vw' | 'vh' | '%' | 'px' | 'pt' | 'pc'
    spacing: 'rem' | 'em' | 'vw' | 'vh' | '%' | 'px'
    dimensions: '%' | 'vw' | 'vh' | 'px' | 'cm' | 'mm' | 'in' | 'm'
  }
  typography: 'rem' | 'em' | 'ch' | 'ex' | 'vw' | 'vh' | '%' | 'px' | 'pt' | 'pc'
  spacing: 'rem' | 'em' | 'vw' | 'vh' | '%' | 'px'
  dimensions: '%' | 'vw' | 'vh' | 'px' | 'cm' | 'mm' | 'in' | 'm'
  layout: {
    baseSize: number
    gridColumns: number
    gridGutter: number
    containerPadding: number
  }
  baseSize: number
  gridColumns: number
  gridGutter: number
  containerPadding: number
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
  resetPlatforms: () => void
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
        .order('created_at', { ascending: true })

      if (error) throw error
      set({ platforms: data, error: null })

      // Always set a platform if available, regardless of current selection
      if (data.length > 0) {
        set({ currentPlatform: data[0].id })
      } else {
        set({ currentPlatform: null })
      }
    } catch (error) {
      set({ error: (error as Error).message })
    } finally {
      set({ isLoading: false })
    }
  },

  addPlatform: async (brandId, platform) => {
    set({ isLoading: true })
    try {
      const { data, error } = await supabase
        .from('platforms')
        .insert([{ ...platform, brand_id: brandId }])
        .select()
        .single()

      if (error) throw error
      
      set(state => ({
        platforms: [...state.platforms, data],
        currentPlatform: data.id
      }))
    } catch (error) {
      set({ error: (error as Error).message })
    } finally {
      set({ isLoading: false })
    }
  },

  updatePlatform: async (id, updates) => {
    set({ isLoading: true })
    try {
      const { data, error } = await supabase
        .from('platforms')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      
      set(state => ({
        platforms: state.platforms.map(p => 
          p.id === id ? { ...p, ...data } : p
        )
      }))
    } catch (error) {
      set({ error: (error as Error).message })
    } finally {
      set({ isLoading: false })
    }
  },

  deletePlatform: async (id) => {
    set({ isLoading: true })
    try {
      const { error } = await supabase
        .from('platforms')
        .delete()
        .eq('id', id)

      if (error) throw error
      
      set(state => ({
        platforms: state.platforms.filter(p => p.id !== id),
        currentPlatform: state.currentPlatform === id ? null : state.currentPlatform
      }))
    } catch (error) {
      set({ error: (error as Error).message })
    } finally {
      set({ isLoading: false })
    }
  },

  setCurrentPlatform: (id) => {
    set({ currentPlatform: id })
  },

  resetPlatforms: () => {
    set({ platforms: [], currentPlatform: null })
  }
}))