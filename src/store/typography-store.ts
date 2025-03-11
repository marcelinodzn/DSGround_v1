import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import { type TypeStyle, type Platform } from '@/types/typography'

// Define TypographySettings interface here since it's not exported from elsewhere
interface TypographySettings {
  scale: {
    baseSize: number;
    ratio: number;
    stepsUp: number;
    stepsDown: number;
  };
  // Add other properties as needed
}

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
  settings: TypographySettings | null
  styles: TypeStyle[]
  isLoading: boolean
  error: string | null
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
  fetchTypographySettings: (platformId: string) => Promise<void>
  fetchTypeStyles: (platformId: string) => Promise<void>
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
      set({ settings: data as TypographySettings | null })
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
      set({ styles: data as TypeStyle[] })
    } catch (error) {
      set({ error: (error as Error).message })
    } finally {
      set({ isLoading: false })
    }
  }
})) 