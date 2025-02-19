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
}

export interface AIScale {
  recommendedBaseSize: number
  originalSizeInPx: number
  recommendations?: string
  summaryTable?: string
}

export interface Platform {
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
  currentPlatform: string
  platforms: Platform[]
  isLoading: boolean
  error: string | null
  setCurrentPlatform: (platformId: string) => void
  updatePlatform: (platformId: string, updates: Partial<Platform>) => void
  getScaleValues: (platformId: string) => { size: number; ratio: number; label: string }[]
  copyTypeStylesToAllPlatforms: (sourceTypeStyles: TypeStyle[]) => void
  initializePlatform: (platformId: string) => void
  saveTypeStyles: (platformId: string, styles: TypeStyle[]) => Promise<void>
  saveTypographySettings: (platformId: string, settings: Partial<Platform>) => Promise<void>
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
    id: 'heading1',
    name: 'Heading 1',
    scaleStep: 'f5',
    fontWeight: 700,
    lineHeight: 1.2,
    opticalSize: 32,
    letterSpacing: -0.01
  },
  {
    id: 'body',
    name: 'Body',
    scaleStep: 'f0',
    fontWeight: 400,
    lineHeight: 1.5,
    opticalSize: 16,
    letterSpacing: 0
  }
]

const initialPlatforms: Platform[] = [
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

export const useTypographyStore = create<TypographyState>((set, get) => ({
  currentPlatform: '',
  platforms: [],
  isLoading: false,
  error: null,

  setCurrentPlatform: (platformId: string) => {
    set({ currentPlatform: platformId })
    // Fetch typography settings if they don't exist
    const state = get()
    if (platformId && !state.platforms.find(p => p.id === platformId)) {
      get().fetchTypographySettings(platformId)
    }
  },

  initializePlatform: async (platformId: string) => {
    const platformStore = usePlatformStore.getState()
    const platformData = platformStore.platforms.find(p => p.id === platformId)
    
    if (!platformData) {
      console.error('Platform not found:', platformId)
      return
    }

    const defaultSettings = {
      id: platformId,
      scaleMethod: 'modular' as ScaleMethod,
      scale: {
        baseSize: 16,
        ratio: 1.2,
        stepsUp: 3,
        stepsDown: 2
      },
      distanceScale: {
        viewingDistance: 400,
        visualAcuity: 1,
        meanLengthRatio: 5,
        textType: 'continuous' as TextType,
        lighting: 'good' as LightingCondition,
        ppi: 96
      },
      accessibility: {
        minContrastBody: 4.5,
        minContrastLarge: 3
      },
      typeStyles: []
    }

    set(state => ({
      platforms: [...state.platforms, { ...defaultSettings }]
    }))

    // Save the default settings to the database
    await get().saveTypographySettings(platformId, defaultSettings)
  },

  updatePlatform: (platformId: string, updates: Partial<Platform>) => {
    set(state => ({
      platforms: state.platforms.map(platform => 
        platform.id === platformId 
          ? { ...platform, ...updates }
          : platform
      )
    }))
  },

  getScaleValues: (platformId) => {
    const platform = get().platforms.find(p => p.id === platformId);
    if (!platform) return [];

    let effectiveBaseSize = platform.scale.baseSize;
    
    // Calculate base size for distance method
    if (platform.scaleMethod === 'distance' && platform.distanceScale) {
      effectiveBaseSize = calculateDistanceBasedSize(
        platform.distanceScale.viewingDistance,
        platform.distanceScale.visualAcuity,
        platform.distanceScale.meanLengthRatio,
        platform.distanceScale.textType,
        platform.distanceScale.lighting,
        platform.distanceScale.ppi
      );
    }

    // Round the base size consistently
    effectiveBaseSize = Math.round(effectiveBaseSize * 100) / 100;

    // Generate scale values using the effective base size
    const scaleValues = [];

    const { baseSize, ratio, stepsUp, stepsDown } = platform.scale;

    // Generate decreasing values (f-n to f-1)
    for (let i = stepsDown; i > 0; i--) {
      const size = effectiveBaseSize / Math.pow(ratio, i);
      scaleValues.push({
        label: `f-${i}`,
        size: Math.round(size),
        ratio: Math.round((1 / Math.pow(ratio, i)) * 1000) / 1000
      });
    }

    // Add base size (f0)
    scaleValues.push({
      label: 'f0',
      size: effectiveBaseSize,
      ratio: 1
    });

    // Generate increasing values (f1 to fn)
    for (let i = 1; i <= stepsUp; i++) {
      const size = effectiveBaseSize * Math.pow(ratio, i);
      scaleValues.push({
        label: `f${i}`,
        size: Math.round(size),
        ratio: Math.round(Math.pow(ratio, i) * 1000) / 1000
      });
    }

    return scaleValues;
  },

  copyTypeStylesToAllPlatforms: (sourceTypeStyles: TypeStyle[]) => {
    set((state) => ({
      platforms: state.platforms.map(platform => {
        // Get existing type styles for this platform to preserve scale steps
        const existingTypeStyles = platform.typeStyles || [];
        
        // Create new type styles while preserving existing scale steps
        const newTypeStyles = sourceTypeStyles.map(style => {
          // Try to find matching style by name in existing platform styles
          const existingStyle = existingTypeStyles.find(ts => ts.name === style.name);
          
          return {
            ...style,
            id: crypto.randomUUID(),
            // Keep existing scale step if style exists, otherwise use the source scale step
            scaleStep: existingStyle?.scaleStep || style.scaleStep
          };
        });

        return {
          ...platform,
          typeStyles: newTypeStyles
        };
      }),
    }))
  },

  saveTypeStyles: async (platformId: string, styles: TypeStyle[]) => {
    set({ isLoading: true, error: null })
    try {
      const { error } = await supabase
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
    } catch (error) {
      set({ error: (error as Error).message })
    } finally {
      set({ isLoading: false })
    }
  },

  saveTypographySettings: async (platformId: string, settings: Partial<Platform>) => {
    set({ isLoading: true, error: null })
    try {
      const { error } = await supabase
        .from('typography_settings')
        .upsert({
          platform_id: platformId,
          scale_method: settings.scaleMethod,
          scale_config: settings.scale,
          distance_scale: settings.distanceScale,
          ai_settings: settings.aiSettings
        })
      if (error) throw error
    } catch (error) {
      set({ error: (error as Error).message })
    } finally {
      set({ isLoading: false })
    }
  },

  fetchTypeStyles: async (platformId: string) => {
    set({ isLoading: true })
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
      set({ 
        isLoading: false,
        error: (error as Error).message 
      })
    }
  },

  fetchTypographySettings: async (platformId: string) => {
    set({ isLoading: true })
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
      set({ 
        isLoading: false,
        error: (error as Error).message 
      })
    }
  }
}),
{
  name: 'typography-store',
}
)
