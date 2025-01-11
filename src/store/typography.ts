import { create } from 'zustand'

export type ScaleMethod = 'modular' | 'distance' | 'ai'
export type TextType = 'continuous' | 'isolated'
export type LightingCondition = 'good' | 'moderate' | 'poor'

export interface Platform {
  id: string
  name: string
  scaleMethod: ScaleMethod
  scale: {
    baseSize: number
    ratio: number
  }
  distanceScale: {
    viewingDistance: number
    visualAcuity: number
    meanLengthRatio: number
    textType: TextType
    lighting: LightingCondition
    ppi: number
  }
  accessibility: {
    minContrastBody: number
    minContrastLarge: number
  }
}

interface TypographyState {
  currentPlatform: string
  platforms: Platform[]
  setCurrentPlatform: (platformId: string) => void
  updatePlatform: (platformId: string, updates: Partial<Platform>) => void
}

const defaultAccessibility = {
  minContrastBody: 4.5,
  minContrastLarge: 3,
}

const initialPlatforms: Platform[] = [
  {
    id: 'web',
    name: 'Web',
    scaleMethod: 'modular',
    scale: {
      baseSize: 16,
      ratio: 1.25
    },
    distanceScale: {
      viewingDistance: 50,
      visualAcuity: 1,
      meanLengthRatio: 1,
      textType: 'continuous' as const,
      lighting: 'good' as const,
      ppi: 96
    },
    accessibility: { ...defaultAccessibility }
  },
  {
    id: 'ios',
    name: 'iOS',
    scaleMethod: 'modular',
    scale: {
      baseSize: 16,
      ratio: 1.25
    },
    distanceScale: {
      viewingDistance: 30,
      visualAcuity: 1,
      meanLengthRatio: 1,
      textType: 'continuous' as const,
      lighting: 'good' as const,
      ppi: 264
    },
    accessibility: { ...defaultAccessibility }
  },
  {
    id: 'android',
    name: 'Android',
    scaleMethod: 'modular',
    scale: {
      baseSize: 16,
      ratio: 1.25
    },
    distanceScale: {
      viewingDistance: 30,
      visualAcuity: 1,
      meanLengthRatio: 1,
      textType: 'continuous' as const,
      lighting: 'good' as const,
      ppi: 160
    },
    accessibility: { ...defaultAccessibility }
  },
]

export const useTypographyStore = create<TypographyState>((set, get) => ({
  currentPlatform: 'web',
  platforms: initialPlatforms,
  setCurrentPlatform: (platformId) =>
    set({ currentPlatform: platformId }),
  updatePlatform: (platformId, updates) =>
    set((state) => ({
      platforms: state.platforms.map((platform) =>
        platform.id === platformId ? { ...platform, ...updates } : platform
      ),
    })),
}))
