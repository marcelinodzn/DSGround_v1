'use client'

import { useState, useEffect, useRef } from 'react'
import { useColorStore, ColorPalette, ColorStep, ColorFormat } from '@/store/color-store'
import { useBrandStore } from '@/store/brand-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, ChevronDown, Copy, Settings, Palette, Sliders, Lock, Unlock, Info, BarChart } from 'lucide-react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { convertToAllFormats } from '@/lib/color-utils'

export function ColorPropertiesPanel() {
  const { 
    palettes, 
    currentPaletteId, 
    setCurrentPalette, 
    createPalette, 
    generatePalette,
    paletteConfig,
    updatePaletteConfig,
    updatePalette
  } = useColorStore()
  const { currentBrand } = useBrandStore()
  
  const [newPaletteName, setNewPaletteName] = useState('')
  const [selectedFormat, setSelectedFormat] = useState<ColorFormat>('hex')
  const [colorModel, setColorModel] = useState<'oklch' | 'hsl'>('oklch')
  const [baseColor, setBaseColor] = useState('#3264C8')
  const [isCore, setIsCore] = useState(true)
  const [lockBaseColor, setLockBaseColor] = useState(true)
  const [activeTab, setActiveTab] = useState('distribution')
  const [customLightnessValues, setCustomLightnessValues] = useState<number[]>([])
  
  // Get the currently selected palette
  const currentPalette = palettes.find(p => p.id === currentPaletteId)

  // When current palette changes, update the base color and other settings
  useEffect(() => {
    if (currentPalette) {
      setBaseColor(currentPalette.baseColor.hex);
      // Update other settings based on the selected palette
      updatePaletteConfig({
        numSteps: currentPalette.steps.length,
        lightnessRange: currentPalette.config?.lightnessRange || [0, 1],
        chromaRange: currentPalette.config?.chromaRange || [0.01, 0.4],
        hueShift: currentPalette.config?.hueShift || 0
      });
    }
  }, [currentPaletteId]);

  // Handle color model change
  const handleColorModelChange = (model: 'oklch' | 'hsl') => {
    setColorModel(model);
    // Update the store with appropriate default values for the selected color model
    if (model === 'hsl') {
      updatePaletteConfig({
        chromaRange: [0, 1], // Saturation ranges from 0-100%
      });
    } else if (model === 'oklch') {
      updatePaletteConfig({
        chromaRange: [0.01, 0.4], // Chroma in OKLCH typically ranges from 0-0.4
      });
    }
  };

  // Handle base color change
  const handleBaseColorChange = async (newColor: string) => {
    if (!currentPalette) return;
    
    try {
      setBaseColor(newColor);
      
      // Convert to all formats
      const colorValues = convertToAllFormats(newColor);
      
      // Update the base color in the palette only if it's not locked
      if (!lockBaseColor) {
        await updatePalette(currentPalette.id, {
          baseColor: colorValues
        });
        
        // Regenerate the palette with the new base color
        const paletteOptions = {
          lightnessPreset: paletteConfig.lightnessPreset,
          chromaPreset: paletteConfig.chromaPreset,
          lightnessRange: paletteConfig.lightnessRange,
          chromaRange: paletteConfig.chromaRange,
          hueShift: paletteConfig.hueShift,
          lockBaseColor: lockBaseColor
        };
        
        const generatedSteps = generatePalette(
          colorValues, 
          paletteConfig.numSteps
        );
        
        // Update the steps in the palette
        await updatePalette(currentPalette.id, {
          steps: generatedSteps
        });
      }
    } catch (error) {
      console.error('Error updating base color:', error);
    }
  };

  const handleCreatePalette = async (isCore: boolean) => {
    if (!currentBrand || !newPaletteName) return
    
    try {
      // Use the selected base color
      const baseColorObj = convertToAllFormats(baseColor);
      
      // Create palette generation options based on user selections
      const paletteOptions = {
        lightnessPreset: paletteConfig.lightnessPreset,
        chromaPreset: paletteConfig.chromaPreset,
        lightnessRange: paletteConfig.lightnessRange,
        chromaRange: paletteConfig.chromaRange,
        hueShift: paletteConfig.hueShift
      };
      
      // Generate steps for the palette using the selected parameters and options
      const generatedSteps = generatePalette(baseColorObj, paletteConfig.numSteps, paletteConfig.useLightness, paletteOptions);
      
      // Create the palette in the store (which syncs to Supabase)
      const newPalette = await createPalette(currentBrand.id, {
        name: newPaletteName,
        description: `${newPaletteName} color palette`,
        baseColor: baseColorObj,
        steps: generatedSteps,
        isCore
      })
      
      setNewPaletteName('');
      
      if (newPalette) {
        setCurrentPalette(newPalette.id);
        // Force an update of the preview
        setTimeout(() => {
          const event = new Event('paletteCreated');
          window.dispatchEvent(event);
        }, 100);
      }
    } catch (error) {
      console.error('Error creating palette:', error);
    }
  }

  // Update palettes when config changes
  useEffect(() => {
    const updatePalettes = async () => {
      if (!currentBrand) return;
      
      try {
        // Get all palettes for the current brand
        const brandPalettes = palettes.filter(p => p.brandId === currentBrand.id);
        
        if (brandPalettes.length === 0) return;
        
        // Update each palette
        for (const palette of brandPalettes) {
          // Generate steps for the palette
          const generatedSteps = generatePalette(
            palette.baseColor, 
            paletteConfig.numSteps
          );
          
          // Update the palette in the store
          await updatePalette(palette.id, {
            steps: generatedSteps
          });
        }
      } catch (error) {
        console.error('Error updating palettes:', error);
      }
    };

    // Debounce the update to prevent too many rapid changes
    const timeoutId = setTimeout(() => {
      updatePalettes();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [
    paletteConfig.numSteps,
    paletteConfig.lightnessRange,
    paletteConfig.chromaRange,
    paletteConfig.hueShift,
    currentBrand?.id,
    lockBaseColor
  ]);

  // Generate default custom lightness values when number of steps changes
  useEffect(() => {
    if (paletteConfig.lightnessPreset === 'custom') {
      const newValues = Array(paletteConfig.numSteps).fill(0).map((_, i) => {
        const percent = i / (paletteConfig.numSteps - 1);
        return paletteConfig.lightnessRange[0] + percent * (paletteConfig.lightnessRange[1] - paletteConfig.lightnessRange[0]);
      });
      setCustomLightnessValues(newValues);
    }
  }, [paletteConfig.numSteps, paletteConfig.lightnessPreset, paletteConfig.lightnessRange]);

  // Update custom lightness value at a specific index
  const updateCustomLightnessValue = (index: number, value: number) => {
    const newValues = [...customLightnessValues];
    if (newValues.length !== paletteConfig.numSteps) {
      // Initialize with current distribution if needed
      const defaultValues = Array(paletteConfig.numSteps).fill(0).map((_, i) => {
        const percent = i / (paletteConfig.numSteps - 1);
        return paletteConfig.lightnessRange[0] + percent * (paletteConfig.lightnessRange[1] - paletteConfig.lightnessRange[0]);
      });
      newValues.splice(0, newValues.length, ...defaultValues);
    }
    
    newValues[index] = value;
    setCustomLightnessValues(newValues);
    
    // Update the store
    updatePaletteConfig({
      lightnessPreset: 'custom',
      customLightnessValues: newValues
    });
  };

  return (
    <div className="space-y-0 border rounded-md">
      {/* First Dropdown: Basic Settings */}
      <Collapsible defaultOpen>
        <CollapsibleTrigger className="flex w-full items-center justify-between px-4 py-4 text-sm font-semibold group">
          <div className="flex items-center">
            <Palette className="h-4 w-4 mr-2" />
            <span>Basic Settings</span>
          </div>
          <ChevronDown 
            className="h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180" 
            aria-hidden="true"
          />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-4 py-4 space-y-4">
            {/* Color Model Selection */}
            <div className="space-y-2">
              <Label>Color Model</Label>
              <div className="flex gap-2">
                <Button 
                  variant={colorModel === 'oklch' ? 'default' : 'outline'} 
                  className="flex-1" 
                  onClick={() => handleColorModelChange('oklch')}
                >
                  OKLCH
                </Button>
                <Button 
                  variant={colorModel === 'hsl' ? 'default' : 'outline'} 
                  className="flex-1" 
                  onClick={() => handleColorModelChange('hsl')}
                >
                  HSL
                </Button>
              </div>
            </div>

            {/* Base Color */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="base-color">Base Color</Label>
                <div className="flex items-center gap-2">
                  <Label htmlFor="lock-base-color" className="text-xs">Lock Base</Label>
                  <button 
                    type="button" 
                    onClick={() => {
                      const newLockState = !lockBaseColor;
                      setLockBaseColor(newLockState);
                      // If unlocking, update the base color to match the current palette
                      if (!newLockState && currentPalette) {
                        handleBaseColorChange(currentPalette.baseColor.hex);
                      }
                    }}
                    className="h-6 w-6 flex items-center justify-center text-muted-foreground"
                  >
                    {lockBaseColor ? (
                      <Lock className="h-4 w-4" />
                    ) : (
                      <Unlock className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
              <div className="flex gap-2">
                <input 
                  type="color" 
                  id="base-color"
                  value={baseColor}
                  onChange={(e) => handleBaseColorChange(e.target.value)}
                  className="w-10 h-10 rounded-md cursor-pointer"
                  disabled={lockBaseColor}
                />
                <Input 
                  value={baseColor}
                  onChange={(e) => handleBaseColorChange(e.target.value)}
                  className="flex-1"
                  disabled={lockBaseColor}
                />
              </div>
            </div>
            
            {/* Number of Shades */}
            <div className="space-y-2">
              <Label htmlFor="num-steps">Number of Shades</Label>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => updatePaletteConfig({ numSteps: Math.max(3, paletteConfig.numSteps - 1) })}
                >
                  <span className="text-lg">−</span>
                </Button>
                <Input 
                  id="num-steps"
                  type="number" 
                  min={3} 
                  max={25}
                  value={paletteConfig.numSteps} 
                  onChange={(e) => updatePaletteConfig({ numSteps: parseInt(e.target.value) || 9 })}
                  className="text-center"
                />
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => updatePaletteConfig({ numSteps: Math.min(25, paletteConfig.numSteps + 1) })}
                >
                  <span className="text-lg">+</span>
                </Button>
              </div>
            </div>
            
            {/* Create New Palette */}
            <div className="space-y-4 pt-4 border-t">
              <div className="space-y-2">
                <Label htmlFor="new-palette-name">New Palette Name</Label>
                <Input
                  id="new-palette-name"
                  value={newPaletteName}
                  onChange={(e) => setNewPaletteName(e.target.value)}
                  placeholder="Enter palette name"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Palette Type</Label>
                <div className="flex gap-2">
                  <Button 
                    variant={isCore ? 'default' : 'outline'} 
                    className="flex-1" 
                    onClick={() => setIsCore(true)}
                  >
                    Core
                  </Button>
                  <Button 
                    variant={!isCore ? 'default' : 'outline'} 
                    className="flex-1" 
                    onClick={() => setIsCore(false)}
                  >
                    Accent
                  </Button>
                </div>
              </div>
              
              <Button 
                className="w-full" 
                onClick={() => handleCreatePalette(isCore)}
                disabled={!newPaletteName || !currentBrand}
              >
                Create Palette
              </Button>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
      
      {/* Second Dropdown: Shade Generator */}
      <Collapsible>
        <CollapsibleTrigger className="flex w-full items-center justify-between px-4 py-4 text-sm font-semibold border-t group">
          <div className="flex items-center">
            <Sliders className="h-4 w-4 mr-2" />
            <span>Shade Generator</span>
          </div>
          <ChevronDown 
            className="h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180" 
            aria-hidden="true"
          />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-4 py-4">
            <Tabs defaultValue="colorSettings" className="w-full">
              <TabsList className="grid grid-cols-3 mb-4">
                <TabsTrigger value="colorSettings">Color Settings</TabsTrigger>
                <TabsTrigger value="lightnessSteps">Lightness Steps</TabsTrigger>
                <TabsTrigger value="chromaSettings">Chroma & Hue</TabsTrigger>
              </TabsList>
              
              {/* Shade Generator Tab */}
              <TabsContent value="colorSettings" className="space-y-4 pt-2">
                <div className="space-y-4">
                  {/* Lightness Range */}
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>Lightness Range</Label>
                      <span className="text-xs text-muted-foreground">
                        {Math.round(paletteConfig.lightnessRange[0] * 100)}% - {Math.round(paletteConfig.lightnessRange[1] * 100)}%
                      </span>
                    </div>
                    <Slider 
                      value={[paletteConfig.lightnessRange[0] * 100, paletteConfig.lightnessRange[1] * 100]} 
                      min={0} 
                      max={100} 
                      step={1} 
                      onValueChange={([min, max]) => updatePaletteConfig({ 
                        lightnessRange: [min / 100, max / 100] 
                      })}
                    />
                    <div className="text-xs text-muted-foreground">
                      Defines how light or dark the colors in your scale will be
                    </div>
                  </div>

                  {/* Saturation/Chroma Control */}
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>{colorModel === 'oklch' ? 'Chroma' : 'Saturation'} Range</Label>
                      <span className="text-xs text-muted-foreground">
                        {(paletteConfig.chromaRange[0] * (colorModel === 'oklch' ? 100 : 100)).toFixed(0)}% - 
                        {(paletteConfig.chromaRange[1] * (colorModel === 'oklch' ? 100 : 100)).toFixed(0)}%
                      </span>
                    </div>
                    <Slider 
                      value={[
                        paletteConfig.chromaRange[0] * (colorModel === 'oklch' ? 100 : 100), 
                        paletteConfig.chromaRange[1] * (colorModel === 'oklch' ? 100 : 100)
                      ]} 
                      min={0} 
                      max={colorModel === 'oklch' ? 40 : 100} 
                      step={1} 
                      onValueChange={([min, max]) => updatePaletteConfig({ 
                        chromaRange: [
                          min / (colorModel === 'oklch' ? 100 : 100), 
                          max / (colorModel === 'oklch' ? 100 : 100)
                        ] 
                      })}
                    />
                    <div className="text-xs text-muted-foreground">
                      Controls the intensity of colors across the scale
                    </div>
                  </div>
                  
                  {/* Hue Shift */}
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>Hue Shift</Label>
                      <span className="text-xs text-muted-foreground">
                        {paletteConfig.hueShift}°
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs whitespace-nowrap">-180°</span>
                      <Slider 
                        value={[paletteConfig.hueShift + 180]} 
                        min={0} 
                        max={360} 
                        step={1} 
                        onValueChange={([value]) => updatePaletteConfig({ hueShift: value - 180 })}
                        className="flex-1"
                      />
                      <span className="text-xs whitespace-nowrap">+180°</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Adjusts how the hue changes across the scale
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Lightness Steps Tab */}
              <TabsContent value="lightnessSteps" className="space-y-4 pt-2">
                <div className="space-y-4">
                  {/* Show control for each step */}
                  {Array(paletteConfig.numSteps).fill(0).map((_, index) => {
                    const defaultValue = (() => {
                      const percent = index / (paletteConfig.numSteps - 1);
                      return paletteConfig.lightnessRange[0] + percent * (paletteConfig.lightnessRange[1] - paletteConfig.lightnessRange[0]);
                    })();
                    
                    const value = customLightnessValues[index] !== undefined 
                      ? customLightnessValues[index] 
                      : defaultValue;
                    
                    const isBaseStep = index === Math.floor(paletteConfig.numSteps / 2);
                    
                    return (
                      <div key={index} className={cn(
                        "space-y-1",
                        isBaseStep && "border-l-4 border-primary pl-2 -ml-3"
                      )}>
                        <div className="flex justify-between items-center">
                          <Label className="flex items-center gap-1">
                            Step {(index + 1) * 100}
                            {isBaseStep && (
                              <span className="text-xs bg-primary text-primary-foreground px-1 rounded">Base</span>
                            )}
                          </Label>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              min={0}
                              max={100}
                              step={0.5}
                              value={Math.round(value * 100)}
                              onChange={(e) => {
                                const newValue = parseInt(e.target.value) / 100;
                                updateCustomLightnessValue(index, Math.max(0, Math.min(1, newValue)));
                              }}
                              className="w-16 text-xs text-right"
                            />
                            <span className="text-xs text-muted-foreground">%</span>
                          </div>
                        </div>
                        <Slider
                          value={[value * 100]}
                          min={0}
                          max={100}
                          step={0.5}
                          onValueChange={([newValue]) => {
                            updateCustomLightnessValue(index, newValue / 100);
                          }}
                        />
                      </div>
                    );
                  })}
                  
                  {/* Quick presets */}
                  <div className="pt-4 border-t">
                    <Label className="mb-2 block">Distribution Presets</Label>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newValues = Array(paletteConfig.numSteps).fill(0).map((_, i) => {
                            const percent = i / (paletteConfig.numSteps - 1);
                            return paletteConfig.lightnessRange[0] + percent * (paletteConfig.lightnessRange[1] - paletteConfig.lightnessRange[0]);
                          });
                          setCustomLightnessValues(newValues);
                          updatePaletteConfig({
                            lightnessPreset: 'custom',
                            customLightnessValues: newValues
                          });
                        }}
                      >
                        Linear
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newValues = Array(paletteConfig.numSteps).fill(0).map((_, i) => {
                            const t = i / (paletteConfig.numSteps - 1);
                            const easedT = 1 - Math.pow(1 - t, 3);
                            return paletteConfig.lightnessRange[0] + easedT * (paletteConfig.lightnessRange[1] - paletteConfig.lightnessRange[0]);
                          });
                          setCustomLightnessValues(newValues);
                          updatePaletteConfig({
                            lightnessPreset: 'custom',
                            customLightnessValues: newValues
                          });
                        }}
                      >
                        Ease Out
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newValues = Array(paletteConfig.numSteps).fill(0).map((_, i) => {
                            const t = i / (paletteConfig.numSteps - 1);
                            let easedT;
                            if (t < 0.5) {
                              easedT = 4 * t * t * t;
                            } else {
                              easedT = 1 - Math.pow(-2 * t + 2, 3) / 2;
                            }
                            return paletteConfig.lightnessRange[0] + easedT * (paletteConfig.lightnessRange[1] - paletteConfig.lightnessRange[0]);
                          });
                          setCustomLightnessValues(newValues);
                          updatePaletteConfig({
                            lightnessPreset: 'custom',
                            customLightnessValues: newValues
                          });
                        }}
                      >
                        S-Curve
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </CollapsibleContent>
      </Collapsible>
      
      {/* Third Dropdown: Color Visualization */}
      <Collapsible>
        <CollapsibleTrigger className="flex w-full items-center justify-between px-4 py-4 text-sm font-semibold border-t group">
          <div className="flex items-center">
            <BarChart className="h-4 w-4 mr-2" />
            <span>Color Visualization</span>
          </div>
          <ChevronDown 
            className="h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180" 
            aria-hidden="true"
          />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-4 py-4">
            <div className="border rounded-md p-4 space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-medium">Color Attribute Distribution</h4>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button className="text-muted-foreground">
                        <Info className="h-4 w-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>This graph shows how lightness (purple) and chroma (green) values change across your palette. 
                         The colored squares at the top show the actual colors in your palette.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              
              <div className="h-64 w-full">
                <ColorDistributionGraph 
                  numSteps={paletteConfig.numSteps}
                  lightnessValues={customLightnessValues.length === paletteConfig.numSteps 
                    ? customLightnessValues 
                    : Array(paletteConfig.numSteps).fill(0).map((_, i) => {
                        const t = i / (paletteConfig.numSteps - 1);
                        return paletteConfig.lightnessRange[0] + t * (paletteConfig.lightnessRange[1] - paletteConfig.lightnessRange[0]);
                      })
                  }
                  chromaValues={Array(paletteConfig.numSteps).fill(0).map((_, i) => {
                    const t = i / (paletteConfig.numSteps - 1);
                    const [minChroma, maxChroma] = paletteConfig.chromaRange;
                    return minChroma + t * (maxChroma - minChroma);
                  })}
                  baseColor={baseColor}
                  hueShift={paletteConfig.hueShift}
                />
              </div>
              
              <div className="flex items-center justify-center gap-8 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                  <span>Lightness</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span>Chroma</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3" style={{background: baseColor, borderRadius: '50%'}}></div>
                  <span>Base Color</span>
                </div>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}

