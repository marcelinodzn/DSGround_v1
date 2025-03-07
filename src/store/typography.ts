import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { usePlatformStore } from "@/store/platform-store"
import { supabase } from '@/lib/supabase'
import { calculateDistanceBasedSize } from '@/lib/scale-calculations'
import { v4 as uuidv4 } from 'uuid'

// Function to upload an image to Supabase storage
export const uploadImageToStorage = async (base64Image: string, brandId: string, platformId: string): Promise<string | null> => {
  try {
    // Remove the data:image/png;base64, part
    const base64Data = base64Image.split(',')[1];
    if (!base64Data) return null;
    
    // Convert base64 to binary
    const binaryData = Buffer.from(base64Data, 'base64');
    
    // Generate a unique filename
    const filename = `${brandId}/${platformId}/${uuidv4()}.png`;
    
    // Use the 'images' bucket which should already exist in most Supabase projects
    // If you need to create a bucket, you'll need to do this in the Supabase dashboard
    // or use the createBucket API (requires admin privileges)
    const bucketName = 'images';
    
    // Upload to Supabase storage
    const { data, error } = await supabase
      .storage
      .from(bucketName)
      .upload(filename, binaryData, {
        contentType: 'image/png',
        upsert: false
      });
    
    if (error) {
      console.error('Error uploading image:', error);
      return null;
    }
    
    // Get the public URL
    const { data: { publicUrl } } = supabase
      .storage
      .from(bucketName)
      .getPublicUrl(filename);
    
    return publicUrl;
  } catch (error) {
    console.error('Error in uploadImageToStorage:', error);
    return null;
  }
};

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

export interface AIPrompt {
  timestamp: number
  deviceType?: string
  context?: string
  location?: string
  imageUrl?: string
  storedImageUrl?: string
  result: {
    recommendedBaseSize: number
    ratio: number
    stepsUp: number
    stepsDown: number
    recommendations?: string
    summaryTable?: string
    reasoning?: string
  }
}

export interface AIScale {
  recommendedBaseSize: number
  originalSizeInPx: number
  recommendations?: string
  summaryTable?: string
  reasoning?: string
  prompts?: AIPrompt[] // History of prompts used for this platform
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
  viewTab?: string
  analysisTab?: string
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
        // First check if platform exists in state
        const platformExists = get().platforms.some(p => p.id === platformId);
        
        if (!platformExists) {
          console.log(`Platform ${platformId} not found, initializing it first`);
          // Create a default platform with this ID
          const defaultPlatform: Platform = {
            id: platformId,
            name: 'New Platform',
            scaleMethod: 'modular',
            scale: { baseSize: 16, ratio: 1.2, stepsUp: 3, stepsDown: 2 },
            units: { typography: 'px', spacing: 'px', dimensions: 'px' },
            distanceScale: {
              viewingDistance: 400,
              visualAcuity: 1,
              meanLengthRatio: 5,
              textType: 'continuous',
              lighting: 'good',
              ppi: 96
            },
            accessibility: {
              minContrastBody: 4.5,
              minContrastLarge: 3
            },
            typeStyles: []
          };
          
          // Add the new platform to state
          set((state: TypographyState) => ({
            ...state,
            platforms: [...state.platforms, { ...defaultPlatform, ...updates }]
          }));
          return;
        }
        
        // If platform exists, update it
        set((state: TypographyState) => ({
          ...state,
          platforms: state.platforms.map((platform: Platform) => 
            platform.id === platformId 
              ? { ...platform, ...updates }
              : platform
          )
        }))
        
