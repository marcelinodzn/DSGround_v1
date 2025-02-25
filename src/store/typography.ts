import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { usePlatformStore } from "@/store/platform-store"

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
}

interface TypographyState {
  currentPlatform: string
  platforms: Platform[]
  setCurrentPlatform: (platformId: string) => void
  updatePlatform: (platformId: string, updates: Partial<Platform>) => void
  getScaleValues: (platformId: string) => { size: number; ratio: number; label: string }[]
  copyTypeStylesToAllPlatforms: (sourceTypeStyles: TypeStyle[]) => void
  initializePlatform: (platformId: string) => void
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

export const useTypographyStore = create<TypographyState>()(
  persist(
    (set, get) => ({
      currentPlatform: '',
      platforms: [],
      
      setCurrentPlatform: (platformId) => {
        const state = get()
        // Initialize platform if it doesn't exist
        if (!state.platforms.find(p => p.id === platformId)) {
          get().initializePlatform(platformId)
        }
        set({ currentPlatform: platformId })
      },

      // Add this new function to initialize typography settings for a platform
      initializePlatform: (platformId) => {
        const platformStore = usePlatformStore.getState()
        const platformData = platformStore.platforms.find(p => p.id === platformId)
        
        if (!platformData) return

        set((state) => ({
          platforms: [...state.platforms, {
            id: platformId,
            name: platformData.name,
            scaleMethod: 'modular',
            scale: { ...defaultScale },
            units: {
              typography: platformData.units.typography,
              spacing: platformData.units.spacing,
              dimensions: platformData.units.dimensions
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
          }]
        }))
      },

      updatePlatform: (platformId, updates) => {
        const platformStore = usePlatformStore.getState()
        const platformData = platformStore.platforms.find(p => p.id === platformId)

        set((state) => ({
          platforms: state.platforms.map((platform) =>
            platform.id === platformId
              ? { ...platform, ...updates }
              : platform
          ),
        }))
      },

      getScaleValues: (platformId) => {
        const platform = get().platforms.find(p => p.id === platformId);
        if (!platform) return [];

        const { baseSize, ratio, stepsUp, stepsDown } = platform.scale;
        const scaleValues = [];

        // Calculate base size for distance method
        let effectiveBaseSize = Math.round(baseSize); // Ensure consistent rounding
        if (platform.scaleMethod === 'distance') {
          const { viewingDistance, visualAcuity, meanLengthRatio, textType, lighting, ppi } = platform.distanceScale;
          
          // Constants
          const MIN_VISUAL_ANGLE = 0.21;
          const LIGHTING_FACTORS = { good: 1, moderate: 1.25, poor: 1.5 };
          const TEXT_TYPE_FACTORS = { continuous: 1, isolated: 1.5 };

          // Convert distance from cm to mm
          const distanceInMm = viewingDistance * 10;

          // Calculate base size using visual angle formula
          const visualAngleRad = (MIN_VISUAL_ANGLE * Math.PI) / 180;
          let calculatedSize = 2 * distanceInMm * Math.tan(visualAngleRad / 2);

          // Apply adjustments
          calculatedSize = calculatedSize / visualAcuity;
          calculatedSize = calculatedSize * meanLengthRatio;
          calculatedSize = calculatedSize * LIGHTING_FACTORS[lighting] * TEXT_TYPE_FACTORS[textType];

          // Convert mm to pixels and ensure consistent rounding
          effectiveBaseSize = Math.round((calculatedSize * ppi) / 25.4);
        }

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

      // Modify the copyTypeStylesToAllPlatforms function
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
    }),
    {
      name: 'typography-store',
    }
  )
)
