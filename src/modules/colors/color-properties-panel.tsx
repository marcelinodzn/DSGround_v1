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
import { toast } from '@/components/ui/use-toast'

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
  const [customChromaValues, setCustomChromaValues] = useState<number[]>([])
  const [colorGamut, setColorGamut] = useState<'srgb' | 'display-p3' | 'unlimited'>('srgb')
  const [showOutOfGamut, setShowOutOfGamut] = useState(true)
  
  // Get the currently selected palette
  const currentPalette = palettes.find(p => p.id === currentPaletteId)

  // When current palette changes, update the base color and other settings
  useEffect(() => {
    if (currentPalette) {
      setBaseColor(currentPalette.baseColor.hex);
      // Update other settings based on the selected palette
      updatePaletteConfig({
        numSteps: currentPalette.steps.length,
        lightnessRange: [0.1, 0.9], // Default values if not available
        chromaRange: [0.01, 0.4],    // Default values if not available
        hueShift: 0                  // Default value if not available
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
    if (!currentBrand) return

    try {
      // Use the selected base color
      const baseColorObj = convertToAllFormats(baseColor);
      
      // Generate steps for the palette using the parameters from the palette config
      const generatedSteps = generatePalette(baseColorObj, paletteConfig.numSteps);
      
      // Create the palette in the store (which syncs to Supabase)
      const paletteData = {
        name: newPaletteName || `${isCore ? 'Core' : 'Accent'} Palette ${Date.now()}`,
        description: '',
        baseColor: baseColorObj,
        tags: [],
        steps: generatedSteps,
        isCore,
        brandId: currentBrand.id
      };
      
      await createPalette(currentBrand.id, paletteData);
      
      setNewPaletteName('');
      
      // Fetch all palettes to update the UI
      await updatePalettes();
      
      // Set the current palette to the most recently created one
      // This will be handled by the updatePalettes function
    } catch (error) {
      console.error('Error creating palette:', error);
      toast.error('Failed to create palette');
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
          // For the current palette, check if base color is locked
          // Only use the stored base color when it's the current palette AND the base color is locked
          // Otherwise, use the base color from the palette
          const baseColorToUse = palette.baseColor;
          
          // Do not regenerate the current palette if the base color is locked
          if (palette.id === currentPaletteId && lockBaseColor) {
            console.log('Base color is locked for current palette - preserving colors');
            continue; // Skip regeneration for this palette
          }
            
          // Generate steps for the palette
          const generatedSteps = generatePalette(
            baseColorToUse, 
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
    lockBaseColor,
    currentPaletteId,
    palettes
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

  // Generate default custom chroma values when number of steps changes
  useEffect(() => {
    if (paletteConfig.chromaPreset === 'custom') {
      const newValues = Array(paletteConfig.numSteps).fill(0).map((_, i) => {
        const percent = i / (paletteConfig.numSteps - 1);
        return paletteConfig.chromaRange[0] + percent * (paletteConfig.chromaRange[1] - paletteConfig.chromaRange[0]);
      });
      setCustomChromaValues(newValues);
    }
  }, [paletteConfig.numSteps, paletteConfig.chromaPreset, paletteConfig.chromaRange]);

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

  // Update custom chroma value at a specific index
  const updateCustomChromaValue = (index: number, value: number) => {
    const newValues = [...customChromaValues];
    if (newValues.length !== paletteConfig.numSteps) {
      // Initialize with current distribution if needed
      const defaultValues = Array(paletteConfig.numSteps).fill(0).map((_, i) => {
        const percent = i / (paletteConfig.numSteps - 1);
        return paletteConfig.chromaRange[0] + percent * (paletteConfig.chromaRange[1] - paletteConfig.chromaRange[0]);
      });
      newValues.splice(0, newValues.length, ...defaultValues);
    }
    
    newValues[index] = value;
    setCustomChromaValues(newValues);
    
    // Update the store
    updatePaletteConfig({
      chromaPreset: 'custom',
      customChromaValues: newValues
    });
  };

  // Handle color gamut change
  const handleColorGamutChange = (gamut: 'srgb' | 'display-p3' | 'unlimited') => {
    setColorGamut(gamut);
    
    // Update the palette config with the gamut information
    // Without using metadata property that doesn't exist
    updatePaletteConfig({ 
      // We'll use direct properties instead of metadata
      colorGamutSetting: gamut
    });
    
    // Force regeneration of all palettes with the new gamut
    const updatePalettesWithGamut = async () => {
      if (!currentBrand) return;
      
      try {
        // Get all palettes for the current brand
        const brandPalettes = palettes.filter(p => p.brandId === currentBrand.id);
        
        if (brandPalettes.length === 0) return;
        
        // Update each palette with the new gamut
        for (const palette of brandPalettes) {
          // Skip locked base color for current palette
          if (palette.id === currentPaletteId && lockBaseColor) {
            continue;
          }
          
          // Generate steps for the palette with the new gamut
          const generatedSteps = generatePalette(
            palette.baseColor, 
            paletteConfig.numSteps
          );
          
          // Update the palette in the store
          await updatePalette(palette.id, {
            steps: generatedSteps
          });
        }
        
        // Force an update of the preview
        setTimeout(() => {
          const event = new Event('paletteCreated');
          window.dispatchEvent(event);
        }, 100);
      } catch (error) {
        console.error('Error updating palettes with new gamut:', error);
      }
    };
    
    // Execute the update
    updatePalettesWithGamut();
  };

  // Check if a color is outside of the selected gamut
  const isOutOfGamut = (color: string, targetGamut: 'srgb' | 'display-p3' | 'unlimited'): boolean => {
    if (targetGamut === 'unlimited') return false;
    
    try {
      // For OKLCH colors, check if they fall outside sRGB
      if (color.toLowerCase().startsWith('oklch')) {
        // We'll assume higher chroma OKLCH colors are likely outside sRGB
        const match = color.match(/oklch\(\s*[\d.]+\s+([0-9.]+)/i);
        if (match && match[1]) {
          const chroma = parseFloat(match[1]);
          // Higher chroma threshold for display-p3
          if (targetGamut === 'srgb') {
            return chroma > 0.13; // More strict for sRGB
          } else if (targetGamut === 'display-p3') {
            return chroma > 0.3; // Display P3 can handle more chroma
          }
        }
      }
      
      // For hex colors, estimate based on saturation and brightness
      if (color.startsWith('#')) {
        const r = parseInt(color.slice(1, 3), 16) / 255;
        const g = parseInt(color.slice(3, 5), 16) / 255;
        const b = parseInt(color.slice(5, 7), 16) / 255;
        
        // Detect obviously out-of-gamut colors (any negative RGB values)
        if (r < 0 || r > 1 || g < 0 || g > 1 || b < 0 || b > 1) {
          return true;
        }
        
        // Calculate HSV for better gamut estimation
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const delta = max - min;
        const saturation = max === 0 ? 0 : delta / max;
        
        if (targetGamut === 'srgb') {
          // Pure or very saturated primary and secondary colors near the sRGB gamut boundary
          // Red, green, blue, cyan, magenta, yellow
          if (saturation > 0.9) {
            // For red, check if it's highly saturated
            if (r > 0.9 && g < 0.2 && b < 0.2) return true;
            // For green, check if it's highly saturated
            if (g > 0.9 && r < 0.4 && b < 0.4) return true;
            // For blue, check if it's highly saturated
            if (b > 0.9 && r < 0.2 && g < 0.2) return true;
            // For cyan (green+blue), check if it's highly saturated
            if (g > 0.8 && b > 0.8 && r < 0.2) return true;
            // For magenta (red+blue), check if it's highly saturated
            if (r > 0.8 && b > 0.8 && g < 0.2) return true;
            // For yellow (red+green), check if it's highly saturated
            if (r > 0.9 && g > 0.9 && b < 0.1) return true;
          }
        }
      }
      
      return false;
    } catch (e) {
      console.error('Error checking gamut:', e);
      return false;
    }
  };
  
  // Get coordinates for position on CIE chromaticity diagram
  const getCIECoordinates = (color: string): {x: number, y: number} => {
    try {
      // Default position (centered in sRGB gamut)
      let x = 0.33;
      let y = 0.33;
      
      if (color.startsWith('#')) {
        // Convert hex to RGB
        const r = parseInt(color.slice(1, 3), 16) / 255;
        const g = parseInt(color.slice(3, 5), 16) / 255;
        const b = parseInt(color.slice(5, 7), 16) / 255;
        
        // More accurate CIE coordinates calculation
        // These are rough conversion matrices based on sRGB to XYZ transformation
        const X = r * 0.4124 + g * 0.3576 + b * 0.1805;
        const Y = r * 0.2126 + g * 0.7152 + b * 0.0722;
        const Z = r * 0.0193 + g * 0.1192 + b * 0.9505;
        
        const sum = X + Y + Z;
        if (sum > 0) {
          x = X / sum;
          y = Y / sum;
        }
      }
      
      return { x, y };
    } catch (e) {
      console.error('Error calculating CIE coordinates:', e);
      return { x: 0.33, y: 0.33 };
    }
  };
  
  // Convert CIE coordinates to screen position
  const cieToScreenCoordinates = (x: number, y: number): {top: string, left: string} => {
    // Map CIE x (0 to 0.8) and y (0 to 0.9) to screen coordinates
    const screenX = (x / 0.8) * 100;
    const screenY = 100 - ((y / 0.9) * 100); // Invert Y for screen coordinates
    
    return {
      left: `${Math.max(2, Math.min(98, screenX))}%`,
      top: `${Math.max(2, Math.min(98, screenY))}%`
    };
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
                <TabsTrigger value="chromaSteps">Chroma Steps</TabsTrigger>
              </TabsList>
              
              {/* Color Settings Tab */}
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
                  
                  {/* Quick presets for Lightness */}
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
                            // Inverted linear - reverse the order
                            const percent = 1 - (i / (paletteConfig.numSteps - 1));
                            return paletteConfig.lightnessRange[0] + percent * (paletteConfig.lightnessRange[1] - paletteConfig.lightnessRange[0]);
                          });
                          setCustomLightnessValues(newValues);
                          updatePaletteConfig({
                            lightnessPreset: 'custom',
                            customLightnessValues: newValues
                          });
                        }}
                      >
                        Inverted
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

              {/* Chroma Steps Tab */}
              <TabsContent value="chromaSteps" className="space-y-4 pt-2">
                <div className="space-y-4">
                  {/* Show control for each step */}
                  {Array(paletteConfig.numSteps).fill(0).map((_, index) => {
                    const defaultValue = (() => {
                      const percent = index / (paletteConfig.numSteps - 1);
                      return paletteConfig.chromaRange[0] + percent * (paletteConfig.chromaRange[1] - paletteConfig.chromaRange[0]);
                    })();
                    
                    const value = customChromaValues[index] !== undefined 
                      ? customChromaValues[index] 
                      : defaultValue;
                    
                    const isBaseStep = index === Math.floor(paletteConfig.numSteps / 2);
                    const maxValue = colorModel === 'oklch' ? 0.4 : 1.0;
                    const displayMultiplier = colorModel === 'oklch' ? 100 : 100;
                    
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
                              max={colorModel === 'oklch' ? 40 : 100}
                              step={0.5}
                              value={Math.round(value * displayMultiplier)}
                              onChange={(e) => {
                                const newValue = parseInt(e.target.value) / displayMultiplier;
                                updateCustomChromaValue(index, Math.max(0, Math.min(maxValue, newValue)));
                              }}
                              className="w-16 text-xs text-right"
                            />
                            <span className="text-xs text-muted-foreground">%</span>
                          </div>
                        </div>
                        <Slider
                          value={[value * displayMultiplier]}
                          min={0}
                          max={colorModel === 'oklch' ? 40 : 100}
                          step={0.5}
                          onValueChange={([newValue]) => {
                            updateCustomChromaValue(index, newValue / displayMultiplier);
                          }}
                        />
                      </div>
                    );
                  })}
                  
                  {/* Quick presets for Chroma */}
                  <div className="pt-4 border-t">
                    <Label className="mb-2 block">Distribution Presets</Label>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newValues = Array(paletteConfig.numSteps).fill(0).map((_, i) => {
                            const percent = i / (paletteConfig.numSteps - 1);
                            return paletteConfig.chromaRange[0] + percent * (paletteConfig.chromaRange[1] - paletteConfig.chromaRange[0]);
                          });
                          setCustomChromaValues(newValues);
                          updatePaletteConfig({
                            chromaPreset: 'custom',
                            customChromaValues: newValues
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
                            // Inverted linear - reverse the order
                            const percent = 1 - (i / (paletteConfig.numSteps - 1));
                            return paletteConfig.chromaRange[0] + percent * (paletteConfig.chromaRange[1] - paletteConfig.chromaRange[0]);
                          });
                          setCustomChromaValues(newValues);
                          updatePaletteConfig({
                            chromaPreset: 'custom',
                            customChromaValues: newValues
                          });
                        }}
                      >
                        Inverted
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newValues = Array(paletteConfig.numSteps).fill(0).map((_, i) => {
                            const t = i / (paletteConfig.numSteps - 1);
                            const easedT = 1 - Math.pow(1 - t, 3);
                            return paletteConfig.chromaRange[0] + easedT * (paletteConfig.chromaRange[1] - paletteConfig.chromaRange[0]);
                          });
                          setCustomChromaValues(newValues);
                          updatePaletteConfig({
                            chromaPreset: 'custom',
                            customChromaValues: newValues
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
                            return paletteConfig.chromaRange[0] + easedT * (paletteConfig.chromaRange[1] - paletteConfig.chromaRange[0]);
                          });
                          setCustomChromaValues(newValues);
                          updatePaletteConfig({
                            chromaPreset: 'custom',
                            customChromaValues: newValues
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
      
      {/* Color Gamut Dropdown */}
      <Collapsible>
        <CollapsibleTrigger className="flex w-full items-center justify-between px-4 py-4 text-sm font-semibold border-t group">
          <div className="flex items-center">
            <Settings className="h-4 w-4 mr-2" />
            <span>Color Gamut</span>
          </div>
          <ChevronDown 
            className="h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180" 
            aria-hidden="true"
          />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-4 py-4 space-y-4">
            <div className="space-y-2">
              <Label>Color Gamut</Label>
              <div className="grid grid-cols-3 gap-2">
                <Button 
                  variant={colorGamut === 'srgb' ? 'default' : 'outline'} 
                  className="w-full" 
                  onClick={() => handleColorGamutChange('srgb')}
                >
                  sRGB
                </Button>
                <Button 
                  variant={colorGamut === 'display-p3' ? 'default' : 'outline'} 
                  className="w-full" 
                  onClick={() => handleColorGamutChange('display-p3')}
                >
                  Display P3
                </Button>
                <Button 
                  variant={colorGamut === 'unlimited' ? 'default' : 'outline'} 
                  className="w-full" 
                  onClick={() => handleColorGamutChange('unlimited')}
                >
                  Unlimited
                </Button>
              </div>
              <div className="text-xs text-muted-foreground mt-2">
                Color gamut limits the available range of colors in your palette. Wider gamuts allow more vibrant colors but may not display correctly on all devices.
              </div>
              
              {/* Out of Gamut Warning Toggle */}
              <div className="flex items-center justify-between mt-4">
                <Label htmlFor="show-out-of-gamut" className="text-sm">Show Out-of-Gamut Warning</Label>
                <button
                  id="show-out-of-gamut"
                  type="button"
                  className={cn(
                    "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                    showOutOfGamut ? "bg-primary" : "bg-muted"
                  )}
                  onClick={() => setShowOutOfGamut(!showOutOfGamut)}
                >
                  <span
                    className={cn(
                      "inline-block h-4 w-4 rounded-full bg-background transition-transform",
                      showOutOfGamut ? "translate-x-6" : "translate-x-1"
                    )}
                  />
                </button>
              </div>
              <div className="text-xs text-muted-foreground">
                Shows warnings for colors that cannot be accurately displayed in the selected color space.
              </div>
              
              {/* Interactive CIE Chromaticity Diagram */}
              <div className="mt-6 border rounded-md overflow-hidden">
                <div className="bg-slate-50 px-3 py-2 border-b">
                  <h4 className="text-sm font-medium">CIE Chromaticity Diagram</h4>
                </div>
                
                <div className="p-3">
                  {/* CIE diagram visualization */}
                  <div className="relative w-full aspect-square rounded-md bg-black overflow-hidden">
                    {/* Full spectral locus background */}
                    <img 
                      src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjgwMCIgdmlld0JveD0iMCAwIDgwMCA4MDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiAgPGRlZnM+CiAgICA8bGluZWFyR3JhZGllbnQgaWQ9InNwZWN0cnVtX2dyYWQiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPgogICAgICA8c3RvcCBvZmZzZXQ9IjAlIiBzdG9wLWNvbG9yPSJyZ2IoMjU1LDAsMjU1KSIgLz4KICAgICAgPHN0b3Agb2Zmc2V0PSIxNSUiIHN0b3AtY29sb3I9InJnYigwLDAsMjU1KSIgLz4KICAgICAgPHN0b3Agb2Zmc2V0PSIzMCUiIHN0b3AtY29sb3I9InJnYigwLDI1NSwyNTUpIiAvPgogICAgICA8c3RvcCBvZmZzZXQ9IjUwJSIgc3RvcC1jb2xvcj0icmdiKDAsMjU1LDApIiAvPgogICAgICA8c3RvcCBvZmZzZXQ9IjcwJSIgc3RvcC1jb2xvcj0icmdiKDI1NSwyNTUsMCkiIC8+CiAgICAgIDxzdG9wIG9mZnNldD0iODUlIiBzdG9wLWNvbG9yPSJyZ2IoMjU1LDAsMCkiIC8+CiAgICAgIDxzdG9wIG9mZnNldD0iMTAwJSIgc3RvcC1jb2xvcj0icmdiKDI1NSwwLDI1NSkiIC8+CiAgICA8L2xpbmVhckdyYWRpZW50PgogIDwvZGVmcz4KICA8ZyB0cmFuc2Zvcm09InRyYW5zbGF0ZSg0MCwgNDApIHNjYWxlKDAuOSkiPgogICAgPHBhdGggZD0iTTEwMCw3MDAgQzEyMCw2MjAgMTYwLDUwMCAyMzAsMyBCLDEwMCw2NzAgNDAwLDEwMCBDNTAwLDE1MCA2NTAsMjUwIDcwMCwzMDAgTDQ1MCw1MDAgQzQwMCw2MDAgMjUwLDY1MCAxMDAsNzAwIFoiIGZpbGw9InVybCgjc3BlY3RydW1fZ3JhZCkiIGZpbGwtb3BhY2l0eT0iMC4zIi8+CiAgICA8cGF0aCBkPSJNMTAwLDcwMCBDMTUwLDQ1MCAyMDAsMjUwIDQwMCwxMDAgQzUwMCwxNTAgNjUwLDI1MCA3MDAsMzAwIEM0MDAsNjAwIDI1MCw2NTAgMTAwLDcwMCBaIiBmaWxsPSJub25lIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjEuNSIgc3Ryb2tlLW9wYWNpdHk9IjAuOCIvPgogICAgCiAgICA8IS0tIHNSR0IgdHJpYW5nbGUgLS0+CiAgICA8cG9seWdvbiBwb2ludHM9IjIzNCw2MTcgMTUxLDM4NCA1OTEsMzAwIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWRhc2hhcnJheT0iMCAvaWQgPSdzcmdiJyIvPgogICAgCiAgICA8IS0tIERpc3BsYXkgUDMgdHJpYW5nbGUgLS0+CiAgICA8cG9seWdvbiBwb2ludHM9IjE1MCw2NTAgMTIwLDM1MCA2NTAsMjgwIiBmaWxsPSJyZ2JhKDI1NSwyMTUsMCwwLjEpIiBzdHJva2U9InJnYigyNTUsMjE1LDApIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1kYXNoYXJyYXk9IjUgNSIvPgogICAgCiAgICA8IS0tIFVubGltaXRlZCBnYW11dCB0cmlhbmdsZSAtLT4KICAgIDxwb2x5Z29uIHBvaW50cz0iMTIwLDcwMCAxMDAsMTUwIDcwMCwyNTAiIGZpbGw9InJnYmEoMTg2LDg1LDIxMSwwLjEpIiBzdHJva2U9InJnYigxODYsODUsMjExKSIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtZGFzaGFycmF5PSI1IDUiLz4KICAgIAogICAgPCEtLSBXYXZlbGVuZ3RocyAtLT4KICAgIDx0ZXh0IHg9IjUwMCIgeT0iMTgwIiBmaWxsPSIjNDk5OGZmIiBmb250LXNpemU9IjE2IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj40NjBubTwvdGV4dD4KICAgIDx0ZXh0IHg9IjIwMCIgeT0iMjAwIiBmaWxsPSIjNTBmZjUwIiBmb250LXNpemU9IjE2IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj41MjBubTwvdGV4dD4KICAgIDx0ZXh0IHg9IjYwMCIgeT0iNDAwIiBmaWxsPSIjZmZkNzAwIiBmb250LXNpemU9IjE2IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj41ODBubTwvdGV4dD4KICAgIDx0ZXh0IHg9IjMwMCIgeT0iNjAwIiBmaWxsPSIjZmY1MDUwIiBmb250LXNpemU9IjE2IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj43MDBubTwvdGV4dD4KICAgIAogICAgPCEtLSBMYWJlbHMgLS0+CiAgICA8dGV4dCB4PSIzMjUiIHk9IjQzMCIgZmlsbD0id2hpdGUiIGZvbnQtc2l6ZT0iMTIiIHRleHQtYW5jaG9yPSJtaWRkbGUiPnNSR0I8L3RleHQ+CiAgICA8dGV4dCB4PSIzNTAiIHk9IjQ4MCIgZmlsbD0icmdiKDI1NSwyMTUsMCkiIGZvbnQtc2l6ZT0iMTIiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkRpc3BsYXkgUDM8L3RleHQ+CiAgICA8dGV4dCB4PSIzNzUiIHk9IjU0MCIgZmlsbD0icmdiKDE4Niw4NSwyMTEpIiBmb250LXNpemU9IjEyIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5VbmxpbmloobmcdGVkPC90ZXh0PgogICAgCiAgICA8IS0tIEdyaWQgbGluZXMgLS0+CiAgICA8ZyBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC4xKSIgc3Ryb2tlLXdpZHRoPSIxIj4KICAgICAgPGxpbmUgeDE9IjAiIHkxPSIwIiB4Mj0iODAwIiB5Mj0iODAwIiAvPgogICAgICA8bGluZSB4MT0iMCIgeTE9IjgwMCIgeDI9IjgwMCIgeTI9IjAiIC8+CiAgICAgIDxsaW5lIHgxPSI0MDAiIHkxPSIwIiB4Mj0iNDAwIiB5Mj0iODAwIiAvPgogICAgICA8bGluZSB4MT0iMCIgeTE9IjQwMCIgeDI9IjgwMCIgeTI9IjQwMCIgLz4KICAgIDwvZz4KICAgIAogICAgPCEtLSBXaGl0ZSBwb2ludCAtLT4KICAgIDxjaXJjbGUgY3g9IjQwMCIgY3k9IjQwMCIgcj0iNCIgZmlsbD0id2hpdGUiIC8+CiAgPC9nPgo8L3N2Zz4="
                      className="absolute inset-0 w-full h-full object-cover"
                      alt="CIE Chromaticity Diagram"
                    />
                    
                    {/* Color space boundaries overlays */}
                    <svg viewBox="0 0 800 800" className="absolute inset-0 w-full h-full">
                      {/* sRGB triangle */}
                      <polygon 
                        points="234,617 151,384 591,300" 
                        fill="none"
                        stroke={colorGamut === 'srgb' ? 'white' : 'rgba(255,255,255,0.4)'} 
                        strokeWidth="2.5" 
                        strokeDasharray={colorGamut === 'srgb' ? "none" : "5,5"}
                      />
                      
                      {/* Display P3 triangle */}
                      <polygon 
                        points="150,650 120,350 650,280" 
                        fill="none"
                        stroke={colorGamut === 'display-p3' ? 'rgb(255,215,0)' : 'rgba(255,215,0,0.4)'} 
                        strokeWidth="2.5" 
                        strokeDasharray={colorGamut === 'display-p3' ? "none" : "5,5"}
                      />
                      
                      {/* Unlimited gamut triangle */}
                      <polygon 
                        points="120,700 100,150 700,250" 
                        fill="none"
                        stroke={colorGamut === 'unlimited' ? 'rgb(186,85,211)' : 'rgba(186,85,211,0.4)'} 
                        strokeWidth="2.5" 
                        strokeDasharray={colorGamut === 'unlimited' ? "none" : "5,5"}
                      />
                    </svg>
                    
                    {/* Current base color indicator */}
                    {currentPalette && (() => {
                      const cieCoords = getCIECoordinates(currentPalette.baseColor.hex);
                      const screenX = cieCoords.x * 800; 
                      const screenY = (1 - cieCoords.y) * 800; // Invert Y for screen coords
                      
                      return (
                        <div 
                          className={cn(
                            "absolute w-6 h-6 rounded-full shadow-lg transform -translate-x-1/2 -translate-y-1/2 z-10 border-2",
                            isOutOfGamut(currentPalette.baseColor.hex, colorGamut) && showOutOfGamut
                              ? "border-red-500 animate-pulse"
                              : "border-white"
                          )}
                          style={{
                            background: currentPalette.baseColor.hex,
                            top: `${screenY}px`,
                            left: `${screenX}px`,
                          }}
                        >
                          {isOutOfGamut(currentPalette.baseColor.hex, colorGamut) && showOutOfGamut && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-xs text-white font-bold">!</span>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>
                
                {/* Color gamut compatibility */}
                <div className="border-t p-3">
                  <h5 className="text-xs font-medium mb-2">Current Color Compatibility:</h5>
                  
                  {currentPalette && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-white"></div>
                          <span className="text-xs">sRGB</span>
                        </div>
                        <div>
                          {isOutOfGamut(currentPalette.baseColor.hex, 'srgb') ? (
                            <span className="text-xs text-red-500 flex items-center">
                              <span className="inline-block w-3 h-3 bg-red-500 rounded-full mr-1"></span>
                              Outside gamut
                            </span>
                          ) : (
                            <span className="text-xs text-green-500 flex items-center">
                              <span className="inline-block w-3 h-3 bg-green-500 rounded-full mr-1"></span>
                              Compatible
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                          <span className="text-xs">Display P3</span>
                        </div>
                        <div>
                          {isOutOfGamut(currentPalette.baseColor.hex, 'display-p3') ? (
                            <span className="text-xs text-red-500 flex items-center">
                              <span className="inline-block w-3 h-3 bg-red-500 rounded-full mr-1"></span>
                              Outside gamut
                            </span>
                          ) : (
                            <span className="text-xs text-green-500 flex items-center">
                              <span className="inline-block w-3 h-3 bg-green-500 rounded-full mr-1"></span>
                              Compatible
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-purple-400"></div>
                          <span className="text-xs">Unlimited (OKLCH)</span>
                        </div>
                        <div>
                          <span className="text-xs text-green-500 flex items-center">
                            <span className="inline-block w-3 h-3 bg-green-500 rounded-full mr-1"></span>
                            Compatible
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <p className="text-xs text-muted-foreground mt-3">
                    The diagram shows where your color sits in the CIE chromaticity space.
                    Colors outside your selected gamut may display incorrectly on standard screens.
                  </p>
                </div>
              </div>
              
              {/* Color Gamut Restriction Note */}
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <Info className="h-5 w-5 text-amber-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-amber-800">Color Gamut Information</h3>
                    <div className="mt-2 text-xs text-amber-700">
                      <p>
                        When using the <strong>{colorGamut}</strong> color gamut:
                      </p>
                      <ul className="list-disc pl-5 mt-1 space-y-1">
                        <li>sRGB works on all devices but has the smallest range of colors</li>
                        <li>Display P3 offers ~25% more colors but requires wide gamut displays</li>
                        <li>Unlimited allows the full OKLCH color space but may display inconsistently</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
      
      {/* Color Visualization Dropdown */}
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