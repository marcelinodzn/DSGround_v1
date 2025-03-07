'use client'

import { useState, useEffect } from 'react'
import { useColorStore, ColorPalette, ColorStep, ColorFormat } from '@/store/color-store'
import { useBrandStore } from '@/store/brand-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Plus, ChevronDown, Copy, Settings, Palette, Sliders } from 'lucide-react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
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
  const [colorModel, setColorModel] = useState<'oklch' | 'hsl' | 'rgb'>('oklch')
  const [baseColor, setBaseColor] = useState('#3264C8')
  const [isCore, setIsCore] = useState(true)
  
  // Get the currently selected palette
  const currentPalette = palettes.find(p => p.id === currentPaletteId)

  // When current palette changes, update the base color
  useEffect(() => {
    if (currentPalette?.baseColor?.hex) {
      setBaseColor(currentPalette.baseColor.hex);
    }
  }, [currentPaletteId, currentPalette]);

  // Add this effect to update the palette when the base color changes
  useEffect(() => {
    if (currentPalette && baseColor) {
      handleBaseColorChange(baseColor);
    }
  }, [baseColor]);

  // Handle color model change
  const handleColorModelChange = (model: 'oklch' | 'hsl' | 'rgb') => {
    setColorModel(model);
    // Update the store with appropriate default values for the selected color model
    if (model === 'hsl') {
      updatePaletteConfig({
        // HSL uses saturation instead of chroma
        chromaRange: [0, 1], // Saturation ranges from 0-100%
      });
    } else if (model === 'oklch') {
      updatePaletteConfig({
        // OKLCH uses chroma
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
      console.log('Converted base color:', colorValues);
      
      // Update the base color in the palette
      await updatePalette(currentPalette.id, {
        baseColor: colorValues
      });
      
      // Regenerate the palette with the new base color
      const paletteOptions = {
        lightnessPreset: paletteConfig.lightnessPreset,
        chromaPreset: paletteConfig.chromaPreset,
        lightnessRange: paletteConfig.lightnessRange,
        chromaRange: paletteConfig.chromaRange,
        hueShift: paletteConfig.hueShift
      };
      
      const generatedSteps = generatePalette(
        colorValues, 
        paletteConfig.numSteps, 
        paletteConfig.useLightness, 
        paletteOptions
      );
      
      // Update the steps in the palette
      await updatePalette(currentPalette.id, {
        steps: generatedSteps
      });
      
      // Force an update of the preview
      setTimeout(() => {
        const event = new Event('paletteCreated');
        window.dispatchEvent(event);
      }, 100);
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

  return (
    <div className="h-full overflow-auto">
      <div className="p-4 border-b">
        <h3 className="text-lg font-medium">Color Properties</h3>
        <p className="text-sm text-muted-foreground">Configure your color system</p>
      </div>

      {/* 1st Dropdown: Color Scale */}
      <Collapsible defaultOpen>
        <CollapsibleTrigger className="flex w-full items-center justify-between px-4 py-4 text-sm font-semibold border-t group">
          <div className="flex items-center">
            <Palette className="h-4 w-4 mr-2" />
            <span>Color Scale</span>
          </div>
          <ChevronDown 
            className="h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180" 
            aria-hidden="true"
          />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-4 py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-palette-name">Create a new palette</Label>
              <div className="flex gap-2">
                <Input 
                  id="new-palette-name"
                  value={newPaletteName}
                  onChange={(e) => setNewPaletteName(e.target.value)}
                  placeholder="Palette name"
                  className="flex-1"
                />
                <Select value={isCore ? "core" : "accent"} onValueChange={(value) => setIsCore(value === "core")}>
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="core">Core</SelectItem>
                    <SelectItem value="accent">Accent</SelectItem>
                  </SelectContent>
                </Select>
                <Button 
                  variant="outline" 
                  size="icon"
                  disabled={!newPaletteName}
                  onClick={() => handleCreatePalette(isCore)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="color-model">Color Model</Label>
              <Select 
                value={colorModel} 
                onValueChange={(value) => handleColorModelChange(value as 'oklch' | 'hsl' | 'rgb')}
              >
                <SelectTrigger id="color-model">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="oklch">OKLCH</SelectItem>
                  <SelectItem value="hsl">HSL</SelectItem>
                  <SelectItem value="rgb">RGB</SelectItem>
                </SelectContent>
              </Select>
            </div>
              
            <div className="space-y-2">
              <Label htmlFor="base-color">Base Color</Label>
              <div className="flex items-center gap-2">
                <div 
                  className="w-8 h-8 rounded-md border"
                  style={{ backgroundColor: baseColor }}
                ></div>
                <div className="flex-1">
                  <input 
                    id="base-color"
                    type="color" 
                    value={baseColor}
                    onChange={(e) => handleBaseColorChange(e.target.value)}
                    className="w-full h-8"
                  />
                </div>
                <code className="text-xs bg-muted p-1 rounded">
                  {baseColor}
                </code>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* 2nd Dropdown: Shade Generator */}
      <Collapsible>
        <CollapsibleTrigger className="flex w-full items-center justify-between px-4 py-4 text-sm font-semibold border-t group">
          <div className="flex items-center">
            <Settings className="h-4 w-4 mr-2" />
            <span>Shade Generator</span>
          </div>
          <ChevronDown 
            className="h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180" 
            aria-hidden="true"
          />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-4 py-4 space-y-4">
            <div className="flex gap-4">
              <div className="flex-1 space-y-2">
                <Label htmlFor="num-steps">Number of Steps</Label>
                <Select 
                  value={paletteConfig.numSteps.toString()} 
                  onValueChange={(value) => updatePaletteConfig({ 
                    numSteps: parseInt(value) 
                  })}
                >
                  <SelectTrigger id="num-steps">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[5, 7, 9, 11, 13, 15, 17, 19, 21, 25].map(num => (
                      <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex-1 space-y-2">
                <Label htmlFor="variation-type">Variation Type</Label>
                <Select 
                  value={paletteConfig.useLightness ? "lightness" : "chroma"} 
                  onValueChange={(value) => updatePaletteConfig({ 
                    useLightness: value === "lightness" 
                  })}
                >
                  <SelectTrigger id="variation-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lightness">Lightness</SelectItem>
                    <SelectItem value="chroma">{colorModel === 'hsl' ? 'Saturation' : 'Chroma'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="lightness-preset">Lightness Distribution</Label>
              <Select 
                value={paletteConfig.lightnessPreset} 
                onValueChange={(value) => updatePaletteConfig({ 
                  lightnessPreset: value as 'linear' | 'curved' | 'custom' 
                })}
              >
                <SelectTrigger id="lightness-preset">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="linear">Linear</SelectItem>
                  <SelectItem value="curved">Ease In-Out</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
              
              <div className="mt-2">
                <div className="flex items-center gap-4">
                  <Slider 
                    value={[
                      paletteConfig.lightnessRange[0] * 100, 
                      paletteConfig.lightnessRange[1] * 100
                    ]} 
                    min={0} 
                    max={100} 
                    step={1}
                    showTooltip={true}
                    tooltipContent={(value) => `${value}%`}
                    onValueChange={(values) => updatePaletteConfig({ 
                      lightnessRange: [values[0] / 100, values[1] / 100],
                      lightnessPreset: paletteConfig.lightnessPreset
                    })}
                    className="flex-1"
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>{Math.round(paletteConfig.lightnessRange[0] * 100)}%</span>
                  <span>{Math.round(paletteConfig.lightnessRange[1] * 100)}%</span>
                </div>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* 3rd Dropdown: Advanced Configuration */}
      <Collapsible>
        <CollapsibleTrigger className="flex w-full items-center justify-between px-4 py-4 text-sm font-semibold border-t group">
          <div className="flex items-center">
            <Sliders className="h-4 w-4 mr-2" />
            <span>Advanced Configuration</span>
          </div>
          <ChevronDown 
            className="h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180" 
            aria-hidden="true"
          />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-4 py-4 space-y-4">
            {/* Chroma/Saturation Distribution based on color model */}
            <div className="space-y-2">
              <Label htmlFor="chroma-preset">
                {colorModel === 'hsl' ? 'Saturation Distribution' : 'Chroma Distribution'}
              </Label>
              <Select 
                value={paletteConfig.chromaPreset} 
                onValueChange={(value) => updatePaletteConfig({ 
                  chromaPreset: value as 'constant' | 'decrease' | 'increase' | 'custom' 
                })}
              >
                <SelectTrigger id="chroma-preset">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="constant">Constant</SelectItem>
                  <SelectItem value="decrease">Decrease with Lightness</SelectItem>
                  <SelectItem value="increase">Increase with Lightness</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
                
              <div className="mt-2">
                <Label className="text-xs mb-1 block">
                  {colorModel === 'hsl' ? 'Saturation Range' : 'Chroma Range'}
                </Label>
                <div className="flex items-center gap-2">
                  <Slider 
                    value={[
                      paletteConfig.chromaRange[0] * 100, 
                      paletteConfig.chromaRange[1] * 100
                    ]} 
                    min={0} 
                    max={colorModel === 'hsl' ? 100 : 40} // Saturation goes to 100%, Chroma to 40%
                    step={1}
                    showTooltip={true}
                    tooltipContent={(value) => `${value}%`}
                    onValueChange={(values) => updatePaletteConfig({ 
                      chromaRange: [values[0] / 100, values[1] / 100] 
                    })}
                    className="flex-1"
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>{Math.round(paletteConfig.chromaRange[0] * 100)}%</span>
                  <span>{Math.round(paletteConfig.chromaRange[1] * 100)}%</span>
                </div>
              </div>
            </div>
                
            {/* Hue Shift */}
            <div className="space-y-2">
              <Label htmlFor="hue-shift">Hue Shift</Label>
              <div className="flex items-center gap-2">
                <Slider 
                  value={[paletteConfig.hueShift || 0]} 
                  min={-30} 
                  max={30} 
                  step={1}
                  showTooltip={true}
                  tooltipContent={(value) => `${value}°`}
                  onValueChange={(values) => {
                    updatePaletteConfig({ hueShift: values[0] });
                  }}
                  className="flex-1"
                />
                <div className="w-8 text-right text-xs">{paletteConfig.hueShift || 0}°</div>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
} 