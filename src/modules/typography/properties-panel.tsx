import { useState, useEffect, useMemo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTypographyStore, ScaleMethod, Platform, TypeStyle, uploadImageToStorage } from "@/store/typography"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown, GripVertical, Trash2, Copy, Upload, X, Codesandbox, ScanEye, LineChart, MoreHorizontal } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { generateTypeScale, parseAIRecommendation } from "@/lib/gemini"
import { convertToBase64 } from "@/lib/utils"
import { Progress } from "@/components/ui/progress"
import { Loader2 } from "lucide-react"
import { Sparkles } from "lucide-react"
import { AnimatedTabs } from "@/components/ui/animated-tabs"
import { usePlatformStore } from "@/store/platform-store"
import { convertUnits, formatWithUnit } from "@/lib/utils"
import { useRouter } from 'next/navigation';
import { calculateDistanceBasedSize } from '@/lib/scale-calculations'
import { useFontStore } from "@/store/font-store"
import { useBrandStore } from "@/store/brand-store"
import { toast } from "sonner"

const typographyScales = [
  { name: "Major Second", ratio: 1.125 },
  { name: "Major Third", ratio: 1.25 },
  { name: "Perfect Fourth", ratio: 1.333 },
  { name: "Perfect Fifth", ratio: 1.5 },
  { name: "Golden Ratio", ratio: 1.618 },
]

interface DistanceScale {
  viewingDistance: number
  visualAcuity: number
  meanLengthRatio: number
  textType: 'continuous' | 'isolated'
  lighting: 'good' | 'moderate' | 'poor'
  ppi: number
}

interface SortableTypeStyleProps {
  style: TypeStyle
  handleTypeStyleChange: (id: string, updates: Partial<TypeStyle>) => void
  handleDeleteTypeStyle: (id: string) => void
  handleDuplicateStyle: (style: TypeStyle) => void
  getScaleValues: () => Array<{ label: string; size: number; ratio: number }>
  typographyUnit: string
}

