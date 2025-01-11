import { create } from 'zustand'

export type ScaleMethod = 'modular' | 'distance' | 'ai'
export type TextType = 'continuous' | 'isolated'
export type LightingCondition = 'good' | 'moderate' | 'poor'

export interface Platform {
  id: string
  name: string
  scaleMethod: ScaleMethod
  scale: {
    type: string
    ratio: number
    baseSize: number
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

const defaultScale = {
  type: 'Major Third',
  ratio: 1.25,
  baseSize: 16,
}

const defaultDistanceScale = {
  viewingDistance: 45,
  visualAcuity: 1.0,
  meanLengthRatio: 1.0,
  textType: 'continuous' as const,
  lighting: 'good' as const,
  ppi: 96,
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
    scale: { ...defaultScale },
    distanceScale: { ...defaultDistanceScale, ppi: 96 },
    accessibility: { ...defaultAccessibility }
  },
  {
    id: 'mobile',
    name: 'Mobile',
    scaleMethod: 'modular',
    scale: { ...defaultScale, baseSize: 14 },
    distanceScale: { ...defaultDistanceScale, ppi: 326, viewingDistance: 30 },
    accessibility: { ...defaultAccessibility }
  },
  {
    id: 'watch',
    name: 'Watch',
    scaleMethod: 'modular',
    scale: { ...defaultScale, baseSize: 12 },
    distanceScale: { ...defaultDistanceScale, ppi: 326, viewingDistance: 25 },
    accessibility: { ...defaultAccessibility }
  },
  {
    id: 'vr',
    name: 'VR',
    scaleMethod: 'distance',
    scale: { ...defaultScale, baseSize: 24 },
    distanceScale: { ...defaultDistanceScale, ppi: 1440, viewingDistance: 50 },
    accessibility: { ...defaultAccessibility }
  },
  {
    id: 'tv',
    name: 'TV',
    scaleMethod: 'distance',
    scale: { ...defaultScale, baseSize: 32 },
    distanceScale: { ...defaultDistanceScale, ppi: 72, viewingDistance: 300 },
    accessibility: { ...defaultAccessibility }
  },
  {
    id: 'ar',
    name: 'AR',
    scaleMethod: 'distance',
    scale: { ...defaultScale, baseSize: 20 },
    distanceScale: { ...defaultDistanceScale, ppi: 1440, viewingDistance: 60 },
    accessibility: { ...defaultAccessibility }
  },
  {
    id: 'outdoor',
    name: 'Outdoor',
    scaleMethod: 'distance',
    scale: { ...defaultScale, baseSize: 48 },
    distanceScale: { ...defaultDistanceScale, ppi: 72, viewingDistance: 500 },
    accessibility: { ...defaultAccessibility }
  },
  {
    id: 'instore',
    name: 'In-Store',
    scaleMethod: 'distance',
    scale: { ...defaultScale, baseSize: 36 },
    distanceScale: { ...defaultDistanceScale, ppi: 72, viewingDistance: 200 },
    accessibility: { ...defaultAccessibility }
  },
  {
    id: 'print',
    name: 'Print',
    scaleMethod: 'modular',
    scale: { ...defaultScale },
    distanceScale: { ...defaultDistanceScale, ppi: 300, viewingDistance: 40 },
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