        // Then persist the changes to Supabase
        // We need to use setTimeout to ensure this runs after the state update
        setTimeout(() => {
          const store = get() as TypographyState
          const updatedPlatform = store.platforms.find(p => p.id === platformId)
          
          if (updatedPlatform) {
            // Only save the specific updates that were provided
            // This prevents overwriting other settings that weren't changed
            const settingsToSave: Partial<Platform> = {}
            
            // Check which properties were updated and include only those
            if (updates.scaleMethod !== undefined) settingsToSave.scaleMethod = updates.scaleMethod
            if (updates.scale !== undefined) settingsToSave.scale = updates.scale
            if (updates.distanceScale !== undefined) settingsToSave.distanceScale = updates.distanceScale
            if (updates.aiScale !== undefined) settingsToSave.aiScale = updates.aiScale
            
            // Only call saveTypographySettings if we have settings to save
            if (Object.keys(settingsToSave).length > 0) {
              store.saveTypographySettings(platformId, settingsToSave)
                .catch(error => {
                  console.error('Error saving typography settings:', error)
                  // Update the error state
                  set({ error: (error as Error).message })
                })
            }
          }
        }, 0)
      },

      getScaleValues: (platformId: string) => {
        const store = get() as TypographyState
        const platform = store.platforms.find((p: Platform) => p.id === platformId)
        
        if (!platform) {
          console.error('Platform not found', platformId)
          // Return default scale values instead of empty array
          return [
            { size: 12, ratio: 1.2, label: 'f-2' },
            { size: 14, ratio: 1.2, label: 'f-1' },
            { size: 16, ratio: 1.2, label: 'f0' },
            { size: 20, ratio: 1.2, label: 'f1' },
            { size: 24, ratio: 1.2, label: 'f2' },
            { size: 30, ratio: 1.2, label: 'f3' }
          ]
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
            const size = Math.round(distanceAdjustedBaseSize / Math.pow(ratio, i));
            steps.push({
              size,
              ratio,
              label: `f-${i}`
            })
          }
          
          // Add base size (f0)
          steps.push({
            size: Math.round(distanceAdjustedBaseSize),
            ratio,
            label: 'f0'
          })
          
          // Calculate steps above base
          for (let i = 1; i <= stepsUp; i++) {
            const size = Math.round(distanceAdjustedBaseSize * Math.pow(ratio, i));
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
          const size = Math.round(baseSize / Math.pow(ratio, i));
          steps.push({
            size,
            ratio,
            label: `f-${i}`
          })
        }
        
        // Add base size (f0)
        steps.push({
          size: Math.round(baseSize),
          ratio,
          label: 'f0'
        })
        
        // Calculate steps above base
        for (let i = 1; i <= stepsUp; i++) {
          const size = Math.round(baseSize * Math.pow(ratio, i));
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
          // Ensure AI settings are properly formatted
          const aiSettings = settings.aiScale ? {
            recommendedBaseSize: settings.aiScale.recommendedBaseSize || 0,
            originalSizeInPx: settings.aiScale.originalSizeInPx || 0,
            recommendations: settings.aiScale.recommendations || '',
            summaryTable: settings.aiScale.summaryTable || '',
            reasoning: settings.aiScale.reasoning || '',
            prompts: settings.aiScale.prompts || []
          } : null;
          
          // Check if settings already exist for this platform
          const { data: existingData, error: checkError } = await supabase
            .from('typography_settings')
            .select('platform_id')
            .eq('platform_id', platformId)
            
          if (checkError) throw checkError
          
          // If there are multiple rows, delete all but one
          if (existingData && existingData.length > 1) {
            console.log(`Found ${existingData.length} rows for platform ${platformId}, cleaning up...`);
            
            // Keep the first row and delete the rest
            const keepId = existingData[0].platform_id;
            const { error: deleteError } = await supabase
              .from('typography_settings')
              .delete()
              .eq('platform_id', platformId)
              .neq('platform_id', keepId);
              
            if (deleteError) throw deleteError;
          }
          
          if (existingData && existingData.length > 0) {
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
                ai_settings: aiSettings,
                view_tab: settings.viewTab,
                analysis_tab: settings.analysisTab
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
                ai_settings: aiSettings,
                view_tab: settings.viewTab,
                analysis_tab: settings.analysisTab
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
          console.error('Error saving typography settings:', error)
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
          
          if (error) throw error
          
          // Handle case where multiple rows are returned
          if (data && data.length > 0) {
            // Use the first row if multiple are found
            const settingsData = data[0];
            console.log('Typography settings response:', settingsData);
            
            // Map database format to our state format
            const settings = {
              scaleMethod: settingsData.scale_method as ScaleMethod,
              scale: settingsData.scale_config || { baseSize: 16, ratio: 1.2, stepsUp: 3, stepsDown: 2 },
              distanceScale: {
                viewingDistance: settingsData.distance_scale?.viewing_distance ?? 400,
                visualAcuity: settingsData.distance_scale?.visual_acuity ?? 1,
                meanLengthRatio: settingsData.distance_scale?.mean_length_ratio ?? 5,
                textType: (settingsData.distance_scale?.text_type as TextType) ?? 'continuous',
                lighting: (settingsData.distance_scale?.lighting as LightingCondition) ?? 'good',
                ppi: settingsData.distance_scale?.ppi ?? 96
              },
              // Properly handle AI settings
              aiScale: settingsData.ai_settings ? {
                recommendedBaseSize: settingsData.ai_settings.recommendedBaseSize || 0,
                originalSizeInPx: settingsData.ai_settings.originalSizeInPx || 0,
                recommendations: settingsData.ai_settings.recommendations || '',
                summaryTable: settingsData.ai_settings.summaryTable || '',
                reasoning: settingsData.ai_settings.reasoning || '',
                prompts: settingsData.ai_settings.prompts || []
              } : settingsData.scale_method === 'ai' ? {
                // If scale method is 'ai' but no ai_settings exist, create default ones
                recommendedBaseSize: settingsData.scale_config?.baseSize || 16,
                originalSizeInPx: settingsData.scale_config?.baseSize || 16,
                recommendations: '',
                summaryTable: '',
                reasoning: '',
                prompts: []
              } : undefined,
              // Include tab selections
              viewTab: settingsData.view_tab || 'scale',
              analysisTab: settingsData.analysis_tab || 'platform'
            }
            
            set((state: TypographyState): TypographyState => ({
              ...state,
              platforms: state.platforms.map((p: Platform) => 
                p.id === platformId ? { ...p, ...settings } as Platform : p
              ),
              isLoading: false,
              error: null
            }))
            
            // If there are multiple rows, clean up by deleting extras
            if (data.length > 1) {
              console.log(`Found ${data.length} rows for platform ${platformId}, cleaning up...`);
              
              // Keep the first row and delete the rest
              const keepId = settingsData.platform_id;
              const { error: deleteError } = await supabase
                .from('typography_settings')
                .delete()
                .eq('platform_id', platformId)
                .neq('platform_id', keepId);
                
              if (deleteError) {
                console.error('Error cleaning up duplicate settings:', deleteError);
              }
            }
          }
        } catch (error) {
          console.error('Error fetching typography settings:', error)
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
    }),
    {
      name: 'typography-store'
    }
  )
)
