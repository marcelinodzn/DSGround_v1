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
  icon: string | null
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

  addPlatform: async (brandId: string, platform: Partial<Platform>) => {
    try {
      const { data, error } = await supabase
        .from('platforms')
        .insert({
          brand_id: brandId,
          name: platform.name || 'New Platform',
          description: platform.description || '',
          units: {
            typography: 'rem',
            spacing: 'rem',
            dimensions: 'px'
          },
          layout: {
            baseSize: 16,
            gridColumns: 12,
            gridGutter: 24,
            containerPadding: 24
          }
        })
        .select()
        .single()

      if (error) throw error

      const newPlatform = data as Platform
      
      set(state => ({
        platforms: [...state.platforms, newPlatform]
      }))

      return newPlatform
    } catch (error) {
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

      const updatedPlatform = data as Platform
      
      set(state => ({
        platforms: state.platforms.map(p => 
          p.id === id ? updatedPlatform : p
        ),
        currentPlatform: state.currentPlatform?.id === id ? updatedPlatform : state.currentPlatform
      }))

      return updatedPlatform
    } catch (error) {
      throw error
    }
  },

  deletePlatform: async (id: string) => {
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
      throw error
    }
  },

  setCurrentPlatform: async (id: string | null) => {
    if (!id) {
      set({ currentPlatform: null })
      return
    }

    try {
      const { data, error } = await supabase
        .from('platforms')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      
      set({ currentPlatform: data as Platform })
    } catch (error) {
      set({ error: (error as Error).message })
    }
  },

  resetPlatforms: () => {
    set({ platforms: [], currentPlatform: null })
  }
}))