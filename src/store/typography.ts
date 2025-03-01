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
  fontFamily: string
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
    fontFamily: 'Arial',
    fontWeight: 700,
    lineHeight: 1.1,
    opticalSize: 48,
    letterSpacing: -0.02
  },
  {
    id: 'heading1',
    name: 'Heading 1',
    scaleStep: 'f5',
    fontFamily: 'Arial',
    fontWeight: 700,
    lineHeight: 1.2,
    opticalSize: 32,
    letterSpacing: -0.01
  },
  {
    id: 'body',
    name: 'Body',
    scaleStep: 'f0',
    fontFamily: 'Arial',
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
    units: {
      typography: 'rem',
      spacing: 'rem',
      dimensions: 'rem'
    },
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
    units: {
      typography: 'sp',
      spacing: 'dp',
      dimensions: 'dp'
    },
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
    units: {
      typography: 'px',
      spacing: 'px',
      dimensions: 'px'
    },
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
    units: {
      typography: 'pt',
      spacing: 'mm',
      dimensions: 'mm'
    },
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
    units: {
      typography: 'px',
      spacing: 'px',
      dimensions: 'px'
    },
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
    units: {
      typography: 'px',
      spacing: 'px',
      dimensions: 'px'
    },
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
    units: {
      typography: 'px',
      spacing: 'px',
      dimensions: 'px'
    },
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

export const useTypographyStore = create(
  persist(
    (set, get) => ({
      currentPlatform: '',
      platforms: initialPlatforms,
      isLoading: false,
      error: null,
      
      setCurrentPlatform: (platformId: string) => {
        set({ currentPlatform: platformId })
      },

      initializePlatform: async (platformId: string) => {
        const platformStore = usePlatformStore.getState()
        const platformData = platformStore.platforms.find(p => p.id === platformId)
        
        if (!platformData) {
          console.error('Platform not found:', platformId)
          return
        }

        const defaultSettings: Platform = {
          id: platformId,
          name: platformData.name,
          scaleMethod: 'modular' as ScaleMethod,
          scale: {
            baseSize: 16,
            ratio: 1.2,
            stepsUp: 3,
            stepsDown: 2
          },
          units: {
            typography: 'px',
            spacing: 'px',
            dimensions: 'px'
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

        set((state: TypographyState) => ({
          ...state,
          platforms: [...state.platforms, { ...defaultSettings }]
        }))

        // Save the default settings to the database
        await get().saveTypographySettings(platformId, defaultSettings)
      },

      updatePlatform: (platformId: string, updates: Partial<Platform>) => {
        set((state: TypographyState) => ({
          ...state,
          platforms: state.platforms.map((platform: Platform) => 
            platform.id === platformId 
              ? { ...platform, ...updates }
              : platform
          )
        }))
      },

      getScaleValues: (platformId: string) => {
        const store = get() as TypographyState
        const platform = store.platforms.find((p: Platform) => p.id === platformId)
        
        if (!platform) {
          console.error('Platform not found', platformId)
          return []
        }
        
        // Ensure we have valid scale values with defaults if missing
        const baseSize = platform.scale?.baseSize || 16;
        const ratio = platform.scale?.ratio || 1.2;
        const stepsUp = platform.scale?.stepsUp || 3;
        const stepsDown = platform.scale?.stepsDown || 2;
        
        console.log("Store getScaleValues:", {
          platformId,
          scaleMethod: platform.scaleMethod,
          baseSize,
          ratio,
          stepsUp,
          stepsDown
        });
        
        // Additional calculations for distance-based scaling
        if (platform.scaleMethod === 'distance') {
          const distanceAdjustedBaseSize = calculateDistanceBasedSize(
            platform.distanceScale.viewingDistance,
            platform.distanceScale.visualAcuity,
            platform.distanceScale.meanLengthRatio,
            platform.distanceScale.textType,
            platform.distanceScale.lighting,
            platform.distanceScale.ppi
          )
          
          console.log("Distance adjusted base size:", distanceAdjustedBaseSize);
          
          // Create an array of scale steps using the distance-adjusted base size
          const steps: { size: number; ratio: number; label: string }[] = []
          
          // Calculate steps below base
          for (let i = stepsDown; i > 0; i--) {
            const size = distanceAdjustedBaseSize / Math.pow(ratio, i)
            steps.push({
              size,
              ratio,
              label: `f-${i}`
            })
          }
          
          // Add base size (f0)
          steps.push({
            size: distanceAdjustedBaseSize,
            ratio,
            label: 'f0'
          })
          
          // Calculate steps above base
          for (let i = 1; i <= stepsUp; i++) {
            const size = distanceAdjustedBaseSize * Math.pow(ratio, i)
            steps.push({
              size,
              ratio,
              label: `f${i}`
            })
          }
          
          console.log(`Generated ${steps.length} scale values for distance method`);
          return steps
        }
        
        // For non-distance methods, use the original calculation
        const steps: { size: number; ratio: number; label: string }[] = []
        
        console.log(`Generating scale with baseSize=${baseSize}, ratio=${ratio}, stepsUp=${stepsUp}, stepsDown=${stepsDown}`);
        
        // Calculate steps below base
        for (let i = stepsDown; i > 0; i--) {
          const size = baseSize / Math.pow(ratio, i)
          steps.push({
            size,
            ratio,
            label: `f-${i}`
          })
        }
        
        // Add base size (f0)
        steps.push({
          size: baseSize,
          ratio,
          label: 'f0'
        })
        
        // Calculate steps above base
        for (let i = 1; i <= stepsUp; i++) {
          const size = baseSize * Math.pow(ratio, i)
          steps.push({
            size,
            ratio,
            label: `f${i}`
          })
        }
        
        console.log(`Generated ${steps.length} scale values for ${platform.scaleMethod} method`);
        return steps
      },

      copyTypeStylesToAllPlatforms: (sourceTypeStyles: TypeStyle[]) => {
        set((state: TypographyState): TypographyState => ({
          ...state,
          platforms: state.platforms.map((platform: Platform) => {
            // Get existing type styles for this platform to preserve scale steps
            const existingTypeStyles = platform.typeStyles || [];
            
            // Create a map of style names to scale steps for faster lookup
            const nameToScaleStep = new Map();
            existingTypeStyles.forEach((style: TypeStyle) => {
              nameToScaleStep.set(style.name, style.scaleStep);
            });
            
            // Create new styles preserving scale steps where possible
            const newStyles = sourceTypeStyles.map(style => ({
              ...style,
              // Use existing scale step if available, otherwise keep source scale step
              scaleStep: nameToScaleStep.has(style.name) 
                ? nameToScaleStep.get(style.name) 
                : style.scaleStep
            }));
            
            return {
              ...platform,
              typeStyles: newStyles
            };
          })
        }));
      },

      saveTypeStyles: async (platformId: string, styles: TypeStyle[]) => {
        set({ isLoading: true, error: null })
        try {
          // First, delete existing type styles for this platform
          const { error: deleteError } = await supabase
            .from('typography_styles')
            .delete()
            .eq('platform_id', platformId)
        
          if (deleteError) throw deleteError
        
          // Now insert the new styles
          const { error } = await supabase
            .from('typography_styles')
            .insert(styles.map(style => ({
              platform_id: platformId,
              name: style.name,
              scale_step: style.scaleStep,
              font_family: style.fontFamily,
              font_weight: style.fontWeight,
              line_height: style.lineHeight,
              letter_spacing: style.letterSpacing,
              optical_size: style.opticalSize
            })))
        
          if (error) throw error
        } catch (error) {
          set({ 
            isLoading: false,
            error: (error as Error).message 
          })
        }
      },

      saveTypographySettings: async (platformId: string, settings: Partial<Platform>) => {
        set({ isLoading: true, error: null })
        try {
          // Check if settings already exist for this platform
          const { data: existingData, error: checkError } = await supabase
            .from('typography_settings')
            .select('id')
            .eq('platform_id', platformId)
            .maybeSingle()
          
          if (checkError) throw checkError
          
          if (existingData) {
            // Update existing record
            const { error } = await supabase
              .from('typography_settings')
              .update({
                scale_method: settings.scaleMethod,
                scale_config: settings.scale,
                distance_scale: {
                  viewing_distance: settings.distanceScale?.viewingDistance,
                  visual_acuity: settings.distanceScale?.visualAcuity,
                  mean_length_ratio: settings.distanceScale?.meanLengthRatio,
                  text_type: settings.distanceScale?.textType,
                  lighting: settings.distanceScale?.lighting,
                  ppi: settings.distanceScale?.ppi,
                },
                ai_settings: settings.aiScale
              })
              .eq('platform_id', platformId)
            if (error) throw error
          } else {
            // Insert new record
            const { error } = await supabase
              .from('typography_settings')
              .insert({
                platform_id: platformId,
                scale_method: settings.scaleMethod,
                scale_config: settings.scale,
                distance_scale: {
                  viewing_distance: settings.distanceScale?.viewingDistance,
                  visual_acuity: settings.distanceScale?.visualAcuity,
                  mean_length_ratio: settings.distanceScale?.meanLengthRatio,
                  text_type: settings.distanceScale?.textType,
                  lighting: settings.distanceScale?.lighting,
                  ppi: settings.distanceScale?.ppi
                },
                ai_settings: settings.aiScale
              })
            if (error) throw error
          }
          
          // Update local state
          set((state: TypographyState): TypographyState => ({
            ...state,
            platforms: state.platforms.map((p: Platform) => 
              p.id === platformId ? { ...p, ...settings } as Platform : p
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

      fetchTypeStyles: async (platformId: string) => {
        set({ isLoading: true, error: null })
        try {
          const { data, error } = await supabase
            .from('typography_styles')
            .select('*')
            .eq('platform_id', platformId)

          if (error) throw error

          const styles: TypeStyle[] = data.map((style: any) => ({
            id: style.id as string,
            name: style.name as string,
            scaleStep: style.scale_step as string,
            fontFamily: style.font_family as string,
            fontWeight: style.font_weight as number,
            lineHeight: style.line_height as number,
            letterSpacing: style.letter_spacing as number,
            opticalSize: style.optical_size as number
          }))

          set((state: TypographyState): TypographyState => ({
            ...state,
            platforms: state.platforms.map((p: Platform) => 
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
        set({ isLoading: true, error: null })
        try {
          const { data, error } = await supabase
            .from('typography_settings')
            .select('*')
            .eq('platform_id', platformId)
            .maybeSingle()
          
          if (error) throw error
          
          if (data) {
            console.log('Typography settings response:', data)
            
            // Map database format to our state format
            const settings = {
              scaleMethod: data.scale_method as ScaleMethod,
              scale: data.scale_config || { baseSize: 16, ratio: 1.2, stepsUp: 3, stepsDown: 2 },
              distanceScale: {
                viewingDistance: data.distance_scale?.viewing_distance ?? 400,
                visualAcuity: data.distance_scale?.visual_acuity ?? 1,
                meanLengthRatio: data.distance_scale?.mean_length_ratio ?? 5,
                textType: (data.distance_scale?.text_type as TextType) ?? 'continuous',
                lighting: (data.distance_scale?.lighting as LightingCondition) ?? 'good',
                ppi: data.distance_scale?.ppi ?? 96
              },
              aiScale: data.ai_settings || undefined
            }
            
            set((state: TypographyState): TypographyState => ({
              ...state,
              platforms: state.platforms.map((p: Platform) => 
                p.id === platformId ? { ...p, ...settings } as Platform : p
              ),
              isLoading: false,
              error: null
            }))
          }
        } catch (error) {
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
