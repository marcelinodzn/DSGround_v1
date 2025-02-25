import { create } from 'zustand'
import { supabase, type TypographySettings, type TypeStyle } from '@/lib/supabase'

interface TypographyState {
  platforms: {
    [key in Platform]: {
      styles: TypeStyle[]
      settings: {
        baseSize: number
        ratio: number
        steps: number
        scaleMethod: 'modular' | 'linear' | 'custom'
      }
    }
  }
  currentPlatform: Platform
  setCurrentPlatform: (platform: Platform) => void
  updatePlatformStyles: (platform: Platform, styles: TypeStyle[]) => void
  updatePlatformSettings: (
    platform: Platform,
    settings: {
      baseSize: number
      ratio: number
      steps: number
      scaleMethod: 'modular' | 'linear' | 'custom'
    }
  ) => void
}

export const useTypographyStore = create<TypographyState>((set, get) => ({
  platforms: {
    web: {
      styles: [],
      settings: {
        baseSize: 16,
        ratio: 1.25,
        steps: 6,
        scaleMethod: 'modular'
      }
    },
    ios: {
      styles: [],
      settings: {
        baseSize: 16,
        ratio: 1.2,
        steps: 6,
        scaleMethod: 'modular'
      }
    },
    android: {
      styles: [],
      settings: {
        baseSize: 16,
        ratio: 1.2,
        steps: 6,
        scaleMethod: 'modular'
      }
    }
  },
  currentPlatform: 'web',
  setCurrentPlatform: (platform) => set({ currentPlatform: platform }),
  updatePlatformStyles: (platform, styles) =>
    set((state) => ({
      platforms: {
        ...state.platforms,
        [platform]: {
          ...state.platforms[platform],
          styles
        }
      }
    })),
  updatePlatformSettings: (platform, settings) =>
    set((state) => ({
      platforms: {
        ...state.platforms,
        [platform]: {
          ...state.platforms[platform],
          settings
        }
      }
    })),
  settings: null,
  styles: [],
  isLoading: false,
  error: null,

  fetchTypographySettings: async (platformId) => {
    set({ isLoading: true })
    try {
      const { data, error } = await supabase
        .from('typography_settings')
        .select('*')
        .eq('platform_id', platformId)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      set({ settings: data || null })
    } catch (error) {
      set({ error: (error as Error).message })
    } finally {
      set({ isLoading: false })
    }
  },

  fetchTypeStyles: async (platformId) => {
    set({ isLoading: true })
    try {
      const { data, error } = await supabase
        .from('type_styles')
        .select('*')
        .eq('platform_id', platformId)
        .order('created_at', { ascending: true })

      if (error) throw error
      set({ styles: data })
    } catch (error) {
      set({ error: (error as Error).message })
    } finally {
      set({ isLoading: false })
    }
  }
})) 