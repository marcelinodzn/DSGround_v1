import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTypographyStore, ScaleMethod, Platform, TypeStyle } from "@/store/typography"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown, GripVertical, Trash2, Copy } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

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
}

function SortableTypeStyle({ style: typeStyle, ...props }: SortableTypeStyleProps) {
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
                  onValueChange={(value) => props.handleTypeStyleChange(typeStyle.id, { scaleStep: value })}
                >
                  <SelectTrigger className="text-xs h-8 ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2">
                    <SelectValue placeholder="Scale" />
                  </SelectTrigger>
                  <SelectContent>
                    {props.getScaleValues().map((scale) => (
                      <SelectItem key={scale.label} value={scale.label}>
                        {scale.label}
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
  const { 
    currentPlatform,
    platforms,
    setCurrentPlatform,
    updatePlatform,
    copyTypeStylesToAllPlatforms
  } = useTypographyStore()

  const currentSettings = platforms.find(p => p.id === currentPlatform)!

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
    updatePlatform(currentPlatform, {
      typeStyles: currentSettings.typeStyles?.map((style) =>
        style.id === id ? { ...style, ...updates } : style
      )
    })
  }

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

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
                  <div className="mt-2 text-xs">Modular</div>
                </Label>
              </div>
              <div>
                <RadioGroupItem value="distance" id="distance" className="peer sr-only" />
                <Label
                  htmlFor="distance"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-transparent p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><circle cx="7" cy="17" r="1"/><circle cx="17" cy="7" r="1"/><path d="M8 17 17 8"/></svg>
                  <div className="mt-2 text-xs">Distance</div>
                </Label>
              </div>
              <div>
                <RadioGroupItem value="ai" id="ai" className="peer sr-only" />
                <Label
                  htmlFor="ai"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-transparent p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20"/><path d="M2 12h20"/><path d="m12 2 4 4"/><path d="m12 2-4 4"/><path d="m12 22 4-4"/><path d="m12 22-4-4"/><path d="m2 12 4 4"/><path d="m2 12 4-4"/><path d="m22 12-4 4"/><path d="m22 12-4-4"/></svg>
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
                  <Label className="text-xs">Base Size</Label>
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
                  <Label className="text-xs">Viewing Distance (cm)</Label>
                  <Input
                    type="number"
                    value={currentSettings.distanceScale.viewingDistance}
                    onChange={(e) => {
                      handleDistanceScaleChange({
                        viewingDistance: parseFloat(e.target.value),
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
                  <Tabs 
                    value={currentSettings.distanceScale.textType}
                    onValueChange={(value) => 
                      handleDistanceScaleChange({ textType: value as 'continuous' | 'isolated' })
                    }
                  >
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="continuous">Continuous</TabsTrigger>
                      <TabsTrigger value="isolated">Isolated</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

                <div>
                  <Label className="text-xs mb-2">Lighting Conditions</Label>
                  <Tabs 
                    value={currentSettings.distanceScale.lighting}
                    onValueChange={(value) => 
                      handleDistanceScaleChange({ lighting: value as 'good' | 'moderate' | 'poor' })
                    }
                  >
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="good">Good</TabsTrigger>
                      <TabsTrigger value="moderate">Moderate</TabsTrigger>
                      <TabsTrigger value="poor">Poor</TabsTrigger>
                    </TabsList>
                  </Tabs>
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
                <div>
                  <Label className="text-xs">Content Type</Label>
                  <Select
                    value={currentSettings.distanceScale.textType}
                    onValueChange={(value) => {
                      handleDistanceScaleChange({ textType: value as 'continuous' | 'isolated' })
                    }}
                  >
                    <SelectTrigger className="text-xs h-8 ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2">
                      <SelectValue placeholder="Select content type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="article" className="text-xs">Article</SelectItem>
                      <SelectItem value="marketing" className="text-xs">Marketing</SelectItem>
                      <SelectItem value="documentation" className="text-xs">Documentation</SelectItem>
                      <SelectItem value="dashboard" className="text-xs">Dashboard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Brand Personality</Label>
                  <Select defaultValue="professional">
                    <SelectTrigger className="text-xs h-8 ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2">
                      <SelectValue placeholder="Select brand personality" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional" className="text-xs">Professional</SelectItem>
                      <SelectItem value="friendly" className="text-xs">Friendly</SelectItem>
                      <SelectItem value="bold" className="text-xs">Bold</SelectItem>
                      <SelectItem value="minimal" className="text-xs">Minimal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button className="w-full text-xs">Generate Scale</Button>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>

      <Collapsible>
        <CollapsibleTrigger className="flex w-full items-center justify-between px-4 py-4 text-sm font-semibold border-t group">
          <span>Type Styles</span>
          <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180" />
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
                    <SortableTypeStyle key={style.id} style={style} handleTypeStyleChange={handleTypeStyleChange} handleDeleteTypeStyle={handleDeleteTypeStyle} handleDuplicateStyle={handleDuplicateStyle} getScaleValues={getScaleValues} />
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