// Color distribution graph component
function ColorDistributionGraph({ 
  numSteps, 
  lightnessValues, 
  chromaValues, 
  baseColor,
  hueShift
}: {
  numSteps: number,
  lightnessValues: number[],
  chromaValues: number[],
  baseColor: string,
  hueShift: number
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas dimensions
    canvas.width = canvas.offsetWidth * window.devicePixelRatio;
    canvas.height = canvas.offsetHeight * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Calculate dimensions
    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;
    const padding = 20;
    const graphWidth = width - (padding * 2);
    const graphHeight = height - (padding * 2);
    
    // Draw axis
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.strokeStyle = '#666';
    ctx.stroke();
    
    // Draw lightness line
    ctx.beginPath();
    lightnessValues.forEach((l, i) => {
      const x = padding + (i / (numSteps - 1)) * graphWidth;
      const y = height - padding - (l * graphHeight);
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
      
      // Draw point at each step
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = 'purple';
      ctx.fill();
      
      // Draw base color indicator with special highlight
      if (i === Math.floor(numSteps / 2)) {
        ctx.fillStyle = baseColor;
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    });
    ctx.strokeStyle = 'purple';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Draw chroma line
    ctx.beginPath();
    chromaValues.forEach((c, i) => {
      const x = padding + (i / (numSteps - 1)) * graphWidth;
      const y = height - padding - (c / 0.4 * graphHeight); // Normalize to max chroma 0.4
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
      
      // Draw point at each step
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = 'green';
      ctx.fill();
    });
    ctx.strokeStyle = 'green';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Draw Y-axis labels
    ctx.fillStyle = '#666';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('100%', padding - 5, padding);
    ctx.fillText('50%', padding - 5, height - padding - (graphHeight / 2));
    ctx.fillText('0%', padding - 5, height - padding);
    
    // Draw X-axis labels (shade numbers)
    ctx.textAlign = 'center';
    for (let i = 0; i < numSteps; i++) {
      const x = padding + (i / (numSteps - 1)) * graphWidth;
      ctx.fillText(`${(i + 1) * 100}`, x, height - padding + 15);
    }
    
  }, [numSteps, lightnessValues, chromaValues, baseColor, hueShift]);
  
  return (
    <canvas 
      ref={canvasRef} 
      style={{ width: '100%', height: '100%' }}
    />
  );
} 