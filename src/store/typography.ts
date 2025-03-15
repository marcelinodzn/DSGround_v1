import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { usePlatformStore } from "@/store/platform-store"
import { supabase } from '@/lib/supabase'
import { calculateDistanceBasedSize } from '@/lib/scale-calculations'
import { v4 as uuidv4 } from 'uuid'
import { notifySyncStarted, notifySyncCompleted, notifySyncError } from '@/components/supabase-sync-manager'
import { TypographySettings } from '@/types/typography'

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
  lineHeightUnit?: 'multiplier' | 'percent'
  letterSpacing: number
  opticalSize: number
  fontSize?: number
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize'
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
  baseSize?: number
  units: {
    typography: string
    spacing: string
    dimensions: string
    borderWidth: string
    borderRadius: string
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
  // Track platforms that are currently being initialized to prevent infinite loops
  _initializingPlatforms: Set<string>
  setCurrentPlatform: (platformId: string) => void
  updatePlatform: (platformId: string, updates: Partial<Platform>) => void
  getScaleValues: (platformId: string) => { size: number; ratio: number; label: string }[]
  copyTypeStylesToAllPlatforms: (sourceTypeStyles: TypeStyle[]) => void
  initializePlatform: (platformId: string) => void
  saveTypeStyles: (platformId: string, styles: TypeStyle[]) => Promise<void>
  saveTypographySettings: (platformId: string, settings: Partial<Platform>) => Promise<void>
  fetchTypeStyles: (platformId: string) => Promise<void>
  fetchTypographySettings: (platformId: string) => Promise<void>
  setPlatforms: (updatedPlatforms: Platform[]) => void
  setupRealTimeSync: () => (() => void) | void
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
      dimensions: 'rem',
      borderWidth: 'px',
      borderRadius: 'px'
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
      dimensions: 'dp',
      borderWidth: 'px',
      borderRadius: 'px'
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
      dimensions: 'px',
      borderWidth: 'px',
      borderRadius: 'px'
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
      spacing: 'pt',
      dimensions: 'pt',
      borderWidth: 'pt',
      borderRadius: 'pt'
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
      dimensions: 'px',
      borderWidth: 'px',
      borderRadius: 'px'
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
      dimensions: 'px',
      borderWidth: 'px',
      borderRadius: 'px'
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
      dimensions: 'px',
      borderWidth: 'px',
      borderRadius: 'px'
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

// Add a circuit breaker to prevent too many consecutive updates
let consecutiveUpdates: Record<string, { count: number, lastUpdate: number }> = {};
const UPDATE_THRESHOLD = 5;  // Max updates allowed in 1 second
const UPDATE_WINDOW = 1000;  // Time window in milliseconds

export const useTypographyStore = create<TypographyState>()(
  persist(
    (set, get) => ({
      currentPlatform: '',
      platforms: initialPlatforms,
      isLoading: false,
      error: null,
      
      // Track platforms that are currently being initialized to prevent infinite loops
      _initializingPlatforms: new Set<string>(),
      
      setCurrentPlatform: (platformId: string) => {
        set({ currentPlatform: platformId })
      },
      
      setPlatforms: (updatedPlatforms: Platform[]) => {
        set({ platforms: updatedPlatforms })
      },
      
      initializePlatform: async (platformId: string) => {
        // Check if this platform is already being initialized to prevent infinite loops
        const state = get();
        
        // Ensure _initializingPlatforms is a Set
        if (!state._initializingPlatforms || !(state._initializingPlatforms instanceof Set)) {
          console.log('[Typography] Re-initializing _initializingPlatforms as a new Set');
          state._initializingPlatforms = new Set<string>();
        }
        
        if (state._initializingPlatforms.has(platformId)) {
          console.log(`[Typography] Skipping initialization for platform ${platformId} - already in progress`)
          return;
        }
        
        // Add to tracking set
        state._initializingPlatforms.add(platformId);
        
        console.log(`[Typography] Initializing platform ${platformId}`)
        const platformStore = usePlatformStore.getState()
        const platformData = platformStore.platforms.find(p => 
          p.id === platformId || p.name.toLowerCase() === platformId.toLowerCase()
        )
        
        if (!platformData) {
          console.log(`[Typography] Platform ${platformId} not found in platform store, creating with default values`)
          // Create a new platform with default values
          const newPlatform: Platform = {
            id: platformId,
            name: platformId, // Use the platformId as the name
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
              dimensions: 'px',
              borderWidth: 'px',
              borderRadius: 'px'
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
            typeStyles: defaultTypeStyles,
            viewTab: 'scale',
            analysisTab: 'distance'
          }
          
          // Update state with the new platform
          set(state => ({
            platforms: [...state.platforms, newPlatform]
          }));
          
          // Remove from tracking set
          (get() as any)._initializingPlatforms.delete(platformId);
          return;
        }

        console.log(`[Typography] Found platform data for ${platformId}:`, platformData)

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
          units: platformData.units || {
            typography: 'px',
            spacing: 'px',
            dimensions: 'px',
            borderWidth: 'px',
            borderRadius: 'px'
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
          typeStyles: [...defaultTypeStyles]
        }

        console.log(`[Typography] Setting up default settings for platform ${platformId}:`, defaultSettings)

        set((state: TypographyState) => {
          // Check if platform already exists
          const platformExists = state.platforms.some(p => p.id === platformId);
          
          if (platformExists) {
            console.log(`[Typography] Platform ${platformId} already exists in state, updating it`)
            return {
              ...state,
              platforms: state.platforms.map(p => 
                p.id === platformId ? { ...p, ...defaultSettings } : p
              )
            }
          } else {
            console.log(`[Typography] Platform ${platformId} doesn't exist in state, adding it`)
            return {
              ...state,
              platforms: [...state.platforms, { ...defaultSettings }]
            }
          }
        })

        console.log(`[Typography] Saving default settings to database for platform ${platformId}`)
        
        try {
          // Save the default settings to the database
          await get().saveTypographySettings(platformId, defaultSettings)
          console.log(`[Typography] Successfully saved default settings to database for platform ${platformId}`)
          
          // Save the default type styles to the database
          await get().saveTypeStyles(platformId, defaultTypeStyles)
          console.log(`[Typography] Successfully saved default type styles to database for platform ${platformId}`)
        } catch (error) {
          console.error(`[Typography] Error saving default settings for platform ${platformId}:`, error)
        } finally {
          // Always remove from tracking set to prevent infinite loops
          get()._initializingPlatforms.delete(platformId);
        }
      },

      updatePlatform: (platformId: string, updates: Partial<Platform>) => {
        // Circuit breaker to prevent excessive updates
        // Track consecutive updates for each platform to prevent infinite loops
        const consecutiveUpdates = {
          count: 0,
          lastUpdate: 0,
          platformIds: {} as Record<string, {count: number, lastUpdate: number}>
        };
        
        if (!consecutiveUpdates.platformIds[platformId]) {
          consecutiveUpdates.platformIds[platformId] = { count: 0, lastUpdate: Date.now() };
        }
        
        // If we've had too many updates in a short period, skip this one
        const platformUpdates = consecutiveUpdates.platformIds[platformId];
        const now = Date.now();
        const timeSinceLastUpdate = now - platformUpdates.lastUpdate;
        
        // Reset counter if it's been more than 1 second since last update
        if (timeSinceLastUpdate > 1000) {
          platformUpdates.count = 0;
        }
        
        // Update counters
        platformUpdates.count++;
        platformUpdates.lastUpdate = now;
        
        // Circuit breaker: if too many updates in succession, skip this one
        if (platformUpdates.count > 5) {
          console.warn(`[Typography] Too many updatePlatform calls for ${platformId} (${platformUpdates.count}), skipping to prevent loop`);
          return;
        }
        
        // First check if platform exists in state
        set((state: TypographyState) => {
          const existingPlatformIndex = state.platforms.findIndex(p => p.id === platformId);
          const platformExists = existingPlatformIndex !== -1;
          
          console.log(`[Typography] Updating platform ${platformId}. Platform exists: ${platformExists}`);
          console.log(`[Typography] Updates:`, updates);
          
          // Skip update if nothing to change and platform already exists
          const hasUpdates = Object.keys(updates).length > 0;
          if (!hasUpdates && platformExists) {
            console.log(`[Typography] No updates provided for platform ${platformId}, skipping`);
            return state;
          }
          
          if (platformExists) {
            // Create a copy of platforms array
            const updatedPlatforms = [...state.platforms];
            
            // Safely merge the current platform with updates
            const currentPlatform = updatedPlatforms[existingPlatformIndex];
            
            // Handle special case of fontId and currentFontRole updates
            if ('fontId' in updates || 'currentFontRole' in updates) {
              console.log(`[Typography] Updating font role for platform ${platformId}`);
              
              // Special case fonts data should only update if both are provided
              if (updates.currentFontRole) {
                currentPlatform.currentFontRole = updates.currentFontRole;
              }
              
              if ('fontId' in updates) {
                currentPlatform.fontId = updates.fontId;
              }
              
              updatedPlatforms[existingPlatformIndex] = {
                ...currentPlatform
              };
            } else {
              // Normal case - merge all updates
              updatedPlatforms[existingPlatformIndex] = {
                ...currentPlatform,
                ...updates
              };
            }
            
            // If currentPlatform matches the platformId, also update it
            const newCurrentPlatform = 
              state.currentPlatform === platformId 
                ? updatedPlatforms[existingPlatformIndex] 
                : undefined;
            
            return {
              ...state,
              platforms: updatedPlatforms,
              ...(newCurrentPlatform ? { currentPlatform: platformId } : {})
            };
          } else {
            console.log(`Platform ${platformId} not found, initializing it first`);
            // Create a default platform with this ID
            const defaultPlatform: Platform = {
              id: platformId,
              name: 'New Platform',
              scaleMethod: 'modular',
              scale: { baseSize: 16, ratio: 1.2, stepsUp: 3, stepsDown: 2 },
              units: { 
                typography: 'px', 
                spacing: 'px', 
                dimensions: 'px', 
                borderWidth: 'px', 
                borderRadius: 'px' 
              },
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
              typeStyles: [],
              ...(updates.currentFontRole ? { currentFontRole: updates.currentFontRole } : {}),
              ...(updates.fontId !== undefined ? { fontId: updates.fontId } : {})
            };
            
            // Add the new platform to state with updates (except special font cases handled above)
            const updatesWithoutSpecialCases = { ...updates };
            delete updatesWithoutSpecialCases.currentFontRole;
            delete updatesWithoutSpecialCases.fontId;
            
            return {
              ...state,
              platforms: [...state.platforms, { ...defaultPlatform, ...updatesWithoutSpecialCases }]
            };
          }
        });
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

      saveTypeStyles: async (platformId: string, styles: TypeStyle[]): Promise<void> => {
        set({ isLoading: true, error: null })
        try {
          console.log(`Saving type styles for platform ${platformId}:`, styles)
          
          // Find platform in state
          const existingPlatform = get().platforms.find(p => p.id === platformId)
          if (!existingPlatform) {
            console.error(`Platform ${platformId} not found, can't save type styles`)
            set({ error: `Platform ${platformId} not found` })
            return // Just return undefined instead of false
          }
          
          // Update type styles in the database
          const { error } = await supabase.from('platforms')
            .update({ type_styles: styles })
            .eq('id', platformId)
            
          if (error) {
            console.error(`Error updating type styles for platform ${platformId}:`, error)
            set({ error: `Error updating type styles: ${error.message}` })
            return // Just return undefined instead of false
          }
          
          // Update platform in state
          const updatedPlatforms = get().platforms.map(p => 
            p.id === platformId 
              ? { ...p, typeStyles: styles } 
              : p
          )
          
          set({
            platforms: updatedPlatforms,
            error: null
          })
          
          console.log(`Successfully saved type styles for platform ${platformId}`)
          // No explicit return needed for void return type
        } catch (error) {
          console.error(`Exception in saveTypeStyles for platform ${platformId}:`, error)
          set({ error: `Error saving type styles: ${error instanceof Error ? error.message : String(error)}` })
        } finally {
          set({ isLoading: false })
        }
      },

      saveTypographySettings: async (platformId: string, settings: Partial<Platform>) => {
        console.log(`[Typography] Saving typography settings for platform ${platformId}:`, settings);
        
        // Notify sync started
        notifySyncStarted();
        
        try {
          // Get the current platform state to ensure we have all necessary data
          const currentPlatforms = get().platforms;
          const currentPlatform = currentPlatforms.find(p => p.id === platformId);
          
          if (!currentPlatform) {
            console.error(`[Typography] Cannot save settings: Platform ${platformId} not found in store`);
            notifySyncError(`Cannot save settings: Platform not found`);
            return;
          }
          
          console.log(`[Typography] Current platform state before save:`, currentPlatform);
          
          // First, check if there are existing settings for this platform
          const { data: existingSettings, error: checkError } = await supabase
            .from('typography_settings')
            .select('*')
            .eq('platform_id', platformId);
          
          if (checkError) {
            console.error(`[Typography] Error checking existing settings for platform ${platformId}:`, checkError);
            notifySyncError(`Error checking existing settings: ${checkError.message}`);
            return;
          }
          
          // Clean up multiple records for the same platform if they exist (data integrity)
          if (existingSettings && existingSettings.length > 1) {
            console.log(`Found ${existingSettings.length} rows for platform ${platformId}, cleaning up...`);
            
            try {
              // Keep only the most recent record, delete the others
              const idsToKeep = [existingSettings[0].id];
              const idsToDelete = existingSettings
                .slice(1)
                .map((s: { id: string }) => s.id);
              
              if (idsToDelete.length > 0) {
                const { error: deleteError } = await supabase
                  .from('typography_settings')
                  .delete()
                  .in('id', idsToDelete);
                
                if (deleteError) {
                  console.error(`[Typography] Error cleaning up duplicate settings:`, deleteError);
                  // Continue anyway, we can still update the first record
                }
              }
            } catch (error) {
              console.error(`[Typography] Error during cleanup:`, error);
              // Continue anyway, we can still try to update
            }
          }
          
          // Prepare the base update data with only fields that are always in the schema
          // Create a merged settings object with current platform data and new settings
          const mergedSettings = {
            ...currentPlatform,
            ...settings
          };
          
          console.log(`[Typography] Merged settings for save:`, mergedSettings);
          
          // Always use data from the merged settings to ensure we have complete data
          // Use a Record type to allow for dynamic properties
          const baseUpdateData: Record<string, any> = {
            platform_id: platformId,
            scale_method: mergedSettings.scaleMethod,
            scale_config: mergedSettings.scale || {},
            distance_scale: mergedSettings.distanceScale || {}
          };
          
          // Add AI settings if available
          if (mergedSettings.aiScale) {
            baseUpdateData.ai_settings = {
              recommendedBaseSize: mergedSettings.aiScale.recommendedBaseSize || 0,
              originalSizeInPx: mergedSettings.aiScale.originalSizeInPx || 0,
              recommendations: mergedSettings.aiScale.recommendations || '',
              summaryTable: mergedSettings.aiScale.summaryTable || '',
              reasoning: mergedSettings.aiScale.reasoning || '',
              prompts: mergedSettings.aiScale.prompts || []
            };
          }
          
          // Check if type_styles exists in the schema by examining existing records
          let hasTypeStylesColumn = false;
          if (existingSettings && existingSettings.length > 0) {
            hasTypeStylesColumn = 'type_styles' in existingSettings[0];
            console.log(`[Typography] Schema check: type_styles column ${hasTypeStylesColumn ? 'exists' : 'does not exist'}`); 
          }
          
          // Only add type_styles if the column exists or we're not sure yet
          if (hasTypeStylesColumn || existingSettings?.length === 0) {
            try {
              baseUpdateData.type_styles = JSON.stringify(mergedSettings.typeStyles || []);
            } catch (e) {
              console.error(`[Typography] Error stringifying typeStyles:`, e);
              baseUpdateData.type_styles = '[]';
            }
          }
          
          // Optional fields (that might not be in the schema yet)
          const optionalFields: Record<string, any> = {};
          
          // Only add these fields if they're defined in the settings
          if (settings.viewTab !== undefined) {
            optionalFields.view_tab = settings.viewTab;
          }
          
          if (settings.analysisTab !== undefined) {
            optionalFields.analysis_tab = settings.analysisTab;
          }
          
          if (existingSettings && existingSettings.length > 0) {
            console.log(`[Typography] Updating existing typography settings for platform ${platformId}`);
            
            // Update existing record
            const updateData = {
              ...baseUpdateData,
              ...optionalFields
            };
            
            console.log(`[Typography] Update data:`, updateData);
            
            // First try with all fields
            let data;
            let error;
            
            try {
              const result = await supabase
                .from('typography_settings')
                .update(updateData)
                .eq('id', (existingSettings[0] as { id: string }).id)
                .select();
              
              data = result.data;
              error = result.error;
              
              // If there's an error about a column not existing, remove problematic fields and try again
              if (error && (error.code === 'PGRST204' || error.code === '42703') && error.message && (error.message.includes('column') || error.message.includes('type_styles'))) {
                console.warn(`[Typography] Column error detected: ${error.message}. Retrying with base fields only.`);
                
                // Remove the type_styles field if it's causing problems
                const safeUpdateData = { ...baseUpdateData };
                delete safeUpdateData.type_styles;
                console.log(`[Typography] Retrying update without type_styles field:`, safeUpdateData);
                
                const baseResult = await supabase
                  .from('typography_settings')
                  .update(safeUpdateData)
                  .eq('id', (existingSettings[0] as { id: string }).id)
                  .select();
                
                data = baseResult.data;
                error = baseResult.error;
              }
            } catch (e) {
              console.error(`[Typography] Exception during typography settings update:`, e);
              error = { message: (e instanceof Error) ? e.message : String(e) };
            }
            
            if (error) {
              console.error(`[Typography] Error updating typography settings:`, error);
              notifySyncError(`Error updating settings: ${error.message}`);
              return;
            }
            
            console.log(`[Typography] Successfully updated typography settings:`, data);
            notifySyncCompleted();
          } else {
            console.log(`[Typography] Inserting new typography settings for platform ${platformId}`);
            
            // Insert new record
            const insertData = {
              ...baseUpdateData,
              ...optionalFields
            };
            
            console.log(`[Typography] Insert data:`, insertData);
            
            // First try with all fields
            let data;
            let error;
            
            try {
              const result = await supabase
                .from('typography_settings')
                .insert(insertData)
                .select();
              
              data = result.data;
              error = result.error;
              
              // If there's an error about a column not existing, remove problematic fields and try again
              if (error && (error.code === 'PGRST204' || error.code === '42703') && error.message && (error.message.includes('column') || error.message.includes('type_styles'))) {
                console.warn(`[Typography] Column error detected: ${error.message}. Retrying with base fields only.`);
                
                // Remove the type_styles field if it's causing problems
                const safeInsertData = { ...baseUpdateData };
                delete safeInsertData.type_styles;
                console.log(`[Typography] Retrying insert without type_styles field:`, safeInsertData);
                
                const baseResult = await supabase
                  .from('typography_settings')
                  .insert(safeInsertData)
                  .select();
                
                data = baseResult.data;
                error = baseResult.error;
              }
            } catch (e) {
              console.error(`[Typography] Exception during typography settings insert:`, e);
              error = { message: (e instanceof Error) ? e.message : String(e) };
            }
            
            if (error) {
              console.error(`[Typography] Error inserting typography settings:`, error);
              notifySyncError(`Error inserting settings: ${error.message}`);
              return;
            }
            
            console.log(`[Typography] Successfully inserted typography settings:`, data);
            notifySyncCompleted();
          }
          
          // Update local state
          const platforms = get().platforms;
          const updatedPlatforms = platforms.map(p => {
            if (p.id === platformId) {
              return { ...p, ...settings };
            }
            return p;
          });
          
          // Update platforms in the store
          set({ platforms: updatedPlatforms });
          
        } catch (error) {
          console.error(`[Typography] Exception in saveTypographySettings:`, error);
          notifySyncError(`Error saving settings: ${(error instanceof Error) ? error.message : 'Unknown error'}`);
        }
      },

      // Setup real-time sync to listen for changes from other browsers
      setupRealTimeSync: () => {
        if (typeof window === 'undefined') return () => {};
        
        console.log('[Typography] Setting up real-time sync for typography settings');
        
        // Function to handle changes from other browsers
        const handleTypographyChanged = (event: Event) => {
          const typographyEvent = event as CustomEvent;
          console.log(`[Typography] Received real-time update:`, typographyEvent.detail);
          
          // Extract platform ID if provided in the event
          const platformId = typographyEvent.detail?.platformId;
          
          if (platformId) {
            // If we have a specific platform ID, only refresh that platform
            console.log(`[Typography] Refreshing platform ${platformId} due to external changes`);
            get().fetchTypographySettings(platformId);
          } else {
            // Otherwise refresh all platforms in the store
            const platforms = get().platforms;
            console.log(`[Typography] Refreshing all ${platforms.length} platforms due to external changes`);
            
            platforms.forEach(platform => {
              get().fetchTypographySettings(platform.id);
            });
          }
        };
        
        // Add event listener
        window.addEventListener('typographySettingsChanged', handleTypographyChanged);
        
        // Return cleanup function that can be called when component unmounts
        return () => {
          window.removeEventListener('typographySettingsChanged', handleTypographyChanged);
          console.log('[Typography] Removed real-time sync listeners');
        };
      },
      
      fetchTypographySettings: async (platformId: string) => {
        set({ isLoading: true, error: null })
        console.log(`[Typography] Fetching typography settings for platform ${platformId}`)
        
        // Check if this platform is already being initialized to prevent infinite loops
        const state = get();
        
        // Ensure _initializingPlatforms is a Set
        if (!state._initializingPlatforms || !(state._initializingPlatforms instanceof Set)) {
          console.log('[Typography] Re-initializing _initializingPlatforms as a new Set');
          state._initializingPlatforms = new Set<string>();
        }
        
        if (state._initializingPlatforms.has(platformId)) {
          console.log(`[Typography] Skipping fetch for platform ${platformId} - initialization already in progress`);
          set({ isLoading: false });
          return;
        }
        
        // Add to tracking set to prevent recursive calls
        state._initializingPlatforms.add(platformId);
        
        try {
          // Check if platformId is a UUID or a named platform (like 'web', 'mobile', etc.)
          const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(platformId);
          
          // For named platforms, we need to find their UUID first
          let actualPlatformId = platformId;
          
          if (!isUUID) {
            // Get the platform UUID from the platform store if it's a named platform
            const platformStore = usePlatformStore.getState();
            const platform = platformStore.platforms.find(p => p.name.toLowerCase() === platformId.toLowerCase());
            
            if (platform) {
              actualPlatformId = platform.id;
              console.log(`[Typography] Mapped named platform '${platformId}' to UUID '${actualPlatformId}'`);
            } else {
              console.log(`[Typography] Could not find UUID for named platform '${platformId}', initializing with defaults`);
              // Initialize with defaults instead of trying to fetch from database
              set({ isLoading: false });
              return get().initializePlatform(platformId);
            }
          }
          
          // Modify query to get the most recent settings if multiple exist
          const { data: settingsData, error } = await supabase
            .from('typography_settings')
            .select('*')
            .eq('platform_id', actualPlatformId)
            .order('created_at', { ascending: false })
            .limit(1)
          
          if (error) {
            console.error(`[Typography] Error fetching typography settings for platform ${platformId}:`, error)
            // Instead of throwing an error, initialize with defaults
            console.log(`[Typography] Initializing platform ${platformId} with defaults due to fetch error`)
            set({ isLoading: false })
            return get().initializePlatform(platformId)
          }
          
          if (!settingsData || settingsData.length === 0) {
            console.log(`[Typography] No settings found for platform ${platformId}, will use defaults`)
            // No data found, initialize with defaults
            return get().initializePlatform(platformId)
          }
          
          // Use the first (most recent) result
          const settings = settingsData[0];
          
          console.log(`[Typography] Received settings for platform ${platformId}:`, settings)
          
          if (settings) {
            // Transform the data from database format to app format
            // Parse typeStyles from the database if available
            let typeStylesFromDB: TypeStyle[] = [];
            
            // Check if type_styles column exists in the schema
            const hasTypeStylesColumn = 'type_styles' in settings;
            console.log(`[Typography] Schema check: type_styles column ${hasTypeStylesColumn ? 'exists' : 'does not exist'}`);
            
            if (hasTypeStylesColumn) {
              try {
                // Handle empty strings, null values, or non-string values by defaulting to an empty array
                if (settings.type_styles && typeof settings.type_styles === 'string' && settings.type_styles.trim() !== '') {
                  typeStylesFromDB = JSON.parse(settings.type_styles);
                  console.log(`[Typography] Successfully parsed ${typeStylesFromDB.length} type styles from database`);
                } else if (settings.type_styles && typeof settings.type_styles === 'object') {
                  // Handle case where type_styles is already an object (not a string)
                  typeStylesFromDB = settings.type_styles;
                  console.log(`[Typography] type_styles is already an object, using directly`);
                } else {
                  console.log(`[Typography] type_styles is empty or invalid, using default styles`);
                  typeStylesFromDB = defaultTypeStyles;
                }
              } catch (e) {
                console.error(`[Typography] Error parsing type_styles from database:`, e);
                // Use default styles if there's a parsing error
                typeStylesFromDB = defaultTypeStyles;
              }
            } else if (!hasTypeStylesColumn) {
              console.log(`[Typography] type_styles column doesn't exist in the database, using default styles`);
              // Use default type styles if the column doesn't exist
              typeStylesFromDB = defaultTypeStyles;
            }
            
            const transformedSettings = {
              scaleMethod: settings.scale_method as ScaleMethod,
              scale: settings.scale_config || { baseSize: 16, ratio: 1.2, stepsUp: 3, stepsDown: 2 },
              // Add the parsed type styles
              typeStyles: typeStylesFromDB,
              distanceScale: {
                viewingDistance: (settings.distance_scale as any)?.viewing_distance ?? 400,
                visualAcuity: (settings.distance_scale as any)?.visual_acuity ?? 1,
                meanLengthRatio: (settings.distance_scale as any)?.mean_length_ratio ?? 5,
                textType: ((settings.distance_scale as any)?.text_type as TextType) ?? 'continuous',
                lighting: ((settings.distance_scale as any)?.lighting as LightingCondition) ?? 'good',
                ppi: (settings.distance_scale as any)?.ppi ?? 96
              },
              // Properly handle AI settings
              aiScale: settings.ai_settings ? {
                recommendedBaseSize: (settings.ai_settings as any).recommendedBaseSize || 0,
                originalSizeInPx: (settings.ai_settings as any).originalSizeInPx || 0,
                recommendations: (settings.ai_settings as any).recommendations || '',
                summaryTable: (settings.ai_settings as any).summaryTable || '',
                reasoning: (settings.ai_settings as any).reasoning || '',
                prompts: (settings.ai_settings as any).prompts || []
              } : settings.scale_method === 'ai' ? {
                // If scale method is 'ai' but no ai_settings exist, create default ones
                recommendedBaseSize: (settings.scale_config as any)?.baseSize || 16,
                originalSizeInPx: (settings.scale_config as any)?.baseSize || 16,
                recommendations: '',
                summaryTable: '',
                reasoning: '',
                prompts: []
              } : undefined,
              // Include tab selections
              viewTab: settings.view_tab || 'scale',
              analysisTab: settings.analysis_tab || 'platform'
            }
            
            console.log(`[Typography] Transformed settings for platform ${platformId}:`, transformedSettings)
            
            set((state: TypographyState): TypographyState => {
              // Find if platform already exists in state
              const platformExists = state.platforms.some(p => p.id === platformId);
              let updatedPlatforms;
              
              if (platformExists) {
                // Update existing platform
                updatedPlatforms = state.platforms.map(p => 
                  p.id === platformId ? { ...p, ...transformedSettings } as Platform : p
                );
                console.log(`[Typography] Updated existing platform ${platformId} in state`)
              } else {
                // Create new platform with all required fields
                const platformStore = usePlatformStore.getState();
                const platformData = platformStore.platforms.find(p => p.id === platformId);
                
                if (!platformData) {
                  console.error(`[Typography] Platform ${platformId} not found in platform store`);
                  // Still proceed with a default name
                  const newPlatform: Platform = {
                    id: platformId,
                    name: 'Unknown Platform',
                    // Ensure all required properties have proper types
                    scale: (transformedSettings.scale as ScaleConfig) || {
                      baseSize: 16,
                      ratio: 1.2,
                      stepsUp: 3,
                      stepsDown: 2
                    },
                    scaleMethod: (transformedSettings.scaleMethod as ScaleMethod) || 'modular',
                    typeStyles: transformedSettings.typeStyles || [],
                    distanceScale: transformedSettings.distanceScale || {
                      viewingDistance: 400,
                      visualAcuity: 1,
                      meanLengthRatio: 5,
                      textType: 'continuous',
                      lighting: 'good',
                      ppi: 96
                    },
                    units: {
                      typography: 'px',
                      spacing: 'px',
                      dimensions: 'px',
                      borderWidth: 'px',
                      borderRadius: 'px'
                    },
                    accessibility: (platformData as any).accessibility || {
                      minContrastBody: 4.5,
                      minContrastLarge: 3
                    },
                    viewTab: (transformedSettings.viewTab as string) || 'scale',
                    analysisTab: (transformedSettings.analysisTab as string) || 'distance'
                  };
                  updatedPlatforms = [...state.platforms, newPlatform];
                  console.log(`[Typography] Added new platform ${platformId} to state with default values`)
                } else {
                  // We found the platform in the platform store
                  const newPlatform: Platform = {
                    id: platformId,
                    name: platformData.name,
                    // Ensure all required properties have proper types
                    scale: (transformedSettings.scale as ScaleConfig) || {
                      baseSize: 16,
                      ratio: 1.2,
                      stepsUp: 3,
                      stepsDown: 2
                    },
                    scaleMethod: (transformedSettings.scaleMethod as ScaleMethod) || 'modular',
                    typeStyles: transformedSettings.typeStyles || [],
                    distanceScale: transformedSettings.distanceScale || {
                      viewingDistance: 400,
                      visualAcuity: 1,
                      meanLengthRatio: 5,
                      textType: 'continuous',
                      lighting: 'good',
                      ppi: 96
                    },
                    units: platformData.units || {
                      typography: 'px',
                      spacing: 'px',
                      dimensions: 'px',
                      borderWidth: 'px',
                      borderRadius: 'px'
                    },
                    accessibility: (platformData as any).accessibility || {
                      minContrastBody: 4.5,
                      minContrastLarge: 3
                    },
                    viewTab: (transformedSettings.viewTab as string) || 'scale',
                    analysisTab: (transformedSettings.analysisTab as string) || 'distance'
                  };
                  updatedPlatforms = [...state.platforms, newPlatform];
                  console.log(`[Typography] Added new platform ${platformId} to state with data from platform store`)
                }
              }
              
              return {
                ...state,
                platforms: updatedPlatforms,
                isLoading: false,
                error: null
              };
            });
            
            // Also fetch the type styles for this platform
            get().fetchTypeStyles(platformId).catch(error => {
              console.error(`[Typography] Error fetching type styles for platform ${platformId}:`, error)
            });
          }
        } catch (error) {
          console.error(`[Typography] Error in fetchTypographySettings for platform ${platformId}:`, error)
          console.log(`[Typography] Initializing platform ${platformId} with defaults due to error`)
          set({ 
            isLoading: false,
            error: null // Don't set error state to avoid UI issues
          })
          
          // Initialize with defaults instead of showing an error
          return get().initializePlatform(platformId)
        } finally {
          // Always remove from tracking set to prevent infinite loops
          get()._initializingPlatforms.delete(platformId);
        }
      },

      fetchTypeStyles: async (platformId: string) => {
        set({ isLoading: true, error: null })
        
        // Check if this platform is already being initialized to prevent infinite loops
        const state = get();
        
        // Ensure _initializingPlatforms is a Set
        if (!state._initializingPlatforms || !(state._initializingPlatforms instanceof Set)) {
          console.log('[Typography] Re-initializing _initializingPlatforms as a new Set');
          state._initializingPlatforms = new Set<string>();
        }
        
        if (state._initializingPlatforms.has(platformId)) {
          console.log(`[Typography] Skipping type styles fetch for platform ${platformId} - initialization already in progress`);
          set({ isLoading: false });
          return;
        }
        
        // Add to tracking set to prevent recursive calls
        state._initializingPlatforms.add(platformId);
        
        try {
          console.log(`Fetching type styles for platform ${platformId}`)
          
          // Check if platformId is a UUID or a named platform (like 'web', 'mobile', etc.)
          const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(platformId);
          
          // For named platforms, we need to find their UUID first
          let actualPlatformId = platformId;
          
          if (!isUUID) {
            // Get the platform UUID from the platform store if it's a named platform
            const platformStore = usePlatformStore.getState();
            const platform = platformStore.platforms.find(p => p.name.toLowerCase() === platformId.toLowerCase());
            
            if (platform) {
              actualPlatformId = platform.id;
              console.log(`[Typography] Mapped named platform '${platformId}' to UUID '${actualPlatformId}' for type styles`);
            } else {
              console.log(`[Typography] Could not find UUID for named platform '${platformId}' for type styles, using defaults`);
              // Use default type styles for platforms that don't exist
              set({ isLoading: false });
              return;
            }
          }
          
          const { data, error } = await supabase
            .from('type_styles')
            .select('*')
            .eq('platform_id', actualPlatformId)

          if (error) {
            console.error('Error fetching type styles:', error)
            // Don't throw, just return and use defaults
            set({ isLoading: false })
            return
          }

          console.log(`Received ${data.length} type styles for platform ${platformId}:`, data)

          const styles: TypeStyle[] = data.map((style: any) => ({
            id: style.id as string,
            name: style.name as string,
            scaleStep: style.scale_step as string,
            fontFamily: '',  // Default value since column doesn't exist in DB
            fontWeight: style.font_weight as number,
            lineHeight: style.line_height as number,
            letterSpacing: style.letter_spacing as number,
            opticalSize: style.optical_size as number || 14
          }))

          console.log('Transformed styles:', styles)

          set((state: TypographyState): TypographyState => {
            const updatedPlatforms = state.platforms.map((p: Platform) => 
              p.id === platformId ? { ...p, typeStyles: styles } : p
            );
            
            console.log('Updated platforms in state:', updatedPlatforms);
            
            return {
              ...state,
              platforms: updatedPlatforms,
              isLoading: false,
              error: null
            };
          })
        } catch (error) {
          console.error('Error in fetchTypeStyles:', error)
          set({ 
            isLoading: false,
            error: (error as Error).message 
          })
        } finally {
          // Always remove from tracking set to prevent infinite loops
          get()._initializingPlatforms.delete(platformId);
        }
      },
    }),
    {
      name: 'typography-store',
      // Ensure _initializingPlatforms is a Set after rehydration
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        
        // Ensure _initializingPlatforms is a Set
        if (!state._initializingPlatforms || !(state._initializingPlatforms instanceof Set)) {
          console.log('[Typography] Initializing _initializingPlatforms as a new Set');
          state._initializingPlatforms = new Set<string>();
        }
        
        return state;
      }
    }
  )
)
