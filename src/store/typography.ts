import { create } from 'zustand'

export type ScaleMethod = 'modular' | 'distance' | 'ai'
export type TextType = 'continuous' | 'isolated'
export type LightingCondition = 'good' | 'moderate' | 'poor'

export interface Platform {
  name: string
  baseSize: number
  lineHeight: number
  letterSpacing: number
  ppi?: number // Pixels per inch for the device
}

interface TypographyState {
  scaleMethod: ScaleMethod
  scale: {
    type: string
    ratio: number
    baseSize: number
  }
  distanceScale: {
    viewingDistance: number // in centimeters
    visualAcuity: number // decimal value (e.g., 1.0 for 20/20)
    meanLengthRatio: number // mean length-font size ratio
    textType: TextType
    lighting: LightingCondition
    ppi: number // pixels per inch
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
  setDistanceScale: (updates: Partial<TypographyState['distanceScale']>) => void
  calculateDistanceBasedSize: () => number
}

const calculateDistanceBasedSize = (
  distance: number,
  visualAcuity: number,
  meanLengthRatio: number,
  textType: TextType,
  lighting: LightingCondition,
  ppi: number
): number => {
  // Constants from leserlich.info calculation
  const MIN_VISUAL_ANGLE = 0.21 // Minimum visual angle in degrees
  const LIGHTING_FACTORS = {
    good: 1,
    moderate: 1.25,
    poor: 1.5
  }
  const TEXT_TYPE_FACTORS = {
    continuous: 1,
    isolated: 1.5
  }

  // Convert distance from cm to mm
  const distanceInMm = distance * 10

  // Calculate base size using visual angle formula
  const visualAngleRad = (MIN_VISUAL_ANGLE * Math.PI) / 180
  let baseSize = 2 * distanceInMm * Math.tan(visualAngleRad / 2)

  // Apply visual acuity adjustment
  baseSize = baseSize / visualAcuity

  // Apply mean length ratio
  baseSize = baseSize * meanLengthRatio

  // Apply lighting and text type factors
  baseSize = baseSize * LIGHTING_FACTORS[lighting] * TEXT_TYPE_FACTORS[textType]

  // Convert mm to pixels using PPI
  const pixelSize = (baseSize * ppi) / 25.4 // 25.4 mm per inch

  return Math.round(pixelSize)
}

export const useTypographyStore = create<TypographyState>((set, get) => ({
  scaleMethod: 'modular',
  scale: {
    type: 'Major Third',
    ratio: 1.25,
    baseSize: 16,
  },
  distanceScale: {
    viewingDistance: 45, // Default 45cm
    visualAcuity: 1.0, // Default 20/20 vision
    meanLengthRatio: 1.0,
    textType: 'continuous',
    lighting: 'good',
    ppi: 96 // Default web PPI
  },
  platforms: [
    { name: 'Web', baseSize: 16, lineHeight: 1.5, letterSpacing: 0, ppi: 96 },
    { name: 'Mobile', baseSize: 14, lineHeight: 1.4, letterSpacing: 0, ppi: 326 },
    { name: 'Tablet', baseSize: 16, lineHeight: 1.5, letterSpacing: 0, ppi: 264 },
    { name: 'Desktop', baseSize: 16, lineHeight: 1.5, letterSpacing: 0, ppi: 96 },
    { name: 'VR/AR', baseSize: 24, lineHeight: 1.6, letterSpacing: 0.5, ppi: 1440 },
    { name: 'Wearables', baseSize: 12, lineHeight: 1.3, letterSpacing: 0, ppi: 326 },
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
  setDistanceScale: (updates) =>
    set((state) => ({
      distanceScale: {
        ...state.distanceScale,
        ...updates,
      },
    })),
  calculateDistanceBasedSize: () => {
    const state = get()
    const { viewingDistance, visualAcuity, meanLengthRatio, textType, lighting, ppi } = state.distanceScale
    return calculateDistanceBasedSize(
      viewingDistance,
      visualAcuity,
      meanLengthRatio,
      textType,
      lighting,
      ppi
    )
  }
}))
