import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTypographyStore, ScaleMethod, Platform, TypeStyle } from "@/store/typography"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown, GripVertical, Trash2, Copy, Upload, X, Codesandbox, ScanEye, LineChart } from "lucide-react"
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
                  <SelectTrigger className="text-xs h-8">
                    <SelectValue>
                      {typeStyle.scaleStep}
                    </SelectValue>
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
                <Input
                  type="number"
                  min="0.5"
                  max="3"
                  step="0.1"
                  value={typeStyle.lineHeight}
                  onChange={(e) => props.handleTypeStyleChange(typeStyle.id, { 
                    lineHeight: parseFloat(e.target.value) 
                  })}
                  className="text-xs h-8"
                />
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
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function PropertiesPanel() {
  const platforms = usePlatformStore((state) => state.platforms)
  const {
    currentPlatform,
    setCurrentPlatform,
    updatePlatform,
    copyTypeStylesToAllPlatforms,
    platforms: typographyPlatforms,
    initializePlatform
  } = useTypographyStore()
  const { platforms: platformSettings } = usePlatformStore()

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
  const [activeViewTab, setActiveViewTab] = useState('scale')
  const [activeAnalysisTab, setActiveAnalysisTab] = useState('platform')
  const [customRequirements, setCustomRequirements] = useState('')

  // Effect hooks
  useEffect(() => {
    if (platforms.length > 0) {
      // Initialize typography settings for each platform if needed
      platforms.forEach(platform => {
        if (!typographyPlatforms.find(p => p.id === platform.id)) {
          initializePlatform(platform.id)
        }
      })
      
      // Set current platform if none selected
      if (!currentPlatform && platforms[0]) {
        setCurrentPlatform(platforms[0].id)
      }
    }
  }, [platforms, typographyPlatforms, currentPlatform, initializePlatform, setCurrentPlatform])

  // Find current settings
  const currentSettings = typographyPlatforms.find(p => p.id === currentPlatform)
  const currentPlatformSettings = platformSettings.find(p => p.id === currentPlatform)
  
  if (!currentSettings) {
    return null
  }

  // Constants
  const viewTabs = [
    { id: 'scale', label: 'Scale View' },
    { id: 'styles', label: 'Styles View' }
  ]

  const analysisTabs = [
    { id: 'platform', label: 'Platform Analysis' },
    { id: 'image', label: 'Image Analysis' }
  ]

  // Event handlers
  const handleScaleMethodChange = (method: ScaleMethod) => {
    updatePlatform(currentPlatform, { scaleMethod: method })
  }

  const handleScaleChange = (ratio: number, baseSize: number) => {
    updatePlatform(currentPlatform, {
      scale: { 
        ...currentSettings.scale,
        ratio,
        baseSize
      }
    })
  }

  const handleDistanceScaleChange = (updates: Partial<Platform['distanceScale']>) => {
    updatePlatform(currentPlatform, {
      distanceScale: { ...currentSettings.distanceScale, ...updates }
    })
  }

  const handleAccessibilityChange = (updates: Partial<Platform['accessibility']>) => {
    updatePlatform(currentPlatform, {
      accessibility: { ...currentSettings.accessibility, ...updates }
    })
  }

  const handleTypeStyleChange = (id: string, updates: Partial<TypeStyle>) => {
    if (!currentPlatform || !currentSettings) return;

    // Create a new array of type styles
    const updatedTypeStyles = currentSettings.typeStyles.map(style => {
      if (style.id === id) {
        // If we're updating the scale step
        if ('scaleStep' in updates) {
          const scaleValues = getScaleValues();
          const scaleValue = scaleValues.find(s => s.label === updates.scaleStep);
          
          if (scaleValue) {
            return {
              ...style,
              scaleStep: updates.scaleStep,
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

    // Update the platform with all changes
    updatePlatform(currentPlatform, {
      typeStyles: updatedTypeStyles
    });
  };

  const getScaleValues = () => {
    return useTypographyStore.getState().getScaleValues(currentPlatform)
  }

  const handleAddTypeStyle = () => {
    const newStyle: TypeStyle = {
      id: crypto.randomUUID(),
      name: 'New Style',
      scaleStep: 'f0',
      fontWeight: 400,
      lineHeight: 1.5,
      opticalSize: 16,
      letterSpacing: 0
    }
    
    updatePlatform(currentPlatform, {
      typeStyles: [...(currentSettings.typeStyles || []), newStyle]
    })
  }

  const handleDeleteTypeStyle = (id: string) => {
    updatePlatform(currentPlatform, {
      typeStyles: currentSettings.typeStyles.filter(style => style.id !== id)
    })
  }

  const handleDuplicateStyle = (style: TypeStyle) => {
    const newStyle: TypeStyle = {
      ...style,
      id: crypto.randomUUID(),
      name: `${style.name} (Copy)`
    }
    
    updatePlatform(currentPlatform, {
      typeStyles: [...(currentSettings.typeStyles || []), newStyle]
    })
  }

  const handleDragEnd = (event: {
    active: { id: string };
    over: { id: string } | null;
  }) => {
    if (!event.over) return;
    
    const { active, over } = event;
    
    if (active.id !== over.id) {
      const oldIndex = currentSettings.typeStyles.findIndex(style => style.id === active.id);
      const newIndex = currentSettings.typeStyles.findIndex(style => style.id === over.id);
      
      const newTypeStyles = [...currentSettings.typeStyles];
      const [movedItem] = newTypeStyles.splice(oldIndex, 1);
      newTypeStyles.splice(newIndex, 0, movedItem);
      
      updatePlatform(currentPlatform, {
        typeStyles: newTypeStyles
      });
    }
  };

  const handleCopyStylesToAllPlatforms = () => {
    const currentStyles = currentSettings.typeStyles;
    if (currentStyles) {
      copyTypeStylesToAllPlatforms(currentStyles);
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

      const recommendedSizeInPx = parseAIRecommendation(response.recommendation);
      const convertedSize = convertUnits(
        recommendedSizeInPx,
        'px',
        currentPlatformSettings?.units.typography || 'px',
        currentSettings.scale.baseSize
      );

      // Update both aiScale and scale settings
      updatePlatform(currentPlatform, {
        aiScale: {
          recommendedBaseSize: convertedSize,
          originalSizeInPx: recommendedSizeInPx,
          recommendations: response.recommendation
        },
        scale: {
          ...currentSettings.scale,
          baseSize: convertedSize
        }
      });

      setPlatformReasoning(response.reasoning);
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
    try {
      setAiError(null)
      setIsAnalyzing(true)
      setProgress(0)
      setPlatformReasoning(null)
      
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90))
      }, 500)

      // Call Gemini directly
      const recommendation = await generateTypeScale({
        deviceType: platforms.find(p => p.id === currentPlatform)?.name,
        context: selectedContext,
        location: selectedLocation,
        image: base64Image
      })

      clearInterval(progressInterval)
      setProgress(100)

      if (!recommendation) {
        throw new Error('No recommendation received from AI')
      }

      const params = parseAIRecommendation(recommendation)

      // Format the analysis text
      const analysisText = `Scale Parameters:
Base size: ${params.baseSize}px
Ratio: ${params.ratio}
Steps up: ${params.stepsUp}
Steps down: ${params.stepsDown}

${recommendation}`

      setImageAnalysis(analysisText)
      setPlatformReasoning(analysisText)

      updatePlatform(currentPlatform, {
        scale: {
          ...params
        }
      })
    } catch (error) {
      console.error('Error in handleGenerateFromImage:', error)
      setAiError(error instanceof Error ? error.message : 'Failed to analyze image')
    } finally {
      setIsAnalyzing(false)
      setTimeout(() => setProgress(0), 500)
    }
  }

  return (
    <div className="h-full">
      <div className="px-4 py-4">
        <Label className="text-xs mb-2 block">Platform</Label>
        <Select
          value={currentPlatform}
          onValueChange={setCurrentPlatform}
        >
          <SelectTrigger className="text-xs h-8 ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2 [&>svg:last-child]:hidden">
            <SelectValue placeholder="Select platform" />
          </SelectTrigger>
          <SelectContent>
            {platforms.map((platform) => (
              <SelectItem
                key={platform.id}
                value={platform.id}
                className="text-xs"
              >
                {platform.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="mt-[11.9px]">
        <Separator className="mb-4" />
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
              onValueChange={(value) => handleScaleMethodChange(value as ScaleMethod)}
              className="grid grid-cols-3 gap-4"
            >
              <div>
                <RadioGroupItem value="modular" id="modular" className="peer sr-only" />
                <Label
                  htmlFor="modular"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-transparent p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                  <LineChart className="h-6 w-6" />
                  <div className="mt-2 text-xs">Modular</div>
                </Label>
              </div>
              <div>
                <RadioGroupItem value="distance" id="distance" className="peer sr-only" />
                <Label
                  htmlFor="distance"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-transparent p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                  <ScanEye className="h-6 w-6" />
                  <div className="mt-2 text-xs">Distance</div>
                </Label>
              </div>
              <div>
                <RadioGroupItem value="ai" id="ai" className="peer sr-only" />
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
                    value={currentSettings.scale.ratio.toString()}
                    onValueChange={(value) => {
                      handleScaleChange(parseFloat(value), currentSettings.scale.baseSize)
                    }}
                  >
                    <SelectTrigger className="text-xs h-8 ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2">
                      <SelectValue placeholder="Select scale type" />
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
                    value={currentSettings.scale.baseSize}
                    onChange={(e) => {
                      handleScaleChange(currentSettings.scale.ratio, parseFloat(e.target.value))
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
                        updatePlatform(currentPlatform, {
                          scale: {
                            ...currentSettings.scale,
                            stepsUp: parseInt(e.target.value)
                          }
                        })
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
                        updatePlatform(currentPlatform, {
                          scale: {
                            ...currentSettings.scale,
                            stepsDown: parseInt(e.target.value)
                          }
                        })
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
                  <Label className="text-xs">
                    Base Size ({currentPlatformSettings?.units.typography || 'px'})
                  </Label>
                  <Input
                    type="number"
                    value={currentSettings.distanceScale?.calculatedBaseSize || 0}
                    disabled
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
                        updatePlatform(currentPlatform, {
                          scale: {
                            ...currentSettings.scale,
                            stepsUp: parseInt(e.target.value)
                          }
                        })
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
                        updatePlatform(currentPlatform, {
                          scale: {
                            ...currentSettings.scale,
                            stepsDown: parseInt(e.target.value)
                          }
                        })
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
                  defaultTab="platform"
                  onChange={(value) => {
                    setActiveAnalysisTab(value);
                    setAiError(null);
                    setPlatformReasoning(null);
                    setImageAnalysis(null);
                    setProgress(0);
                    if (value === 'platform') {
                      setSelectedImage(null);
                    }
                  }}
                  layoutId="analysis-method-tabs"
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
                          <SelectTrigger className="text-xs h-8">
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
                          <SelectTrigger className="text-xs h-8">
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
                                    updatePlatform(currentPlatform, {
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
                                        ...currentSettings.scale,
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
                                    updatePlatform(currentPlatform, {
                                      scale: {
                                        ...currentSettings.scale,
                                        ratio: parseFloat(value)
                                      }
                                    });
                                  }}
                                >
                                  <SelectTrigger className="text-xs h-8">
                                    <SelectValue placeholder="Select scale type" />
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
                                      updatePlatform(currentPlatform, {
                                        scale: {
                                          ...currentSettings.scale,
                                          stepsUp: parseInt(e.target.value)
                                        }
                                      });
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
                                      updatePlatform(currentPlatform, {
                                        scale: {
                                          ...currentSettings.scale,
                                          stepsDown: parseInt(e.target.value)
                                        }
                                      });
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
                            <h4 className="text-xs font-medium mb-2">Image Analysis Results</h4>
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
                                    updatePlatform(currentPlatform, {
                                      scale: {
                                        ...currentSettings.scale,
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
                                    updatePlatform(currentPlatform, {
                                      scale: {
                                        ...currentSettings.scale,
                                        ratio: parseFloat(value)
                                      }
                                    })
                                  }}
                                >
                                  <SelectTrigger className="text-xs h-8">
                                    <SelectValue placeholder="Select scale type" />
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
                                      updatePlatform(currentPlatform, {
                                        scale: {
                                          ...currentSettings.scale,
                                          stepsUp: parseInt(e.target.value)
                                        }
                                      })
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
                                      updatePlatform(currentPlatform, {
                                        scale: {
                                          ...currentSettings.scale,
                                          stepsDown: parseInt(e.target.value)
                                        }
                                      })
                                    }}
                                    className="text-xs h-8"
                                  />
                                </div>
                              </div>
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
                items={currentSettings.typeStyles.map(style => style.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {currentSettings.typeStyles?.map((style) => (
                    <SortableTypeStyle 
                      key={style.id} 
                      style={style} 
                      handleTypeStyleChange={handleTypeStyleChange} 
                      handleDeleteTypeStyle={handleDeleteTypeStyle} 
                      handleDuplicateStyle={handleDuplicateStyle} 
                      getScaleValues={getScaleValues}
                      typographyUnit={currentSettings.units.typography}
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
                value={currentSettings.accessibility.minContrastBody}
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
                value={currentSettings.accessibility.minContrastLarge}
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
  // ... existing code

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Type Scale ({platform.units.typography})</h3>
        {/* ... rest of the component */}
      </div>
      {/* ... rest of the component */}
    </div>
  )
}

function ModularScaleTab({ platform, currentSettings }: { platform: Platform; currentSettings: any }) {
  return (
    <div className="space-y-4">
      <div>
        <Label className="text-xs">Base Size ({currentSettings.units.typography})</Label>
        <Input
          type="number"
          value={platform.scale.baseSize}
          onChange={(e) => {
            handleScaleChange({
              baseSize: Number(e.target.value)
            })
          }}
          className="text-xs h-8"
        />
      </div>
      {/* ... rest of the component */}
    </div>
  )
}

function DistanceBasedTab({ platform, currentSettings }: { platform: Platform; currentSettings: any }) {
  return (
    <div className="space-y-4">
      <div>
        <Label className="text-xs">Base Size ({currentSettings.units.typography})</Label>
        <Input
          type="number"
          value={platform.distanceScale?.calculatedBaseSize || 0}
          disabled
          className="text-xs h-8"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Base size calculated from distance parameters
        </p>
      </div>
      {/* ... rest of the component */}
    </div>
  )
}

function AIDistanceTab({ platform, currentSettings }: { platform: Platform; currentSettings: any }) {
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
          Recommended base size in {currentPlatformSettings?.units.typography || 'px'} based on AI analysis
        </p>
      </div>
      {/* ... rest of the component */}
    </div>
  )
}
