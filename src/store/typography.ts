import { create } from 'zustand'

export type ScaleMethod = 'modular' | 'distance' | 'ai'

export interface Platform {
  name: string
  baseSize: number
  lineHeight: number
  letterSpacing: number
}

interface TypographyState {
  scaleMethod: ScaleMethod
  scale: {
    type: string
    ratio: number
    baseSize: number
  }
  platforms: Platform[]
  accessibility: {
    minContrastBody: number
    minContrastLarge: number
    viewingDistance: number
  }
  setScaleMethod: (method: ScaleMethod) => void
  setScale: (type: string, ratio: number, baseSize: number) => void
  updatePlatform: (name: string, updates: Partial<Platform>) => void
  setAccessibility: (updates: Partial<TypographyState['accessibility']>) => void
}

export const useTypographyStore = create<TypographyState>((set) => ({
  scaleMethod: 'modular',
  scale: {
    type: 'Major Third',
    ratio: 1.25,
    baseSize: 16,
  },
  platforms: [
    { name: 'Web', baseSize: 16, lineHeight: 1.5, letterSpacing: 0 },
    { name: 'Mobile', baseSize: 14, lineHeight: 1.4, letterSpacing: 0 },
    { name: 'Tablet', baseSize: 16, lineHeight: 1.5, letterSpacing: 0 },
    { name: 'Desktop', baseSize: 16, lineHeight: 1.5, letterSpacing: 0 },
    { name: 'VR/AR', baseSize: 24, lineHeight: 1.6, letterSpacing: 0.5 },
    { name: 'Wearables', baseSize: 12, lineHeight: 1.3, letterSpacing: 0 },
  ],
  accessibility: {
    minContrastBody: 4.5,
    minContrastLarge: 3,
    viewingDistance: 1,
  },
  setScaleMethod: (method) =>
    set({ scaleMethod: method }),
  setScale: (type, ratio, baseSize) =>
    set((state) => ({
      scale: {
        ...state.scale,
        type,
        ratio,
        baseSize,
      },
    })),
  updatePlatform: (name, updates) =>
    set((state) => ({
      platforms: state.platforms.map((platform) =>
        platform.name === name ? { ...platform, ...updates } : platform
      ),
    })),
  setAccessibility: (updates) =>
    set((state) => ({
      accessibility: {
        ...state.accessibility,
        ...updates,
      },
    })),
}))
