import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { usePlatformStore } from "@/store/platform-store"
import { supabase } from '@/lib/supabase'
import { calculateDistanceBasedSize } from '@/lib/scale-calculations'

export type ScaleMethod = 'modular' | 'distance' | 'ai'
export type TextType = 'continuous' | 'isolated'
export type LightingCondition = 'good' | 'moderate' | 'poor'

export interface ScaleConfig {
  baseSize: number
  ratio: number
  stepsUp: number   // Number of steps above base
  stepsDown: number // Number of steps below base
}

export interface TypeStyle {
  id: string
  name: string
  scaleStep: string
  fontWeight: number
  lineHeight: number
  letterSpacing: number
  opticalSize: number
  fontFamily?: string
  fontCategory?: string
  isVariable?: boolean
}

export interface AIScale {
  recommendedBaseSize: number
  originalSizeInPx: number
  recommendations?: string
  summaryTable?: string
}

export interface TypographyPlatform {
  id: string
  name: string
  scaleMethod: ScaleMethod
  scale: ScaleConfig
  units: {
    typography: string
    spacing: string
    dimensions: string
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
  typeStyles: TypeStyle[]
  aiScale?: AIScale
  currentFontRole?: 'primary' | 'secondary' | 'tertiary'
  fontId?: string
}

interface TypographyState {
  currentPlatform: string | null
  platforms: TypographyPlatform[]
  isLoading: boolean
  error: string | null
  setCurrentPlatform: (platformId: string | null) => void
  updatePlatform: (platformId: string, updates: Partial<TypographyPlatform>) => void
  getScaleValues: (platformId: string) => { size: number; ratio: number; label: string }[]
  copyTypeStylesToAllPlatforms: (sourceTypeStyles: TypeStyle[]) => void
  initializePlatform: (platformId: string) => void
  saveTypeStyles: (platformId: string, styles: TypeStyle[]) => Promise<void>
  saveTypographySettings: (platformId: string, settings: Partial<TypographyPlatform>) => Promise<void>
  fetchTypeStyles: (platformId: string) => Promise<void>
  fetchTypographySettings: (platformId: string) => Promise<void>
}

const defaultAccessibility = {
  minContrastBody: 4.5,
  minContrastLarge: 3,
}

const defaultScale: ScaleConfig = {
  baseSize: 16,
  ratio: 1.25,
  stepsUp: 6,    // Will generate f1 through f6
  stepsDown: 2   // Will generate f-1 and f-2
}

const defaultTypeStyles: TypeStyle[] = [
  {
    id: 'display',
    name: 'Display',
    scaleStep: 'f6',
    fontWeight: 700,
    lineHeight: 1.1,
    opticalSize: 48,
    letterSpacing: -0.02
  },
  {
    id: 'h1',
    name: 'Heading 1',
    scaleStep: 'f5',
    fontWeight: 700,
    lineHeight: 1.2,
    opticalSize: 40,
    letterSpacing: -0.015
  },
  {
    id: 'h2',
    name: 'Heading 2',
    scaleStep: 'f4',
    fontWeight: 700,
    lineHeight: 1.3,
    opticalSize: 32,
    letterSpacing: -0.01
  },
  {
    id: 'h3',
    name: 'Heading 3',
    scaleStep: 'f3',
    fontWeight: 600,
    lineHeight: 1.4,
    opticalSize: 24,
    letterSpacing: -0.005
  },
  {
    id: 'h4',
    name: 'Heading 4',
    scaleStep: 'f2',
    fontWeight: 600,
    lineHeight: 1.4,
    opticalSize: 20,
    letterSpacing: 0
  },
  {
    id: 'h5',
    name: 'Heading 5',
    scaleStep: 'f1',
    fontWeight: 600,
    lineHeight: 1.5,
    opticalSize: 16,
    letterSpacing: 0
  },
  {
    id: 'body',
    name: 'Body',
    scaleStep: 'f0',
    fontWeight: 400,
    lineHeight: 1.6,
    opticalSize: 16,
    letterSpacing: 0
  },
  {
    id: 'small',
    name: 'Small',
    scaleStep: 'f-1',
    fontWeight: 400,
    lineHeight: 1.6,
    opticalSize: 14,
    letterSpacing: 0.01
  },
  {
    id: 'tiny',
    name: 'Tiny',
    scaleStep: 'f-2',
    fontWeight: 400,
    lineHeight: 1.6,
    opticalSize: 12,
    letterSpacing: 0.02
  }
]

const initialPlatforms: TypographyPlatform[] = [
  {
    id: 'web',
    name: 'Web',
    scaleMethod: 'modular',
    scale: { ...defaultScale },
    distanceScale: {
      viewingDistance: 50,
      visualAcuity: 1,
      meanLengthRatio: 1,
      textType: 'continuous',
      lighting: 'good',
      ppi: 96
    },
    accessibility: { ...defaultAccessibility },
    typeStyles: [...defaultTypeStyles]
  },
  {
    id: 'mobile',
    name: 'Mobile',
    scaleMethod: 'modular',
    scale: { ...defaultScale },
    distanceScale: {
      viewingDistance: 30,
      visualAcuity: 1,
      meanLengthRatio: 1,
      textType: 'continuous',
      lighting: 'good',
      ppi: 160
    },
    accessibility: { ...defaultAccessibility },
    typeStyles: [...defaultTypeStyles]
  },
  {
    id: 'outdoor',
    name: 'Outdoor',
    scaleMethod: 'distance',
    scale: { ...defaultScale },
    distanceScale: {
      viewingDistance: 300,
      visualAcuity: 1,
      meanLengthRatio: 1,
      textType: 'isolated',
      lighting: 'moderate',
      ppi: 72
    },
    accessibility: { ...defaultAccessibility },
    typeStyles: [...defaultTypeStyles]
  },
  {
    id: 'print',
    name: 'Print',
    scaleMethod: 'modular',
    scale: { ...defaultScale },
    distanceScale: {
      viewingDistance: 40,
      visualAcuity: 1,
      meanLengthRatio: 1,
      textType: 'continuous',
      lighting: 'good',
      ppi: 300
    },
    accessibility: { ...defaultAccessibility },
    typeStyles: [...defaultTypeStyles]
  },
  {
    id: 'instore',
    name: 'In-store',
    scaleMethod: 'distance',
    scale: { ...defaultScale },
    distanceScale: {
      viewingDistance: 100,
      visualAcuity: 1,
      meanLengthRatio: 1,
      textType: 'isolated',
      lighting: 'good',
      ppi: 72
    },
    accessibility: { ...defaultAccessibility },
    typeStyles: [...defaultTypeStyles]
  },
  {
    id: 'vr',
    name: 'VR',
    scaleMethod: 'distance',
    scale: { ...defaultScale },
    distanceScale: {
      viewingDistance: 20,
      visualAcuity: 1,
      meanLengthRatio: 1,
      textType: 'continuous',
      lighting: 'moderate',
      ppi: 1200
    },
    accessibility: { ...defaultAccessibility },
    typeStyles: [...defaultTypeStyles]
  },
  {
    id: 'tv',
    name: 'TV',
    scaleMethod: 'distance',
    scale: { ...defaultScale },
    distanceScale: {
      viewingDistance: 250,
      visualAcuity: 1,
      meanLengthRatio: 1,
      textType: 'continuous',
      lighting: 'moderate',
      ppi: 40
    },
    accessibility: { ...defaultAccessibility },
    typeStyles: [...defaultTypeStyles]
  },
]

export const useTypographyStore = create<TypographyState>()(
  persist(
    (set, get) => ({
      currentPlatform: null,
      platforms: initialPlatforms,
      isLoading: false,
      error: null,

      setCurrentPlatform: (platformId) => {
        set({ currentPlatform: platformId })
      },

      initializePlatform: (platformId) => {
        const { platforms } = get()
        const existingPlatform = platforms.find(p => p.id === platformId)

        if (!existingPlatform) {
          const newPlatform: TypographyPlatform = {
            id: platformId,
            name: 'New Platform',
            scaleMethod: 'modular',
            scale: { ...defaultScale },
            units: {
              typography: 'rem',
              spacing: 'rem',
              dimensions: 'px'
            },
            distanceScale: {
              viewingDistance: 500,
              visualAcuity: 1,
              meanLengthRatio: 0.7,
              textType: 'continuous',
              lighting: 'good',
              ppi: 96
            },
            accessibility: { ...defaultAccessibility },
            typeStyles: [...defaultTypeStyles]
          }

          set(state => ({
            platforms: [...state.platforms, newPlatform]
          }))
        }
      },

      updatePlatform: (platformId, updates) => {
        set(state => ({
          platforms: state.platforms.map(p => 
            p.id === platformId ? { ...p, ...updates } : p
          )
        }))
      },

      getScaleValues: (platformId) => {
        const { platforms } = get()
        const platform = platforms.find(p => p.id === platformId)
        if (!platform) return []

        const { scale, scaleMethod, distanceScale } = platform
        const { baseSize, ratio, stepsUp, stepsDown } = scale
        const steps = []

        let calculatedBaseSize = baseSize

        if (scaleMethod === 'distance') {
          calculatedBaseSize = calculateDistanceBasedSize(
            distanceScale.viewingDistance,
            distanceScale.visualAcuity,
            distanceScale.meanLengthRatio,
            distanceScale.textType,
            distanceScale.lighting,
            distanceScale.ppi
          )
        }

        // Generate scale using the calculated base size
        for (let i = -stepsDown; i <= stepsUp; i++) {
          const size = calculatedBaseSize * Math.pow(ratio, i)
          steps.push({
            size: Math.round(size * 100) / 100,
            ratio: i === 0 ? 1 : Math.round(Math.pow(ratio, i) * 1000) / 1000,
            label: `f${i}`
          })
        }

        return steps
      },

      copyTypeStylesToAllPlatforms: (sourceTypeStyles) => {
        set(state => ({
          platforms: state.platforms.map(platform => ({
            ...platform,
            typeStyles: [...sourceTypeStyles]
          }))
        }))
      },

      saveTypeStyles: async (platformId, styles) => {
        try {
          const { data, error } = await supabase
            .from('type_styles')
            .upsert(
              styles.map(style => ({
                platform_id: platformId,
                name: style.name,
                scale_step: style.scaleStep,
                font_weight: style.fontWeight,
                line_height: style.lineHeight,
                letter_spacing: style.letterSpacing,
                optical_size: style.opticalSize
              }))
            )

          if (error) throw error

          set(state => ({
            platforms: state.platforms.map(p => 
              p.id === platformId ? { ...p, typeStyles: styles } : p
            )
          }))
        } catch (error) {
          console.error('Error saving type styles:', error)
          throw error
        }
      },

      saveTypographySettings: async (platformId, settings) => {
        try {
          const { data, error } = await supabase
            .from('typography_settings')
            .upsert({
              platform_id: platformId,
              scale_method: settings.scaleMethod,
              scale_config: settings.scale,
              distance_scale: settings.distanceScale,
              ai_settings: settings.aiSettings
            })

          if (error) throw error

          set(state => ({
            platforms: state.platforms.map(p => 
              p.id === platformId ? { ...p, ...settings } : p
            )
          }))
        } catch (error) {
          console.error('Error saving typography settings:', error)
          throw error
        }
      },

      fetchTypeStyles: async (platformId) => {
        try {
          const { data, error } = await supabase
            .from('type_styles')
            .select('*')
            .eq('platform_id', platformId)

          if (error) throw error

          const styles = data.map(style => ({
            id: style.id,
            name: style.name,
            scaleStep: style.scale_step,
            fontWeight: style.font_weight,
            lineHeight: style.line_height,
            letterSpacing: style.letter_spacing,
            opticalSize: style.optical_size
          }))

          set(state => ({
            platforms: state.platforms.map(p => 
              p.id === platformId ? { ...p, typeStyles: styles } : p
            ),
            isLoading: false,
            error: null
          }))
        } catch (error) {
          console.error('Error fetching type styles:', error)
          throw error
        }
      },

      fetchTypographySettings: async (platformId) => {
        try {
          const { data, error } = await supabase
            .from('typography_settings')
            .select('*')
            .eq('platform_id', platformId)
            .single()

          if (error) {
            if (error.code === 'PGRST116') {
              // Initialize with default settings if none exist
              await get().initializePlatform(platformId)
              return
            }
            throw error
          }

          set(state => ({
            platforms: state.platforms.map(p => 
              p.id === platformId ? { ...p, ...data } : p
            ),
            isLoading: false,
            error: null
          }))
        } catch (error) {
          console.error('Error fetching typography settings:', error)
          set({ 
            isLoading: false,
            error: (error as Error).message 
          })
        }
      }
    }),
    {
      name: 'typography-store'
    }
  )
)
