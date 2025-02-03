import { create } from 'zustand'
import { Platform, TypeStyle } from '@/types/typography'

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

export const useTypographyStore = create<TypographyState>((set) => ({
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
    }))
})) 