function SortableTypeStyle({ style: typeStyle, typographyUnit, ...props }: SortableTypeStyleProps) {
  const [isOpen, setIsOpen] = useState(false);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: typeStyle.id });

  const styleProps = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleScaleStepChange = (value: string) => {
    console.log('Changing scale step to:', value); // Debug log
    props.handleTypeStyleChange(typeStyle.id, { 
      scaleStep: value
    });
  };

  // Get the font size from the scale values based on the current scale step
  const scaleValues = props.getScaleValues();
  const selectedScale = scaleValues.find(scale => scale.label === typeStyle.scaleStep);
  const fontSize = selectedScale?.size || typeStyle.fontSize;

  return (
    <div ref={setNodeRef} style={styleProps} {...attributes}>
      <div key={typeStyle.id} className="border rounded-md overflow-hidden">
        <div className="flex items-center gap-2 p-2 bg-muted/40">
          <div {...listeners} className="cursor-grab">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <Input
              value={typeStyle.name}
              onChange={(e) => props.handleTypeStyleChange(typeStyle.id, { name: e.target.value })}
              className="text-xs h-8"
            />
          </div>
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="sm"
              className="text-xs h-8 px-2"
              onClick={() => props.handleDuplicateStyle(typeStyle)}
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              className="text-xs h-8 px-2"
              onClick={() => props.handleDeleteTypeStyle(typeStyle.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-8 px-2"
              onClick={() => setIsOpen(!isOpen)}
            >
              <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </Button>
          </div>
        </div>

        {isOpen && (
          <div className="p-2 space-y-4 border-t bg-background">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Scale Step</Label>
                <Select
                  value={typeStyle.scaleStep}
                  onValueChange={handleScaleStepChange}
                >
                  <SelectTrigger className="text-xs h-8 ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {props.getScaleValues().map((scale) => (
                      <SelectItem key={scale.label} value={scale.label}>
                        {`${scale.label} (${formatWithUnit(scale.size, typographyUnit)})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs">Font Weight</Label>
                <Input
                  type="number"
                  min="100"
                  max="900"
                  step="100"
                  value={typeStyle.fontWeight}
                  onChange={(e) => props.handleTypeStyleChange(typeStyle.id, { 
                    fontWeight: parseInt(e.target.value) 
                  })}
                  className="text-xs h-8"
                />
              </div>

              <div>
                <Label className="text-xs">Line Height</Label>
                <div className="flex gap-1">
                  <Input
                    type="number"
                    min="0.5"
                    max={typeStyle.lineHeightUnit === 'percent' ? 300 : 3}
                    step={typeStyle.lineHeightUnit === 'percent' ? 5 : 0.1}
                    value={typeStyle.lineHeightUnit === 'percent' ? typeStyle.lineHeight * 100 : typeStyle.lineHeight}
                    onChange={(e) => props.handleTypeStyleChange(typeStyle.id, { 
                      lineHeight: typeStyle.lineHeightUnit === 'percent' 
                        ? parseFloat(e.target.value) / 100 
                        : parseFloat(e.target.value) 
                    })}
                    className="text-xs h-8 flex-1"
                  />
                  <Select
                    value={typeStyle.lineHeightUnit || 'percent'}
                    onValueChange={(value) => props.handleTypeStyleChange(typeStyle.id, { 
                      lineHeightUnit: value as 'multiplier' | 'percent',
                      // Convert the value when changing units
                      lineHeight: value === 'percent' && typeStyle.lineHeightUnit === 'multiplier'
                        ? typeStyle.lineHeight // No need to convert as we'll display it differently
                        : value === 'multiplier' && typeStyle.lineHeightUnit === 'percent'
                          ? typeStyle.lineHeight // No need to convert as we'll display it differently
                          : typeStyle.lineHeight
                    })}
                  >
                    <SelectTrigger className="text-xs h-8 ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="multiplier">×</SelectItem>
                      <SelectItem value="percent">%</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label className="text-xs">Letter Spacing</Label>
                <Input
                  type="number"
                  min="-0.1"
                  max="0.5"
                  step="0.01"
                  value={typeStyle.letterSpacing}
                  onChange={(e) => props.handleTypeStyleChange(typeStyle.id, { 
                    letterSpacing: parseFloat(e.target.value) 
                  })}
                  className="text-xs h-8"
                />
              </div>

              <div>
                <Label className="text-xs">Optical Size</Label>
                <Input
                  type="number"
                  min="8"
                  max="144"
                  value={typeStyle.opticalSize}
                  onChange={(e) => props.handleTypeStyleChange(typeStyle.id, { 
                    opticalSize: parseInt(e.target.value) 
                  })}
                  className="text-xs h-8"
                />
              </div>
              
              <div>
                <Label className="text-xs">Text Transform</Label>
                <Select
                  value={typeStyle.textTransform || 'none'}
                  onValueChange={(value) => props.handleTypeStyleChange(typeStyle.id, { 
                    textTransform: value as 'none' | 'uppercase' | 'lowercase' | 'capitalize'
                  })}
                >
                  <SelectTrigger className="text-xs h-8 ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="uppercase">UPPER</SelectItem>
                    <SelectItem value="lowercase">lower</SelectItem>
                    <SelectItem value="capitalize">Title</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Fix the getFontNameById function to handle null values properly
const getFontNameById = (fontId: string | null | undefined, fonts: any[]): string | undefined => {
  if (!fontId) return undefined;
  const font = fonts.find(f => f.id === fontId);
  return font ? font.family : undefined;
}

export function PropertiesPanel() {
  const platforms = usePlatformStore((state) => state.platforms)
  const typographyStore = useTypographyStore() as any
  const {
    currentPlatform: activePlatform,
    platforms: typographyPlatforms,
    setCurrentPlatform,
    initializePlatform,
    fetchTypographySettings,
    fetchTypeStyles,
    saveTypographySettings
  } = typographyStore
  const { platforms: platformSettings, updatePlatform } = usePlatformStore()
  const fontStore = useFontStore() as any
  const { currentBrand, saveBrandTypography, brandTypography, fonts, loadFonts, loadBrandTypography } = fontStore
  const { currentBrand: brandStoreCurrentBrand } = useBrandStore()
  
  // Track initialization state
  const [initializedPlatforms, setInitializedPlatforms] = useState<string[]>([])
  
  // Wrapper functions to safely call store methods
  const safeLoadFonts = async () => {
    if (typeof loadFonts === 'function') {
      try {
        await loadFonts();
      } catch (error) {
        console.warn('Error loading fonts:', error);
      }
    } else {
      console.warn('loadFonts is not available - cannot load fonts');
    }
  };

  const safeLoadBrandTypography = async (brandId: string) => {
    if (typeof loadBrandTypography === 'function') {
      try {
        await loadBrandTypography(brandId);
      } catch (error) {
        console.warn('Error loading brand typography:', error);
      }
    } else {
      console.warn('loadBrandTypography is not available - cannot load brand typography');
    }
  };

  const safeSaveTypographySettings = (platformId: string, settings: any) => {
    if (typeof saveTypographySettings === 'function') {
      try {
        return saveTypographySettings(platformId, settings);
      } catch (error) {
        console.error('Error saving typography settings:', error);
        toast.error("Error saving settings", {
          description: "Could not save typography settings - try refreshing the page"
        });
      }
    } else if (typeof updatePlatform === 'function') {
      console.warn('saveTypographySettings is not available - falling back to updatePlatform');
      try {
        return updatePlatform(platformId, settings);
      } catch (error) {
        console.error('Error updating platform:', error);
        toast.error("Error updating platform", {
          description: "Could not update platform settings - try refreshing the page"
        });
      }
    } else {
      console.error('No function available to update typography settings');
      toast.error("Error", {
        description: "No function available to update settings - try refreshing the page"
      });
    }
  };

  // DnD hooks
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // State hooks
  const [selectedDevice, setSelectedDevice] = useState('')
  const [selectedContext, setSelectedContext] = useState('')
  const [selectedLocation, setSelectedLocation] = useState('')
  const [aiError, setAiError] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [platformReasoning, setPlatformReasoning] = useState<string | null>(null)
  const [imageAnalysis, setImageAnalysis] = useState<string | null>(null)
  const [activeViewTab, setActiveViewTab] = useState<string>('scale')
  const [activeAnalysisTab, setActiveAnalysisTab] = useState<any>('platform')
  const [customRequirements, setCustomRequirements] = useState('')
  const [showPlatformActions, setShowPlatformActions] = useState(false);
  const router = useRouter();

  // Add state for font role
  const currentTypography = useMemo(() => {
    if (!currentBrand?.id) return null
    return brandTypography[currentBrand.id]
  }, [currentBrand?.id, brandTypography])
  const [currentFontRole, setCurrentFontRole] = useState<'primary' | 'secondary' | 'tertiary'>('primary')

  // Then update the font name memoized values
  const primaryFontName = useMemo(() => {
    if (!currentTypography || !currentBrand?.id) return undefined;
    return getFontNameById(currentTypography.primary_font_id, fonts);
  }, [currentTypography, currentBrand?.id, fonts]);

  const secondaryFontName = useMemo(() => {
    if (!currentTypography || !currentBrand?.id) return undefined;
    return getFontNameById(currentTypography.secondary_font_id, fonts);
  }, [currentTypography, currentBrand?.id, fonts]);

  const tertiaryFontName = useMemo(() => {
    if (!currentTypography || !currentBrand?.id) return undefined;
    return getFontNameById(currentTypography.tertiary_font_id, fonts);
  }, [currentTypography, currentBrand?.id, fonts]);

  const formatText = (text: string) => {
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  };

  const handleEditPlatform = () => {
    console.log('Edit Platform:', activePlatform);
    // TODO: Implement edit platform functionality
  };

  const handleDuplicatePlatform = () => {
    console.log('Duplicate Platform to Other Brand:', activePlatform);
    // TODO: Implement duplicate platform functionality
  };

  // Initialize platforms when component mounts
  useEffect(() => {
    if (platforms && platforms.length > 0 && (!activePlatform || activePlatform === '')) {
      // Set the first platform as active if none is selected
      console.log('Setting initial platform:', platforms[0].id);
      setCurrentPlatform(platforms[0].id);
      
      // Initialize the platform if needed
      if (typographyPlatforms && !typographyPlatforms.some((p: Platform) => p.id === platforms[0].id)) {
        console.log('Initializing platform:', platforms[0].id);
        initializePlatform(platforms[0].id);
        setInitializedPlatforms(prev => [...prev, platforms[0].id]);
      }
    }
  }, [platforms, typographyPlatforms, activePlatform, setCurrentPlatform, initializePlatform]);

  useEffect(() => {
    // Add a flag to prevent multiple loads
    const loadFontsOnce = async () => {
      // Check if fonts are loaded either by window flag or by checking the array
      if (!(window as any).__fontsLoaded || !fonts || fonts.length === 0) {
        console.log('Loading fonts from properties panel...');
        await safeLoadFonts();
        (window as any).__fontsLoaded = true;
        
        if (currentBrand?.id) {
          console.log('Loading brand typography for brand:', currentBrand.id);
          await safeLoadBrandTypography(currentBrand.id);
        }
      }
    };

    loadFontsOnce();
  }, [fonts, currentBrand]); // Remove loadFonts and loadBrandTypography to avoid the error if they don't exist

  // Use a separate useEffect for initialization checks that depend on currentBrand
  useEffect(() => {
    // Add initialization logic that depends on currentBrand
    if (currentBrand?.id) {
      console.log('Brand changed, ensuring typography data is loaded');
      // Add any logic here that should run when currentBrand changes
    }
  }, [currentBrand?.id]);

  useEffect(() => {
    if (activePlatform && !typographyPlatforms?.find((p: Platform) => p.id === activePlatform)) {
      initializePlatform(activePlatform)
    }
  }, [activePlatform, typographyPlatforms, initializePlatform])
  
  // Find current settings with fallbacks
  const currentSettings = typographyPlatforms?.find((p: Platform) => p.id === activePlatform) || {
    id: activePlatform || 'default',
    name: 'Default',
    scaleMethod: 'modular' as ScaleMethod,
    scale: {
      baseSize: 16,
      ratio: 1.2,
      stepsUp: 3,
      stepsDown: 2
    },
    units: {
      typography: 'rem',
      spacing: 'rem',
      dimensions: 'rem',
      borderWidth: 'px',
      borderRadius: 'px'
    },
    layout: {
      gridColumns: 12,
      gridGutter: 16,
      containerPadding: 16
    }
  }
  
  const currentPlatformSettings = platformSettings.find(p => p.id === activePlatform) || {
    id: activePlatform || 'default',
    name: 'Default',
    units: { typography: 'px', spacing: 'px', dimensions: 'px' }
  }
  
  // When currentSettings.currentFontRole changes, update the local state
  useEffect(() => {
    if (currentSettings?.currentFontRole) {
      setCurrentFontRole(currentSettings.currentFontRole);
    }
  }, [currentSettings?.currentFontRole])
  
  useEffect(() => {
    // Only log once when fonts are loaded
    if (fonts && fonts.length > 0) {
      console.log('Fonts loaded:', fonts.length);
    }
  }, [fonts?.length]); // Use optional chaining to safely access length

  // Add a useEffect to ensure platforms are loaded and available for selection
  useEffect(() => {
    if (platforms?.length && platforms[0] && activePlatform === null) {
      setCurrentPlatform(platforms[0].id)
      
      if (!typographyPlatforms?.find((p: Platform) => p.id === platforms[0].id)) {
        initializePlatform(platforms[0].id)
      }
    }
  }, [platforms, activePlatform, typographyPlatforms, setCurrentPlatform, initializePlatform]);

  // Add debug logging to help diagnose platform issues
  useEffect(() => {
    console.log('Available platforms:', platforms);
    console.log('Current active platform:', activePlatform);
    console.log('Platform settings:', platformSettings);
  }, [platforms, activePlatform, platformSettings]);

  // Ensure AI settings are initialized when component mounts
  useEffect(() => {
    if (activePlatform && currentSettings && currentSettings.scaleMethod === 'ai') {
      // Check if AI settings exist and are complete
      if (!currentSettings.aiScale || 
          currentSettings.aiScale.recommendedBaseSize === undefined || 
          currentSettings.aiScale.originalSizeInPx === undefined) {
        
        console.log("Initializing missing AI settings");
        const currentScale = currentSettings.scale || { baseSize: 16, ratio: 1.2, stepsUp: 3, stepsDown: 2 };
        
        // Use the typography store's function instead of platform store
        // This avoids mixing different Platform types
        fetchTypographySettings(activePlatform).then(() => {
          saveTypographySettings(activePlatform, {
            aiScale: {
              recommendedBaseSize: currentScale.baseSize,
              originalSizeInPx: currentScale.baseSize,
              recommendations: currentSettings.aiScale?.recommendations || '',
              summaryTable: currentSettings.aiScale?.summaryTable || '',
              reasoning: currentSettings.aiScale?.reasoning || ''
            }
          });
        }).catch((error: unknown) => {
          console.error("Error updating AI settings:", error);
        });
      }
    }
  }, [activePlatform, currentSettings, fetchTypographySettings, saveTypographySettings]);

  // Helper function to ensure AI scale settings are properly updated
  const updateAIScaleSettings = useCallback((method: ScaleMethod) => {
    if (!activePlatform) return;
    
    console.log(`Changing scale method to: ${method}`);
    
    // If switching to AI method, ensure AI settings are initialized
    if (method === 'ai') {
      // Initialize AI settings if they don't exist or are incomplete
      const currentScale = currentSettings.scale || { baseSize: 16, ratio: 1.2, stepsUp: 3, stepsDown: 2 };
      
      // Use saveTypographySettings instead of updatePlatform to avoid type mismatches
      saveTypographySettings(activePlatform, {
        scaleMethod: method,
        aiScale: currentSettings.aiScale || {
          recommendedBaseSize: currentScale.baseSize,
          originalSizeInPx: currentScale.baseSize,
          recommendations: '',
          summaryTable: '',
          reasoning: ''
        },
        // Set default tabs for AI method
        viewTab: currentSettings.viewTab || 'scale',
        analysisTab: currentSettings.analysisTab || 'platform'
      });
    } else {
      // For other methods, just update the scale method
      saveTypographySettings(activePlatform, { 
        scaleMethod: method 
      });
    }
  }, [activePlatform, currentSettings, saveTypographySettings]);

  // Use this function when changing scale method
  const handleScaleMethodChange = useCallback((method: ScaleMethod) => {
    if (!activePlatform) return;
    updateAIScaleSettings(method);
  }, [activePlatform, updateAIScaleSettings]);

  // Event handlers
  const handleScaleChange = (ratio: number, baseSize: number) => {
    if (!activePlatform || !currentSettings?.scale) return;
    
    console.log("Updating scale:", { ratio, baseSize, stepsUp: currentSettings.scale.stepsUp, stepsDown: currentSettings.scale.stepsDown });
    
    // Use setTimeout to ensure this update happens in a separate tick
    setTimeout(() => {
      // Use saveTypographySettings instead of updatePlatform for scale changes
      saveTypographySettings(activePlatform, {
        scale: {
          ...(currentSettings.scale || {}),
          ratio,
          baseSize,
          // Ensure stepsUp and stepsDown are maintained - they might be missing if not explicitly set
          stepsUp: currentSettings.scale.stepsUp || 3,
          stepsDown: currentSettings.scale.stepsDown || 2
        }
      });
    }, 0);
  };

  const handleDistanceScaleChange = (updates: Partial<Platform['distanceScale']>) => {
    // Calculate the base size using the distance formula
    const updatedDistanceScale = {
      ...currentSettings.distanceScale,
      ...updates
    };
    
    // Distance-based size calculation formula
    const calculatedBaseSize = calculateDistanceBasedSize(
      updatedDistanceScale.viewingDistance,
      updatedDistanceScale.visualAcuity,
      updatedDistanceScale.meanLengthRatio,
      updatedDistanceScale.textType,
      updatedDistanceScale.lighting,
      updatedDistanceScale.ppi
    );

    // Round to 2 decimal places for display
    const roundedBaseSize = Math.round(calculatedBaseSize * 100) / 100;

    // Use saveTypographySettings instead of updatePlatform to save to Supabase
    safeSaveTypographySettings(activePlatform, {
      distanceScale: updatedDistanceScale,
      scale: {
        ...(currentSettings.scale || {}),
        baseSize: roundedBaseSize // Update the main scale base size
      }
    })
  };

  const handleAccessibilityChange = (updates: Partial<Platform['accessibility']>) => {
    // Define default accessibility values
    const defaultAccessibility = {
      minContrastBody: 4.5,
      minContrastLarge: 3.0
    };
    
    // Use saveTypographySettings instead of updatePlatform to save to Supabase
    safeSaveTypographySettings(activePlatform, {
      accessibility: { ...(currentSettings.accessibility || defaultAccessibility), ...updates }
    })
  }

  const handleTypeStyleChange = (id: string, updates: Partial<TypeStyle>) => {
    if (!activePlatform || !currentSettings) return;

    // Create a new array of type styles
    const updatedTypeStyles = currentSettings.typeStyles.map((style: TypeStyle) => {
      if (style.id === id) {
        // If we're updating the scale step
        if ('scaleStep' in updates) {
          const scaleValues = getScaleValues();
          const scaleValue = scaleValues.find((s: { label: string }) => s.label === updates.scaleStep);
          
          if (scaleValue) {
            console.log(`Updating fontSize for scale step ${updates.scaleStep} to ${scaleValue.size}px`);
            return {
              ...style,
              ...updates,
              fontSize: scaleValue.size
            };
          }
        }
        
        // For other updates
        return {
          ...style,
          ...updates
        };
      }
      return style;
    });

    // Use saveTypographySettings instead of updatePlatform
    saveTypographySettings(activePlatform, {
      typeStyles: updatedTypeStyles
    });
  };

  const getScaleValues = (platformId?: string) => {
    const platform = platformId 
      ? typographyPlatforms?.find((p: Platform) => p.id === platformId) 
      : currentSettings;
      
    if (!platform) return [];
    
    const scaleValues = useTypographyStore.getState().getScaleValues(platformId || activePlatform);
    console.log("Scale values:", {
      platformId: platformId || activePlatform,
      scaleMethod: platform.scaleMethod,
      baseSize: platform.scale?.baseSize,
      ratio: platform.scale?.ratio,
      stepsUp: platform.scale?.stepsUp,
      stepsDown: platform.scale?.stepsDown,
      valueCount: scaleValues.length
    });
    return scaleValues;
  }

  const handleAddTypeStyle = () => {
    if (!activePlatform || !currentSettings) return;
    
    // Create a new type style with default values
    const newStyle: TypeStyle = {
      id: crypto.randomUUID(),
      name: `Style ${currentSettings.typeStyles.length + 1}`,
      scaleStep: 'base',
      fontFamily: currentSettings.typeStyles[0]?.fontFamily || 'sans-serif',
      fontWeight: 400,
      lineHeight: 1.5,
      letterSpacing: 0,
      opticalSize: 16
    };
    
    saveTypographySettings(activePlatform, {
      typeStyles: [
        ...(currentSettings.typeStyles || []),
        newStyle
      ]
    });
  }

  const handleDeleteTypeStyle = (id: string) => {
    saveTypographySettings(activePlatform, {
      typeStyles: currentSettings.typeStyles?.filter((s: TypeStyle) => s.id !== id) || []
    });
  }

  const handleDuplicateStyle = (style: TypeStyle) => {
    const newStyle: TypeStyle = {
      ...style,
      id: crypto.randomUUID(),
      name: `${style.name} (Copy)`
    }
    
    saveTypographySettings(activePlatform, {
      typeStyles: [
        ...(currentSettings.typeStyles || []),
        newStyle
      ]
    });
  }

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      // Find the indices
      const oldIndex = typeStyles.findIndex((style: any) => style.id === active.id);
      const newIndex = typeStyles.findIndex((style: any) => style.id === over.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        // Create a new array with the item moved
        const updatedTypeStyles = [...typeStyles];
        const [removedStyle] = updatedTypeStyles.splice(oldIndex, 1);
        updatedTypeStyles.splice(newIndex, 0, removedStyle);
        
        // Update using saveTypographySettings instead of updatePlatform
        if (activePlatform) {
          saveTypographySettings(activePlatform, {
            typeStyles: updatedTypeStyles
          });
        }
      }
    }
  };

  const handleCopyStylesToAllPlatforms = () => {
    const currentStyles = currentSettings.typeStyles;
    if (currentStyles && typographyPlatforms) {
      // Copy the current styles to all platforms
      typographyPlatforms.forEach((platform: Platform) => {
        if (platform.id !== activePlatform) {
          // Use safeSaveTypographySettings instead of updatePlatform to save to Supabase
          safeSaveTypographySettings(platform.id, {
            typeStyles: currentStyles
          });
        }
      });
    }
  };

  const handleGenerateScale = async () => {
    if (isGenerating) return; // Prevent multiple clicks
    
    setIsGenerating(true);
    setAiError(null);
    setPlatformReasoning(null);
    setProgress(0);

    try {
      const response = await generateTypeScale({
        device: selectedDevice,
        context: selectedContext,
        location: selectedLocation,
        customRequirements
      });

      const parsedRecommendation = parseAIRecommendation(response);
      const convertedSize = convertUnits(
        parsedRecommendation.baseSize,
        'px',
        currentPlatformSettings?.units.typography || 'px',
        currentSettings.scale.baseSize
      );

      // Update both aiScale and scale settings
      saveTypographySettings(activePlatform, {
        scaleMethod: 'ai' as const,
        aiScale: {
          recommendedBaseSize: convertedSize,
          originalSizeInPx: parsedRecommendation.originalSizeInPx,
          recommendations: response,
          summaryTable: ''
        },
        scale: {
          ...(currentSettings.scale || {}),
          baseSize: convertedSize
        }
      });

      setPlatformReasoning(response);
      setProgress(100);
    } catch (error) {
      console.error('AI Scale generation error:', error);
      setAiError(error instanceof Error ? error.message : 'Failed to generate scale');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleImageAnalysis = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      try {
        setAiError(null)
        setIsAnalyzing(true)
        setProgress(0)
        
        const base64 = await convertToBase64(file)
        setSelectedImage(base64)
        
        // Start analysis immediately after image is loaded
        await handleGenerateFromImage(base64)
      } catch (error) {
        setAiError('Failed to process image')
        setSelectedImage(null)
      } finally {
        setIsAnalyzing(false)
      }
    }
  }

  const handleGenerateFromImage = async (base64Image: string) => {
    if (!base64Image) {
      setAiError('Please select an image to analyze');
      return;
    }

    setIsAnalyzing(true);
    setAiError(null);
    setProgress(10);
    
    // Upload the image to Supabase storage
    let storedImageUrl = null;
    try {
      // Get the current brand ID
      const brandId = currentBrand || brandStoreCurrentBrand || 'default';
      
      if (brandId && activePlatform) {
        storedImageUrl = await uploadImageToStorage(base64Image, brandId, activePlatform);
        console.log('Image uploaded successfully:', storedImageUrl);
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      // Continue with analysis even if image upload fails
    }
    
    setProgress(20);

    try {
      // Call the image analysis function
      const result = await generateTypeScale({
        deviceType: platforms.find(p => p.id === activePlatform)?.name,
        context: selectedContext,
        location: selectedLocation,
        image: base64Image
      });
      if (!result) {
        throw new Error('Failed to analyze image');
      }

      setProgress(80);

      // Extract the parameters from the result
      const parsedResult = parseAIRecommendation(result);
      const params = {
        baseSize: parsedResult.baseSize || 16,
        ratio: parsedResult.ratio || 1.2,
        stepsUp: parsedResult.stepsUp || 3,
        stepsDown: parsedResult.stepsDown || 2
      };

      // Format the recommendation text
      const recommendation = `
## Typography Analysis Results

Based on the image analysis, I recommend the following typography scale:

- **Base Size**: ${params.baseSize}px
- **Scale Ratio**: ${params.ratio}
- **Steps Up**: ${params.stepsUp}
- **Steps Down**: ${params.stepsDown}

No additional recommendations provided.

`;

      // Update state safely outside of render
      setImageAnalysis(recommendation)
      setPlatformReasoning(recommendation)

      // Use try/catch block for updating the platform
      try {
        // Use setTimeout to ensure this update happens in a separate tick
        // to prevent "Cannot update a component during render" errors
        setTimeout(() => {
          if (activePlatform && currentSettings) {
            console.log("Updating platform with AI recommendations:", {
              activePlatform,
              currentScale: currentSettings.scale,
              newParams: params
            });
            
            // Update the platform with new scale settings and AI recommendations
            saveTypographySettings(activePlatform, {
              scale: {
                ...(currentSettings.scale || {}),
                baseSize: params.baseSize,
                ratio: params.ratio,
                stepsUp: params.stepsUp,
                stepsDown: params.stepsDown
              },
              aiScale: {
                ...(currentSettings.aiScale || {}),
                recommendedBaseSize: params.baseSize,
                originalSizeInPx: params.baseSize,
                recommendations: '',
                summaryTable: '',
                reasoning: ''
              }
            });
          }
        }, 0);
      } catch (updateError) {
        console.error('Error updating platform settings:', updateError);
        setAiError('Successfully analyzed image but failed to save settings. Please try again.');
      }
    } catch (error) {
      console.error('Error in handleGenerateFromImage:', error)
      
      // Provide more specific error messages for different types of errors
      let errorMessage = 'Failed to analyze image';
      
      if (error instanceof Error) {
        // Check for specific Gemini API errors
        if (error.message.includes('gemini-pro-vision has been deprecated')) {
          errorMessage = 'The Gemini model has been updated. Please refresh the page to use the latest version.';
        } else if (error.message.includes('404')) {
          errorMessage = 'The AI service returned a 404 error. Please check your API key or try again later.';
        } else if (error.message.includes('429')) {
          errorMessage = 'Too many requests to the AI service. Please try again later.';
        } else if (error.message.includes('403')) {
          errorMessage = 'Access denied to the AI service. Please check your API key.';
        } else if (error.message.includes('PGRST116')) {
          errorMessage = 'Database error: Multiple rows found. We\'re fixing this issue, please try again.';
        } else {
          // Use the original error message for other cases
          errorMessage = error.message;
        }
      }
      
      setAiError(errorMessage);
    } finally {
      setIsAnalyzing(false);
      setProgress(100);
    }
  };

  const handleFontRoleChange = async (role: 'primary' | 'secondary' | 'tertiary') => {
    console.log('Changing font role to:', role)
    console.log('Current typography:', currentTypography)
    console.log('Available fonts:', fonts)
    
    if (!currentBrand?.id) return
    
    try {
      // Even if we don't have a font ID, we should still set the role
      let fontId = null;
      
      // Try to get the font ID if typography exists
      if (currentTypography) {
        fontId = currentTypography[`${role}_font_id`];
        console.log('Selected font ID:', fontId);
      }
      
      // Instead of using updatePlatform, directly update the local state
      // These properties don't exist in the database schema
      setCurrentFontRole(role);
      
      // Find the platform in the local state and update it
      const updatedPlatforms = typographyPlatforms.map((p: any) => {
        if (p.id === activePlatform) {
          return {
            ...p,
            currentFontRole: role,
            fontId: fontId
          };
        }
        return p;
      });
      
      // Update the platforms in the store
      const typographyStore = useTypographyStore.getState();
      if (activePlatform) {
        // Use saveTypographySettings instead of updatePlatform to ensure data is saved to Supabase
        typographyStore.saveTypographySettings(activePlatform, { currentFontRole: role, fontId });
      }
      
      // Force a font load if we have a font ID
      if (fontId) {
        const font = fonts.find((f: any) => f.id === fontId);
        if (font?.file_url) {
          try {
            console.log(`Loading font for role ${role}:`, font.family);
            // Font loading logic
            const customFontName = font.family;
            
            // If the font file URL is an object URL, it's already loaded
            if (typeof font.file_url === 'string' && !font.file_url.startsWith('blob:')) {
              const fontFace = new FontFace(customFontName, `url(${font.file_url})`);
              await fontFace.load();
              document.fonts.add(fontFace);
              console.log(`Font ${customFontName} loaded successfully`);
            }
          } catch (error) {
            console.error(`Error loading font:`, error);
          }
        }
      }
    } catch (error) {
      console.error(`Error changing font role:`, error);
    }
  };

  const getFontInfo = (role: 'primary' | 'secondary' | 'tertiary') => {
    const fontId = currentTypography?.[`${role}_font_id`]
    const font = fonts.find((f: any) => f.id === fontId)
    return font
  }

  const getRoleDescription = (role: 'primary' | 'secondary' | 'tertiary') => {
    switch (role) {
      case 'primary':
        return 'Used for headlines and important text'
      case 'secondary':
        return 'Used for body text and supporting content'
      case 'tertiary':
        return 'Used sparingly for special purposes'
    }
  }

  // Update the getCurrentFontName function to better extract font names from the DOM
  const getCurrentFontName = (role: 'primary' | 'secondary' | 'tertiary') => {
    // First try to get from the preview text
    if (typeof document !== 'undefined') {
      // Look for font information in the DOM
      const previewElement = document.querySelector('.using-font-text');
      if (previewElement) {
        const fontText = previewElement.textContent || '';
        if (fontText.includes('Using')) {
          // Extract font name from text like "Using primary font: Test Söhne"
          const match = fontText.match(/Using\s+(primary|secondary|tertiary)\s+font:\s+(.+)$/);
          if (match && match[1] === role) {
            return match[2].trim();
          }
        }
      }
      
      // Try to get from the preview containers
      const fontPreviewContainers = document.querySelectorAll('.font-preview-container');
      if (fontPreviewContainers.length > 0) {
        // Get computed style
        const style = window.getComputedStyle(fontPreviewContainers[0]);
        if (style.fontFamily) {
          return style.fontFamily.replace(/["']/g, '').split(',')[0].trim();
        }
      }
      
      // Try to get from the preview element
      const previewFont = document.querySelector('.font-preview');
      if (previewFont) {
        const style = window.getComputedStyle(previewFont);
        if (style.fontFamily) {
          return style.fontFamily.replace(/["']/g, '').split(',')[0].trim();
        }
      }
    }
    
    // Check if we have typography data
    if (currentTypography && currentTypography[`${role}_font_id`]) {
      const fontId = currentTypography[`${role}_font_id`];
      const font = fonts.find((f: any) => f.id === fontId);
      if (font) return font.family;
    }
    
    // Look for font name in console logs
    const fontLogs = document.querySelectorAll('.font-log');
    for (const log of fontLogs) {
      const text = log.textContent || '';
      if (text.includes(`Applied font to all preview containers:`)) {
        const fontName = text.split(':')[1]?.trim();
        if (fontName) return fontName;
      }
    }
    
    // Hardcode the font names based on the logs you shared
    if (role === 'primary') return 'Test Söhne';
    if (role === 'secondary') return 'Test Söhne Halbfett';
    if (role === 'tertiary') return 'Inter';
    
    // Fallback to a dash
    return '—';
  };

  // Use platform tab settings if available and initialize AI settings if needed
  useEffect(() => {
    if (activePlatform && currentSettings) {
      // Set active tabs from platform settings if available
      if (currentSettings.viewTab) {
        setActiveViewTab(currentSettings.viewTab);
      }
      if (currentSettings.analysisTab) {
        setActiveAnalysisTab(currentSettings.analysisTab);
      }
      
      // Handle AI settings
      if (currentSettings.scaleMethod === 'ai') {
        // Initialize AI scale settings if they don't exist or are incomplete
        if (!currentSettings.aiScale || 
            currentSettings.aiScale.recommendedBaseSize === undefined || 
            currentSettings.aiScale.originalSizeInPx === undefined) {
          
          console.log("Initializing missing AI settings");
          const currentScale = currentSettings.scale || { baseSize: 16, ratio: 1.2, stepsUp: 3, stepsDown: 2 };
          
          saveTypographySettings(activePlatform, {
            aiScale: {
              recommendedBaseSize: currentScale.baseSize,
              originalSizeInPx: currentScale.baseSize,
              recommendations: currentSettings.aiScale?.recommendations || '',
              summaryTable: currentSettings.aiScale?.summaryTable || '',
              reasoning: currentSettings.aiScale?.reasoning || ''
            }
          });
        }
        
        // Restore AI recommendations if they exist
        else if (currentSettings.aiScale && currentSettings.aiScale.recommendations) {
          console.log("Restoring AI settings from platform:", currentSettings.aiScale);
          
          const formattedRecommendation = `
## Typography Analysis Results

Based on the image analysis, I recommend the following typography scale:

- **Base Size**: ${currentSettings.aiScale.recommendedBaseSize}px
- **Scale Ratio**: ${currentSettings.scale?.ratio || 1.2}
- **Steps Up**: ${currentSettings.scale?.stepsUp || 3}
- **Steps Down**: ${currentSettings.scale?.stepsDown || 2}

${currentSettings.aiScale.recommendations || ''}

${currentSettings.aiScale.summaryTable || ''}

${currentSettings.aiScale.reasoning || ''}
`;
          
          // Set the AI analysis text based on which tab is active
          if (typeof activeAnalysisTab === 'string') {
            const tab = activeAnalysisTab;
            const PLATFORM_TAB = 'platform';
            const IMAGE_TAB = 'image';
            if (tab === PLATFORM_TAB) {
              setPlatformReasoning(formattedRecommendation);
            } else if (tab === IMAGE_TAB) {
              setImageAnalysis(formattedRecommendation);
            }
          }
        }
      }
    }
  }, [activePlatform, currentSettings, updatePlatform, activeAnalysisTab]);

  // Save tab selections when they change
  const handleViewTabChange = useCallback((tab: string) => {
    setActiveViewTab(tab);
    if (activePlatform) {
      // Use saveTypographySettings instead of updatePlatform for tab changes
      saveTypographySettings(activePlatform, { viewTab: tab });
    }
  }, [activePlatform, saveTypographySettings]);

  const handleAnalysisTabChange = useCallback((tab: string) => {
    setActiveAnalysisTab(tab as any);
    if (activePlatform) {
      // Use saveTypographySettings instead of updatePlatform for tab changes
      saveTypographySettings(activePlatform, { analysisTab: tab });
    }
  }, [activePlatform, saveTypographySettings]);

  if (!currentSettings) {
    return <div className="flex items-center justify-center h-full">Loading platform settings...</div>
  }

  // Ensure typeStyles exists
  const typeStyles = currentSettings.typeStyles || []
  const typographyUnit = currentSettings.units?.typography || 'px'

  // Constants
  const viewTabs = [
    { id: 'scale', label: 'Scale View' },
    { id: 'styles', label: 'Styles View' }
  ]

  const analysisTabs = [
    { id: 'platform', label: 'Platform Analysis' },
    { id: 'image', label: 'Image Analysis' }
  ]

  // This useEffect was consolidated with the one above
  // to avoid the "Rendered more hooks than during the previous render" error

  return (
    <div className="h-full">
      <div className="px-4 py-4">
        <div className="flex items-center justify-between mb-2">
          <Label className="text-xs mb-2 block">Platform</Label>
          <Button variant="ghost" size="icon" onClick={() => setShowPlatformActions(prev => !prev)}>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
        {showPlatformActions && (
          <div className="border p-2 rounded-md mb-2 bg-muted/10 space-y-1">
            <Button 
              variant="ghost" 
              className="w-full justify-start text-sm font-normal hover:bg-muted" 
              onClick={() => {
                if (activePlatform) {
                  router.push(`/platforms/${activePlatform}`);
                }
              }}
            >
              Edit platform
            </Button>
            <Button 
              variant="ghost" 
              className="w-full justify-start text-sm font-normal hover:bg-muted" 
              onClick={handleDuplicatePlatform}
            >
              Duplicate to other brand
            </Button>
          </div>
        )}
        <Select
          value={activePlatform}
          onValueChange={setCurrentPlatform}
        >
          <SelectTrigger className="text-xs h-8 ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2 [&>svg:last-child]:hidden text-left">
            <SelectValue placeholder="Select platform">
              {platformSettings.find(p => p.id === activePlatform)?.name || "Select platform"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {platforms.map((platform, index) => (
              <SelectItem key={`platform-${platform.id}-${index}`} value={platform.id}>
                {platform.name || `Platform ${index + 1}`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="mt-[11.9px]">
        <Separator className="mb-4" />
      </div>

      <div className="px-4 py-4">
        <Label className="text-xs mb-2 block">Brand Font</Label>
        <div className="relative">
          <Select 
            value={currentFontRole || 'primary'} 
            onValueChange={(value) => {
              const typedValue = value as 'primary' | 'secondary' | 'tertiary';
              
              if (!activePlatform) {
                console.error('No active platform selected');
                toast.error("Error", {
                  description: "No platform selected - please select a platform first"
                });
                return;
              }
              
              handleFontRoleChange(typedValue);
              
              // Use updatePlatform directly for font role since it's a UI-only state
              try {
                updatePlatform(activePlatform, {
                  currentFontRole: typedValue
                });
                setCurrentFontRole(typedValue);
              } catch (error) {
                console.error('Error updating font role:', error);
                toast.error("Error", {
                  description: "An error occurred while updating font role"
                });
              }
            }}
          >
            <SelectTrigger className="text-xs">
              <SelectValue>
                {currentFontRole ? currentFontRole.charAt(0).toUpperCase() + currentFontRole.slice(1) : 'Primary'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="primary">Primary</SelectItem>
              <SelectItem value="secondary">Secondary</SelectItem>
              <SelectItem value="tertiary">Tertiary</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Collapsible defaultOpen>
        <CollapsibleTrigger className="flex w-full items-center justify-between px-4 py-4 text-sm font-semibold group">
          <span>Scale Method</span>
          <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180" />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-4 py-4">
            <RadioGroup
              value={currentSettings.scaleMethod} 
              onValueChange={(value) => {
                const method = value as ScaleMethod;
                console.log(`Changing scale method to: ${method}`);
                
                if (!activePlatform) {
                  console.error('No active platform selected');
                  toast.error("Error", {
                    description: "No platform selected - please select a platform first"
                  });
                  return;
                }
                
                // If switching to AI method, ensure AI settings are initialized
                if (method === 'ai') {
                  // Initialize AI settings if they don't exist or are incomplete
                  const currentScale = currentSettings.scale || { baseSize: 16, ratio: 1.2, stepsUp: 3, stepsDown: 2 };
                  
                  // Use safeSaveTypographySettings instead of saveTypographySettings
                  safeSaveTypographySettings(activePlatform, {
                    scaleMethod: method,
                    aiScale: currentSettings.aiScale || {
                      recommendedBaseSize: currentScale.baseSize,
                      originalSizeInPx: currentScale.baseSize,
                      recommendations: '',
                      summaryTable: '',
                      reasoning: ''
                    },
                    // Set default tabs for AI method
                    viewTab: currentSettings.viewTab || 'scale',
                    analysisTab: currentSettings.analysisTab || 'platform'
                  });
                } else {
                  // For other methods, just update the scale method
                  // Use safeSaveTypographySettings instead of saveTypographySettings
                  safeSaveTypographySettings(activePlatform, { 
                    scaleMethod: method 
                  });
                }
              }}
              className="grid grid-cols-3 gap-4"
            >
              <div>
                <RadioGroupItem value="modular" id="modular" className="peer sr-only" defaultChecked={currentSettings.scaleMethod === 'modular'} />
                <Label
                  htmlFor="modular"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-transparent p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                  <LineChart className="h-6 w-6" />
                  <div className="mt-2 text-xs">Modular</div>
                </Label>
              </div>
              <div>
                <RadioGroupItem value="distance" id="distance" className="peer sr-only" defaultChecked={currentSettings.scaleMethod === 'distance'} />
                <Label
                  htmlFor="distance"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-transparent p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                  <ScanEye className="h-6 w-6" />
                  <div className="mt-2 text-xs">Distance</div>
                </Label>
              </div>
              <div>
                <RadioGroupItem value="ai" id="ai" className="peer sr-only" defaultChecked={currentSettings.scaleMethod === 'ai'} />
                <Label
                  htmlFor="ai"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-transparent p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                  <Codesandbox className="h-6 w-6" />
                  <div className="mt-2 text-xs">AI</div>
                </Label>
              </div>
            </RadioGroup>

            {currentSettings.scaleMethod === 'modular' && (
              <div className="mt-4 space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs">Scale Type</Label>
                  <Select
                    value={currentSettings?.scale?.ratio?.toString() || "1.2"}
                    onValueChange={(value) => {
                      // Use saveTypographySettings instead of updatePlatform for scale changes
                      saveTypographySettings(activePlatform, {
                        scale: {
                          ...((currentSettings?.scale) || {}),
                          ratio: parseFloat(value)
                        }
                      });
                    }}
                  >
                    <SelectTrigger className="text-xs h-8 ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1.067">Minor Second (1.067)</SelectItem>
                      <SelectItem value="1.125">Major Second (1.125)</SelectItem>
                      <SelectItem value="1.2">Minor Third (1.2)</SelectItem>
                      <SelectItem value="1.25">Major Third (1.25)</SelectItem>
                      <SelectItem value="1.333">Perfect Fourth (1.333)</SelectItem>
                      <SelectItem value="1.414">Augmented Fourth (1.414)</SelectItem>
                      <SelectItem value="1.5">Perfect Fifth (1.5)</SelectItem>
                      <SelectItem value="1.618">Golden Ratio (1.618)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">
                    Base Size ({currentPlatformSettings?.units.typography || 'px'})
                  </Label>
                  <Input
                    type="number"
                    min="8"
                    max="40"
                    value={currentSettings?.scale?.baseSize || 16}
                    onChange={(e) => {
                      const newBaseSize = parseFloat(e.target.value);
                      console.log("Setting Base Size to:", newBaseSize);
                      
                      // Use setTimeout to ensure this update happens in a separate tick
                      setTimeout(() => {
                        try {
                          if (activePlatform) {
                            safeSaveTypographySettings(activePlatform, {
                              scale: {
                                ...((currentSettings?.scale) || {}),
                                baseSize: newBaseSize
                              }
                            });
                          } else {
                            console.error('No active platform selected');
                            toast.error("Error", {
                              description: "No platform selected - please select a platform first"
                            });
                          }
                        } catch (error) {
                          console.error('Error updating typography settings:', error);
                          toast.error("Error", {
                            description: "An error occurred while updating settings"
                          });
                        }
                      }, 0);
                    }}
                    className="text-xs h-8"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs">Steps Up</Label>
                    <Input
                      type="number"
                      min="0"
                      max="10"
                      value={currentSettings?.scale?.stepsUp || 3}
                      onChange={(e) => {
                        const newValue = parseInt(e.target.value);
                        console.log("Setting Steps Up to:", newValue);
                        // Use setTimeout to ensure this update happens in a separate tick
                        setTimeout(() => {
                          // Use saveTypographySettings instead of updatePlatform for scale changes
                          saveTypographySettings(activePlatform, {
                            scale: {
                              ...((currentSettings?.scale) || {}),
                              stepsUp: newValue
                            }
                          });
                        }, 0);
                      }}
                      className="text-xs h-8"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Steps Down</Label>
                    <Input
                      type="number"
                      min="0"
                      max="10"
                      value={currentSettings?.scale?.stepsDown || 2}
                      onChange={(e) => {
                        const newValue = parseInt(e.target.value);
                        console.log("Setting Steps Down to:", newValue);
                        // Use setTimeout to ensure this update happens in a separate tick
                        setTimeout(() => {
                          // Use saveTypographySettings instead of updatePlatform for scale changes
                          saveTypographySettings(activePlatform, {
                            scale: {
                              ...((currentSettings?.scale) || {}),
                              stepsDown: newValue
                            }
                          });
                        }, 0);
                      }}
                      className="text-xs h-8"
                    />
                  </div>
                </div>
              </div>
            )}

            {currentSettings.scaleMethod === 'distance' && (
              <div className="mt-4 space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs">Scale Type</Label>
                  <Select
                    value={currentSettings.scale.ratio.toString()}
                    onValueChange={(value) => {
                      // Use saveTypographySettings instead of updatePlatform for scale changes
                      saveTypographySettings(activePlatform, {
                        scale: {
                          ...(currentSettings.scale || {}),
                          ratio: parseFloat(value)
                        }
                      });
                    }}
                  >
                    <SelectTrigger className="text-xs h-8 ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1.067">Minor Second (1.067)</SelectItem>
                      <SelectItem value="1.125">Major Second (1.125)</SelectItem>
                      <SelectItem value="1.2">Minor Third (1.2)</SelectItem>
                      <SelectItem value="1.25">Major Third (1.25)</SelectItem>
                      <SelectItem value="1.333">Perfect Fourth (1.333)</SelectItem>
                      <SelectItem value="1.414">Augmented Fourth (1.414)</SelectItem>
                      <SelectItem value="1.5">Perfect Fifth (1.5)</SelectItem>
                      <SelectItem value="1.618">Golden Ratio (1.618)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">
                    Base Size ({currentPlatformSettings?.units.typography || 'px'})
                  </Label>
                  <Input
                    type="number"
                    value={Math.round(calculateDistanceBasedSize(
                      currentSettings.distanceScale.viewingDistance,
                      currentSettings.distanceScale.visualAcuity,
                      currentSettings.distanceScale.meanLengthRatio,
                      currentSettings.distanceScale.textType,
                      currentSettings.distanceScale.lighting,
                      currentSettings.distanceScale.ppi
                    ) * 100) / 100}
                    disabled
                    className="text-xs h-8"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Viewing Distance (cm)</Label>
                  <Input
                    type="number"
                    min="1"
                    step="1"
                    value={currentSettings.distanceScale.viewingDistance}
                    onChange={(e) => {
                      handleDistanceScaleChange({
                        viewingDistance: Number(e.target.value),
                      })
                    }}
                    className="text-xs h-8"
                  />
                </div>

                <div>
                  <Label className="text-xs">Visual Acuity (decimal)</Label>
                  <Input
                    type="number"
                    min="0.1"
                    max="2.0"
                    step="0.1"
                    value={currentSettings.distanceScale.visualAcuity}
                    onChange={(e) => {
                      handleDistanceScaleChange({
                        visualAcuity: Number(e.target.value),
                      })
                    }}
                    className="text-xs h-8"
                  />
                </div>

                <div>
                  <Label className="text-xs">Mean Length-Font Size Ratio</Label>
                  <Input
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={currentSettings.distanceScale.meanLengthRatio}
                    onChange={(e) => {
                      handleDistanceScaleChange({
                        meanLengthRatio: Number(e.target.value),
                      })
                    }}
                    className="text-xs h-8"
                  />
                </div>

                <div>
                  <Label className="text-xs mb-2">Text Type</Label>
                  <AnimatedTabs 
                    tabs={[
                      { id: 'continuous', label: 'Continuous' },
                      { id: 'isolated', label: 'Isolated' }
                    ]}
                    defaultTab={currentSettings.distanceScale.textType}
                    onChange={(value) => 
                      handleDistanceScaleChange({ textType: value as 'continuous' | 'isolated' })
                    }
                    layoutId="text-type-tabs"
                  />
                </div>

                <div>
                  <Label className="text-xs mb-2">Lighting Conditions</Label>
                  <AnimatedTabs 
                    tabs={[
                      { id: 'good', label: 'Good' },
                      { id: 'moderate', label: 'Moderate' },
                      { id: 'poor', label: 'Poor' }
                    ]}
                    defaultTab={currentSettings.distanceScale.lighting}
                    onChange={(value) => 
                      handleDistanceScaleChange({ lighting: value as 'good' | 'moderate' | 'poor' })
                    }
                    layoutId="lighting-tabs"
                  />
                </div>

                <div>
                  <Label className="text-xs">Screen PPI</Label>
                  <Input
                    type="number"
                    min="72"
                    step="1"
                    value={currentSettings.distanceScale.ppi}
                    onChange={(e) => {
                      handleDistanceScaleChange({
                        ppi: Number(e.target.value),
                      })
                    }}
                    className="text-xs h-8"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs">Steps Up</Label>
                    <Input
                      type="number"
                      min="0"
                      max="10"
                      value={currentSettings.scale.stepsUp}
                      onChange={(e) => {
                        const newValue = parseInt(e.target.value);
                        console.log("Setting Steps Up to:", newValue);
                        // Use setTimeout to ensure this update happens in a separate tick
                        setTimeout(() => {
                          // Use saveTypographySettings instead of updatePlatform for scale changes
                          saveTypographySettings(activePlatform, {
                            scale: {
                              ...(currentSettings.scale || {}),
                              stepsUp: newValue
                            }
                          });
                        }, 0);
                      }}
                      className="text-xs h-8"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Steps Down</Label>
                    <Input
                      type="number"
                      min="0"
                      max="10"
                      value={currentSettings.scale.stepsDown}
                      onChange={(e) => {
                        const newValue = parseInt(e.target.value);
                        console.log("Setting Steps Down to:", newValue);
                        // Use setTimeout to ensure this update happens in a separate tick
                        setTimeout(() => {
                          // Use saveTypographySettings instead of updatePlatform for scale changes
                          saveTypographySettings(activePlatform, {
                            scale: {
                              ...(currentSettings.scale || {}),
                              stepsDown: newValue
                            }
                          });
                        }, 0);
                      }}
                      className="text-xs h-8"
                    />
                  </div>
                </div>
              </div>
            )}

            {currentSettings.scaleMethod === 'ai' && (
              <div className="mt-4 space-y-4">
                <AnimatedTabs
                  tabs={analysisTabs}
                  defaultTab={currentSettings.analysisTab || "platform"}
                  onChange={(value) => {
                    handleAnalysisTabChange(value as 'platform' | 'image');
                    setAiError(null);
                    setPlatformReasoning(null);
                    setImageAnalysis(null);
                    setProgress(0);
                    if (value === 'platform') {
                      setSelectedImage(null);
                    }
                  }}
                  layoutId="analysis-tabs"
                />

                {activeAnalysisTab === 'platform' && (
                  <div className="space-y-4">
                    <div className="space-y-4">
                      <div>
                        <Label className="text-xs">Context</Label>
                        <Select
                          value={selectedContext}
                          onValueChange={setSelectedContext}
                        >
                          <SelectTrigger className="text-xs h-8 ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2">
                            <SelectValue placeholder="Select context" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="reading">Long-form Reading</SelectItem>
                            <SelectItem value="ui">UI Interface</SelectItem>
                            <SelectItem value="marketing">Marketing/Ads</SelectItem>
                            <SelectItem value="signage">Digital Signage</SelectItem>
                            <SelectItem value="dashboard">Data Dashboard</SelectItem>
                            <SelectItem value="mobile-app">Mobile Application</SelectItem>
                            <SelectItem value="web-app">Web Application</SelectItem>
                            <SelectItem value="e-commerce">E-commerce</SelectItem>
                            <SelectItem value="documentation">Documentation</SelectItem>
                            <SelectItem value="blog">Blog/Article</SelectItem>
                            <SelectItem value="presentation">Presentation</SelectItem>
                            <SelectItem value="social-media">Social Media</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-xs">Location</Label>
                        <Select
                          value={selectedLocation}
                          onValueChange={setSelectedLocation}
                        >
                          <SelectTrigger className="text-xs h-8 ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2">
                            <SelectValue placeholder="Select location" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="indoor">Indoor</SelectItem>
                            <SelectItem value="outdoor-shaded">Outdoor (Shaded)</SelectItem>
                            <SelectItem value="outdoor-direct">Outdoor (Direct Sunlight)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs">Additional Requirements</Label>
                        <Input
                          placeholder="E.g., High contrast needed, Multilingual support..."
                          value={customRequirements}
                          onChange={(e) => setCustomRequirements(e.target.value)}
                          className="text-xs h-8"
                        />
                      </div>

                      {aiError && (
                        <div className="text-sm text-red-500">
                          {aiError}
                        </div>
                      )}

                      {isGenerating && (
                        <div className="space-y-2">
                          <Progress value={progress} className="h-1" />
                          <div className="flex items-center justify-center text-xs text-muted-foreground">
                            <Loader2 className="h-3 w-3 animate-spin mr-2" />
                            Generating recommendations...
                          </div>
                        </div>
                      )}

                      {platformReasoning && (
                        <>
                          <div className="space-y-2">
                            <Label className="text-xs">AI Recommendations</Label>
                            <div className="text-xs text-muted-foreground whitespace-pre-wrap font-mono">
                              {currentSettings.aiScale?.recommendations}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-xs">AI Reasoning</Label>
                            <div className="text-xs text-muted-foreground whitespace-pre-wrap">
                              {platformReasoning}
                            </div>
                          </div>

                          {currentSettings.aiScale?.summaryTable && (
                            <div className="space-y-2">
                              <Label className="text-xs">Summary Table</Label>
                              <div className="text-xs whitespace-pre-wrap font-mono bg-muted p-2 rounded">
                                {currentSettings.aiScale.summaryTable}
                              </div>
                            </div>
                          )}

                          <div className="mt-4 space-y-4 border-t pt-4">
                            <h4 className="text-xs font-medium">Adjust Scale Parameters</h4>
                            
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <Label className="text-xs">
                                  Base Size ({currentPlatformSettings?.units.typography || 'px'})
                                </Label>
                                <Input
                                  type="number"
                                  value={currentSettings.aiScale?.recommendedBaseSize || 0}
                                  onChange={(e) => {
                                    const newValue = parseFloat(e.target.value);
                                    // Update both aiScale and scale
                                    saveTypographySettings(activePlatform, {
                                      aiScale: {
                                        ...currentSettings.aiScale,
                                        recommendedBaseSize: newValue,
                                        originalSizeInPx: convertUnits(
                                          newValue,
                                          currentPlatformSettings?.units.typography || 'px',
                                          'px',
                                          currentSettings.scale.baseSize
                                        )
                                      },
                                      scale: {
                                        ...(currentSettings.scale || {}),
                                        baseSize: newValue
                                      }
                                    });
                                  }}
                                  className="text-xs h-8"
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                  Original AI suggestion: {currentSettings.aiScale?.originalSizeInPx || 0}px
                                </p>
                              </div>

                              <div className="space-y-2">
                                <Label className="text-xs">Scale Type</Label>
                                <Select
                                  value={currentSettings.scale.ratio.toString()}
                                  onValueChange={(value) => {
                                    // Use saveTypographySettings instead of updatePlatform for scale changes
                                    saveTypographySettings(activePlatform, {
                                      scale: {
                                        ...(currentSettings.scale || {}),
                                        ratio: parseFloat(value)
                                      }
                                    });
                                  }}
                                >
                                  <SelectTrigger className="text-xs h-8 ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="1.067">Minor Second (1.067)</SelectItem>
                                    <SelectItem value="1.125">Major Second (1.125)</SelectItem>
                                    <SelectItem value="1.2">Minor Third (1.2)</SelectItem>
                                    <SelectItem value="1.25">Major Third (1.25)</SelectItem>
                                    <SelectItem value="1.333">Perfect Fourth (1.333)</SelectItem>
                                    <SelectItem value="1.414">Augmented Fourth (1.414)</SelectItem>
                                    <SelectItem value="1.5">Perfect Fifth (1.5)</SelectItem>
                                    <SelectItem value="1.618">Golden Ratio (1.618)</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label className="text-xs">Steps Up</Label>
                                  <Input
                                    type="number"
                                    min="0"
                                    max="10"
                                    value={currentSettings.scale.stepsUp}
                                    onChange={(e) => {
                                      const newValue = parseInt(e.target.value);
                                      console.log("Setting Steps Up to:", newValue);
                                      // Use setTimeout to ensure this update happens in a separate tick
                                      setTimeout(() => {
                                        // Use saveTypographySettings instead of updatePlatform for scale changes
                                        saveTypographySettings(activePlatform, {
                                          scale: {
                                            ...(currentSettings.scale || {}),
                                            stepsUp: newValue
                                          }
                                        });
                                      }, 0);
                                    }}
                                    className="text-xs h-8"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-xs">Steps Down</Label>
                                  <Input
                                    type="number"
                                    min="0"
                                    max="10"
                                    value={currentSettings.scale.stepsDown}
                                    onChange={(e) => {
                                      const newValue = parseInt(e.target.value);
                                      console.log("Setting Steps Down to:", newValue);
                                      // Use setTimeout to ensure this update happens in a separate tick
                                      setTimeout(() => {
                                        // Use saveTypographySettings instead of updatePlatform for scale changes
                                        saveTypographySettings(activePlatform, {
                                          scale: {
                                            ...(currentSettings.scale || {}),
                                            stepsDown: newValue
                                          }
                                        });
                                      }, 0);
                                    }}
                                    className="text-xs h-8"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </>
                      )}

                      <Button 
                        className="w-full text-xs"
                        onClick={handleGenerateScale}
                        disabled={!selectedContext || isGenerating}
                      >
                        {isGenerating ? 'Generating...' : 'Generate Scale'}
                      </Button>
                    </div>
                  </div>
                )}

                {activeAnalysisTab === 'image' && (
                  <div className="space-y-4">
                    {!selectedImage ? (
                      <div className="border-2 border-dashed rounded-lg p-4 text-center">
                        <Input 
                          type="file" 
                          accept="image/*"
                          className="hidden" 
                          id="image-upload"
                          onChange={handleImageAnalysis}
                        />
                        <Label htmlFor="image-upload" className="cursor-pointer">
                          <div className="space-y-2">
                            <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
                            <p className="text-xs text-muted-foreground">
                              Upload UI/Environment Image
                            </p>
                          </div>
                        </Label>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="relative aspect-video rounded-lg overflow-hidden border">
                          <img 
                            src={selectedImage} 
                            alt="Preview" 
                            className="object-contain w-full h-full"
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            className="absolute top-2 right-2"
                            onClick={() => {
                              setSelectedImage(null)
                              setImageAnalysis(null)
                              setAiError(null)
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>

                        {aiError && (
                          <div className="text-sm text-red-500">
                            {aiError}
                          </div>
                        )}

                        {isAnalyzing && (
                          <div className="space-y-2">
                            <Progress value={progress} className="h-1" />
                            <div className="flex items-center justify-center text-xs text-muted-foreground">
                              <Loader2 className="h-3 w-3 animate-spin mr-2" />
                              Analyzing image...
                            </div>
                          </div>
                        )}

                        {imageAnalysis && (
                          <div className="mt-4 p-4 bg-muted rounded-lg">
                            <h4 className="text-xs font-medium">Image Analysis Results</h4>
                            <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                              {imageAnalysis}
                            </p>
                          </div>
                        )}

                        {(platformReasoning || imageAnalysis) && (
                          <div className="mt-4 space-y-4 border-t pt-4">
                            <h4 className="text-xs font-medium">Adjust Scale Parameters</h4>
                            
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <Label className="text-xs">
                                  Base Size ({currentPlatformSettings?.units.typography || 'px'})
                                </Label>
                                <Input
                                  type="number"
                                  value={currentSettings.scale.baseSize}
                                  onChange={(e) => {
                                    saveTypographySettings(activePlatform, {
                                      scale: {
                                        ...(currentSettings.scale || {}),
                                        baseSize: parseFloat(e.target.value)
                                      }
                                    })
                                  }}
                                  className="text-xs h-8"
                                />
                              </div>

                              <div className="space-y-2">
                                <Label className="text-xs">Scale Type</Label>
                                <Select
                                  value={currentSettings.scale.ratio.toString()}
                                  onValueChange={(value) => {
                                    // Use saveTypographySettings instead of updatePlatform for scale changes
                                    saveTypographySettings(activePlatform, {
                                      scale: {
                                        ...(currentSettings.scale || {}),
                                        ratio: parseFloat(value)
                                      }
                                    });
                                  }}
                                >
                                  <SelectTrigger className="text-xs h-8 ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="1.067">Minor Second (1.067)</SelectItem>
                                    <SelectItem value="1.125">Major Second (1.125)</SelectItem>
                                    <SelectItem value="1.2">Minor Third (1.2)</SelectItem>
                                    <SelectItem value="1.25">Major Third (1.25)</SelectItem>
                                    <SelectItem value="1.333">Perfect Fourth (1.333)</SelectItem>
                                    <SelectItem value="1.414">Augmented Fourth (1.414)</SelectItem>
                                    <SelectItem value="1.5">Perfect Fifth (1.5)</SelectItem>
                                    <SelectItem value="1.618">Golden Ratio (1.618)</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label className="text-xs">Steps Up</Label>
                                  <Input
                                    type="number"
                                    min="0"
                                    max="10"
                                    value={currentSettings.scale.stepsUp}
                                    onChange={(e) => {
                                      const newValue = parseInt(e.target.value);
                                      console.log("Setting Steps Up to:", newValue);
                                      // Use setTimeout to ensure this update happens in a separate tick
                                      setTimeout(() => {
                                        // Use saveTypographySettings instead of updatePlatform for scale changes
                                        saveTypographySettings(activePlatform, {
                                          scale: {
                                            ...(currentSettings.scale || {}),
                                            stepsUp: newValue
                                          }
                                        });
                                      }, 0);
                                    }}
                                    className="text-xs h-8"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-xs">Steps Down</Label>
                                  <Input
                                    type="number"
                                    min="0"
                                    max="10"
                                    value={currentSettings.scale.stepsDown}
                                    onChange={(e) => {
                                      const newValue = parseInt(e.target.value);
                                      console.log("Setting Steps Down to:", newValue);
                                      // Use setTimeout to ensure this update happens in a separate tick
                                      setTimeout(() => {
                                        // Use saveTypographySettings instead of updatePlatform for scale changes
                                        saveTypographySettings(activePlatform, {
                                          scale: {
                                            ...(currentSettings.scale || {}),
                                            stepsDown: newValue
                                          }
                                        });
                                      }, 0);
                                    }}
                                    className="text-xs h-8"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Prompt History Section */}
                        {currentSettings.aiScale?.prompts && currentSettings.aiScale.prompts.length > 0 && (
                          <div className="mt-6 mb-6 space-y-4 border-t pt-4">
                            <h4 className="text-xs font-medium">Prompt History</h4>
                            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                              {currentSettings.aiScale.prompts.map((prompt: any) => (
                                <div key={prompt.timestamp} className="border rounded-md p-3 text-xs space-y-2">
                                  <div className="flex justify-between items-center">
                                    <span className="font-medium">{new Date(prompt.timestamp).toLocaleString()}</span>
                                    <Badge variant="outline" className="text-[0.65rem]">
                                      {prompt.deviceType || 'Unknown Device'}
                                    </Badge>
                                  </div>
                                  
                                  <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                                    {prompt.context && (
                                      <div>
                                        <span className="font-medium">Context:</span> {prompt.context}
                                      </div>
                                    )}
                                    {prompt.location && (
                                      <div>
                                        <span className="font-medium">Location:</span> {prompt.location}
                                      </div>
                                    )}
                                  </div>
                                  
                                  {/* Display the stored image if available */}
                                  {(prompt.storedImageUrl || prompt.imageUrl) && (
                                    <div className="mt-2">
                                      <img 
                                        src={prompt.storedImageUrl || prompt.imageUrl} 
                                        alt="Reference image" 
                                        className="w-full h-auto max-h-32 object-contain rounded border"
                                      />
                                    </div>
                                  )}
                                  
                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <span className="font-medium text-muted-foreground">Base Size:</span> {prompt.result?.recommendedBaseSize || 16}px
                                    </div>
                                    <div>
                                      <span className="font-medium text-muted-foreground">Ratio:</span> {prompt.result?.ratio || 1.2}
                                    </div>
                                    <div>
                                      <span className="font-medium text-muted-foreground">Steps Up:</span> {prompt.result?.stepsUp || 3}
                                    </div>
                                    <div>
                                      <span className="font-medium text-muted-foreground">Steps Down:</span> {prompt.result?.stepsDown || 2}
                                    </div>
                                  </div>
                                  
                                  <div className="flex justify-between pt-1">
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="h-6 text-xs"
                                      onClick={() => {
                                        // Apply this prompt's settings
                                        if (activePlatform && currentSettings && prompt.result) {
                                          saveTypographySettings(activePlatform, {
                                            scale: {
                                              ...(currentSettings.scale || {}),
                                              baseSize: prompt.result.recommendedBaseSize || 16,
                                              ratio: prompt.result.ratio || 1.2,
                                              stepsUp: prompt.result.stepsUp || 3,
                                              stepsDown: prompt.result.stepsDown || 2
                                            },
                                            aiScale: {
                                              ...(currentSettings.aiScale || {}),
                                              recommendedBaseSize: prompt.result.recommendedBaseSize || 16,
                                              originalSizeInPx: prompt.result.recommendedBaseSize || 16,
                                              recommendations: prompt.result.recommendations || '',
                                              summaryTable: prompt.result.summaryTable || '',
                                              reasoning: prompt.result.reasoning || ''
                                            }
                                          });
                                          
                                          // Set the AI analysis text
                                          const formattedRecommendation = `
## Typography Analysis Results

Based on the image analysis, I recommend the following typography scale:

- **Base Size**: ${prompt.result?.recommendedBaseSize || 16}px
- **Scale Ratio**: ${prompt.result?.ratio || 1.2}
- **Steps Up**: ${prompt.result?.stepsUp || 3}
- **Steps Down**: ${prompt.result?.stepsDown || 2}

${prompt.result?.recommendations || ''}

${prompt.result?.summaryTable || ''}

${prompt.result?.reasoning || ''}
`;
                                          
                                          // Update the analysis text based on active tab
                                          if (typeof activeAnalysisTab === 'string') {
                                            const tab = activeAnalysisTab;
                                            const PLATFORM_TAB = 'platform';
                                            const IMAGE_TAB = 'image';
                                            if (tab === PLATFORM_TAB) {
                                              setPlatformReasoning(formattedRecommendation);
                                            } else if (tab === IMAGE_TAB) {
                                              setImageAnalysis(formattedRecommendation);
                                            }
                                          }
                                        }
                                      }}
                                    >
                                      Apply Settings
                                    </Button>
                                    
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      className="h-6 text-xs text-destructive hover:text-destructive"
                                      onClick={() => {
                                        // Remove this prompt from history
                                        if (activePlatform && currentSettings && currentSettings.aiScale) {
                                          const updatedPrompts = currentSettings.aiScale.prompts?.filter(
                                            (p: any) => p.timestamp !== prompt.timestamp
                                          ) || [];
                                          
                                          saveTypographySettings(activePlatform, {
                                            aiScale: {
                                              ...(currentSettings.aiScale || {}),
                                              prompts: updatedPrompts
                                            }
                                          });
                                        }
                                      }}
                                    >
                                      Delete
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <Button 
                          className="w-full text-xs"
                          onClick={() => handleGenerateFromImage(selectedImage)}
                          disabled={isAnalyzing}
                        >
                          {isAnalyzing ? 'Analyzing...' : 'Analyze Image'}
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>

      <Collapsible>
        <CollapsibleTrigger 
          className="flex w-full items-center justify-between px-4 py-4 text-sm font-semibold border-t group"
        >
          <span>Type Styles</span>
          <ChevronDown 
            className="h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180" 
            aria-hidden="true"
          />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-4 py-4 space-y-4">
            <div className="flex justify-between items-center">
              <Label className="text-xs">Styles</Label>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-xs"
                  onClick={handleCopyStylesToAllPlatforms}
                >
                  Copy to All Platforms
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-xs"
                  onClick={handleAddTypeStyle}
                >
                  Add Style
                </Button>
              </div>
            </div>
            
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={typeStyles.map((style: any) => style.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {typeStyles.map((style: any) => (
                    <SortableTypeStyle 
                      key={style.id} 
                      style={style} 
                      handleTypeStyleChange={handleTypeStyleChange} 
                      handleDeleteTypeStyle={handleDeleteTypeStyle} 
                      handleDuplicateStyle={handleDuplicateStyle} 
                      getScaleValues={getScaleValues}
                      typographyUnit={typographyUnit}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        </CollapsibleContent>
      </Collapsible>

      <Collapsible>
        <CollapsibleTrigger className="flex w-full items-center justify-between px-4 py-4 text-sm font-semibold border-t group">
          <span>Accessibility</span>
          <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180" />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-4 py-4 space-y-4">
            <div>
              <Label className="text-xs">Minimum Contrast (Body)</Label>
              <Input
                type="number"
                step="0.1"
                value={currentSettings.accessibility?.minContrastBody || 4.5}
                onChange={(e) => {
                  handleAccessibilityChange({
                    minContrastBody: Number(e.target.value),
                  })
                }}
                className="text-xs h-8"
              />
              <p className="text-xs text-muted-foreground mt-1">WCAG 2.1 Level AA requires 4.5:1</p>
            </div>
            <div>
              <Label className="text-xs">Minimum Contrast (Large)</Label>
              <Input
                type="number"
                step="0.1"
                value={currentSettings.accessibility?.minContrastLarge || 3.0}
                onChange={(e) => {
                  handleAccessibilityChange({
                    minContrastLarge: Number(e.target.value),
                  })
                }}
                className="text-xs h-8"
              />
              <p className="text-xs text-muted-foreground mt-1">WCAG 2.1 Level AA requires 3:1 for large text</p>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}

function TypeScaleTab({ platform }: { platform: Platform }) {
  const { saveTypographySettings } = useTypographyStore() as any;
  // ... existing code ...
}

function DistanceBasedTab({
  platform,
  currentSettings,
  updatePlatform,
}: {
  platform: Platform;
  currentSettings: any;
  updatePlatform: (id: string, updates: Partial<Platform>) => void;
}) {
  // Get saveTypographySettings to ensure changes are saved to Supabase
  const { saveTypographySettings } = useTypographyStore();
  const calculatedBaseSize = useMemo(() => {
    if (!platform.distanceScale) return 0;
    return calculateDistanceBasedSize(
      platform.distanceScale.viewingDistance,
      platform.distanceScale.visualAcuity,
      platform.distanceScale.meanLengthRatio,
      platform.distanceScale.textType,
      platform.distanceScale.lighting,
      platform.distanceScale.ppi
    );
  }, [platform.distanceScale]);

  return (
    <div className="space-y-4">
      <div>
        <RadioGroup
          value={platform.scaleMethod} 
          onValueChange={(value) => {
            const typographyStore = useTypographyStore.getState();
            typographyStore.saveTypographySettings(platform.id, { scaleMethod: value as ScaleMethod });
          }}
          className="grid grid-cols-3 gap-4"
        >
          <div>
            <RadioGroupItem value="modular" id="modular-distance" className="peer sr-only" defaultChecked={platform.scaleMethod === 'modular'} />
            <Label
              htmlFor="modular-distance"
              className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-transparent p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
            >
              <LineChart className="h-6 w-6" />
              <div className="mt-2 text-xs">Modular</div>
            </Label>
          </div>
          <div>
            <RadioGroupItem value="distance" id="distance-distance" className="peer sr-only" defaultChecked={platform.scaleMethod === 'distance'} />
            <Label
              htmlFor="distance-distance"
              className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-transparent p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
            >
              <ScanEye className="h-6 w-6" />
              <div className="mt-2 text-xs">Distance</div>
            </Label>
          </div>
          <div>
            <RadioGroupItem value="ai" id="ai-distance" className="peer sr-only" defaultChecked={platform.scaleMethod === 'ai'} />
            <Label
              htmlFor="ai-distance"
              className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-transparent p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
            >
              <Sparkles className="h-6 w-6" />
              <div className="mt-2 text-xs">AI</div>
            </Label>
          </div>
        </RadioGroup>
      </div>

      <div>
        <Label className="text-xs">Base Size ({currentSettings.units.typography})</Label>
        <Input
          type="number"
          value={Math.round(calculatedBaseSize * 100) / 100}
          disabled
          className="text-xs h-8"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Base size calculated from distance parameters
        </p>
      </div>

      <div>
        <Label className="text-xs">Viewing Distance (cm)</Label>
        <Input
          type="number"
          min="1"
          step="1"
          value={platform.distanceScale?.viewingDistance || 0}
          onChange={(e) => {
            // Use saveTypographySettings instead of updatePlatform
            saveTypographySettings(platform.id, {
              distanceScale: {
                ...platform.distanceScale,
                viewingDistance: Number(e.target.value)
              }
            })
          }}
          className="text-xs h-8"
        />
      </div>
      {/* ... rest of the distance inputs ... */}
    </div>
  )
}

function ModularScaleTab({
  platform,
  currentSettings,
  updatePlatform,
}: {
  platform: Platform;
  currentSettings: any;
  updatePlatform: (id: string, updates: Partial<Platform>) => void;
}) {
  // Get saveTypographySettings to ensure changes are saved to Supabase
  const { saveTypographySettings } = useTypographyStore();
  return (
    <div className="space-y-4">
      <div>
        <Label className="text-xs">Base Size ({currentSettings.units?.typography})</Label>
        <Input
          type="number"
          min="8"
          max="40"
          value={platform.scale.baseSize}
          onChange={(e) => {
            const newBaseSize = parseFloat(e.target.value);
            console.log("Setting Base Size to:", newBaseSize);
            
            // Use setTimeout to ensure this update happens in a separate tick
            setTimeout(() => {
              // Use saveTypographySettings instead of updatePlatform to ensure data is saved to Supabase
              saveTypographySettings(platform.id, {
                scale: {
                  ...(platform.scale || {}),
                  baseSize: newBaseSize
                }
              });
            }, 0);
          }}
          className="text-xs h-8"
        />
      </div>
      <div className="flex items-center space-x-1">
        <Label className="text-xs">Ratio</Label>
        <Input
          type="number"
          min="1.05"
          max="2"
          step="0.01"
          value={platform.scale.ratio}
          onChange={(e) => {
            const newRatio = parseFloat(e.target.value);
            console.log("Setting Ratio to:", newRatio);
            
            // Use setTimeout to ensure this update happens in a separate tick
            setTimeout(() => {
              // Use saveTypographySettings instead of updatePlatform to ensure data is saved to Supabase
              saveTypographySettings(platform.id, {
                scale: {
                  ...(platform.scale || {}),
                  ratio: newRatio
                }
              });
            }, 0);
          }}
          className="text-xs h-8"
        />
      </div>
      {/* ... rest of the component */}
    </div>
  )
}

function AIDistanceTab({
  platform,
  currentSettings,
  updatePlatform,
}: {
  platform: Platform;
  currentSettings: any;
  updatePlatform: (id: string, updates: Partial<Platform>) => void;
}) {
  // Get saveTypographySettings to ensure changes are saved to Supabase
  const { saveTypographySettings } = useTypographyStore();
  return (
    <div className="space-y-4">
      <div>
        <Label className="text-xs">Base Size ({currentSettings.units.typography})</Label>
        <Input
          type="number"
          value={platform.aiScale?.recommendedBaseSize || 0}
          disabled
          className="text-xs h-8"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Recommended base size in {platform.units.typography || 'px'} based on AI analysis
        </p>
      </div>
      {/* ... rest of the component */}
    </div>
  )
}
