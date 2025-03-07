'use client'

import { useState, useEffect } from 'react'
import { useColorStore, ColorPalette, ColorStep, ColorFormat } from '@/store/color-store'
import { useBrandStore } from '@/store/brand-store'
import { usePlatformStore } from '@/store/platform-store'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import { Plus, Trash2, Copy, Edit, Check, X, PlusCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { convertToAllFormats, getLuminance, calculateContrast } from '@/lib/color-utils'

// Helper function to determine text color (white or black) based on background color
const getTextColor = (backgroundColor: string): string => {
  try {
    const luminance = getLuminance(backgroundColor);
    // Use white text on dark backgrounds, black text on light backgrounds
    return luminance < 0.5 ? 'text-white' : 'text-black';
  } catch (error) {
    console.error('Error determining text color:', error);
    return 'text-black'; // Default to black text
  }
}

export function ColorPalettePreview() {
  const { palettes, currentPaletteId, setCurrentPalette, createPalette, updatePalette, deletePalette, addColorStep, updateColorStep, deleteColorStep, generatePalette, convertColor } = useColorStore()
  const { currentBrand } = useBrandStore()
  const { currentPlatform, error: platformError } = usePlatformStore()
  
  const [activeTab, setActiveTab] = useState('core')
  const [editingPalette, setEditingPalette] = useState<string | null>(null)
  const [newPaletteName, setNewPaletteName] = useState('')
  const [numSteps, setNumSteps] = useState(9) // Default number of steps
  const [selectedFormat, setSelectedFormat] = useState<ColorFormat>('hex')
  const [useLightness, setUseLightness] = useState(true) // Whether to vary lightness (true) or chroma (false)
  const [lightnessRange, setLightnessRange] = useState([0.05, 0.95]) // Min and max lightness values
  const [chromaRange, setChromaRange] = useState([0.01, 0.4]) // Min and max chroma values
  const [showAdvancedControls, setShowAdvancedControls] = useState(false) // Controls visibility of advanced options
  const [lightnessPreset, setLightnessPreset] = useState<'linear' | 'curved' | 'custom'>('linear')
  const [chromaPreset, setChromaPreset] = useState<'constant' | 'decrease' | 'increase' | 'custom'>('constant')
  
  const currentPalette = palettes.find(p => p.id === currentPaletteId) || null
  const corePalettes = palettes.filter(p => p.isCore)
  const accentPalettes = palettes.filter(p => !p.isCore)
  
  // Create a default palette if none exists
  useEffect(() => {
    const createDefaultPaletteIfNeeded = async () => {
      if (currentBrand && palettes.length === 0) {
        try {
          console.log('No palettes found, creating default palette');
          await handleCreateDefaultPalette();
        } catch (error) {
          console.error('Error creating default palette:', error);
        }
      }
    };
    
    createDefaultPaletteIfNeeded();
  }, [currentBrand, palettes])
  
  // Log platform errors for debugging
  useEffect(() => {
    if (platformError) {
      console.log('Platform store error:', platformError)
    }
  }, [platformError])
  
  const handleCreateDefaultPalette = async () => {
    if (!currentBrand) return
    
    try {
      console.log('Creating default palette for brand:', currentBrand.name);
      
      const defaultBaseColor = {
        oklch: "oklch(60% 0.15 240)",
        rgb: "rgb(50, 100, 200)",
        hex: "#3264C8"
      }
      
      // Generate steps for the palette using the current settings
      // Create palette generation options based on user selections
      const paletteOptions = {
        lightnessPreset,
        chromaPreset,
        lightnessRange,
        chromaRange
      };
      
      // Generate steps for the palette using the selected parameters and options
      const generatedSteps = generatePalette(defaultBaseColor, numSteps, useLightness, paletteOptions);
      
      // Create the palette in the store
      const newPalette = await createPalette(currentBrand.id, {
        name: "Primary",
        description: "Primary brand color palette",
        baseColor: defaultBaseColor,
        steps: generatedSteps,
        isCore: true
      })
      
      console.log('Default palette created:', newPalette);
      
      // If the palette was created successfully, set it as the current palette
      if (newPalette) {
        setCurrentPalette(newPalette.id);
      }
      
      return newPalette;
    } catch (error) {
      console.error('Error creating default palette:', error);
      
      // Even with Supabase errors, create a local-only palette for the user
      const defaultBaseColor = {
        oklch: "oklch(60% 0.15 240)",
        rgb: "rgb(50, 100, 200)",
        hex: "#3264C8"
      }
      
      // Create palette generation options based on user selections
      const paletteOptions = {
        lightnessPreset,
        chromaPreset,
        lightnessRange,
        chromaRange
      };
      
      // Generate steps for the palette using the selected parameters and options
      const generatedSteps = generatePalette(defaultBaseColor, numSteps, useLightness, paletteOptions);
      
      // Create a local-only palette
      const localPalette = {
        id: `local-${Date.now()}`,
        name: "Primary",
        description: "Primary brand color palette (local only)",
        baseColor: defaultBaseColor,
        steps: generatedSteps,
        isCore: true
      };
      
      // Manually update the store state
      useColorStore.setState(state => ({
        palettes: [...state.palettes, localPalette],
        currentPaletteId: localPalette.id
      }));
      
      return localPalette;
    }
  }
  
  const handleCreatePalette = async (isCore: boolean) => {
    if (!currentBrand || !newPaletteName) return
    
    try {
      console.log('Creating new palette:', newPaletteName);
      
      // Use a default blue color as the base
      const defaultBaseColor = {
        oklch: "oklch(60% 0.15 240)",
        rgb: "rgb(50, 100, 200)",
        hex: "#3264C8"
      }
      
      // Create palette generation options based on user selections
      const paletteOptions = {
        lightnessPreset,
        chromaPreset,
        lightnessRange,
        chromaRange
      };
      
      console.log('Creating palette with options:', { 
        defaultBaseColor, 
        numSteps, 
        useLightness, 
        ...paletteOptions 
      });
      
      // Generate steps for the palette using the selected parameters and options
      const generatedSteps = generatePalette(defaultBaseColor, numSteps, useLightness, paletteOptions);
      console.log('Generated steps:', generatedSteps);
      
      // Create the palette in the store (which will handle both local state and Supabase)
      const newPalette = await createPalette(currentBrand.id, {
        name: newPaletteName,
        description: `${newPaletteName} color palette`,
        baseColor: defaultBaseColor,
        steps: generatedSteps,
        isCore
      })
      
      console.log('New palette created:', newPalette);
      setNewPaletteName('');
      
      // If the palette was created successfully, set it as the current palette
      if (newPalette) {
        setCurrentPalette(newPalette.id);
      }
    } catch (error) {
      console.error('Error creating palette:', error);
      
      // Even with Supabase errors, create a local-only palette for the user
      // This allows the user to continue working even if there are database issues
      const defaultBaseColor = {
        oklch: "oklch(60% 0.15 240)",
        rgb: "rgb(50, 100, 200)",
        hex: "#3264C8"
      }
      
      // Create palette generation options based on user selections
      const paletteOptions = {
        lightnessPreset,
        chromaPreset,
        lightnessRange,
        chromaRange
      };
      
      // Generate steps for the palette using the selected parameters and options
      const generatedSteps = generatePalette(defaultBaseColor, numSteps, useLightness, paletteOptions);
      
      // Add the palette to the local state only
      const localPalette = {
        id: `local-${Date.now()}`,
        name: newPaletteName,
        description: `${newPaletteName} color palette (local only)`,
        baseColor: defaultBaseColor,
        steps: generatedSteps,
        isCore
      };
      
      // Manually update the store state
      useColorStore.setState(state => ({
        palettes: [...state.palettes, localPalette],
        currentPaletteId: localPalette.id
      }));
      
      // Clear the input field
      setNewPaletteName('');
    }
  }
  
  const handleUpdatePalette = async (palette: ColorPalette, updates: Partial<ColorPalette>) => {
    await updatePalette(palette.id, updates)
  }
  
  const handleDeletePalette = async (paletteId: string) => {
    await deletePalette(paletteId)
  }
  
  const handleColorChange = async (palette: ColorPalette, stepId: string, colorHex: string) => {
    // Convert the hex color to all other formats
    const updatedValues = convertToAllFormats(colorHex, 'hex');
    
    await updateColorStep(palette.id, stepId, {
      values: updatedValues
    })
  }
  
  const handleAddColorStep = async (paletteId: string) => {
    try {
      console.log('Adding new color step to palette:', paletteId);
      
      // Generate a default color (medium gray)
      const defaultColor = {
        hex: '#808080',
        rgb: 'rgb(128, 128, 128)',
        oklch: 'oklch(50% 0 0)'
      };
      
      // Add the color step to the palette
      await addColorStep(paletteId, {
        name: `New Step`,
        values: defaultColor
      });
      
      console.log('Color step added successfully');
    } catch (error) {
      console.error('Error adding color step:', error);
    }
  }
  
  const getTextColor = (bgColor: string) => {
    try {
      // Make sure we have a valid color
      if (!bgColor || typeof bgColor !== 'string') return 'text-black';
      
      // Only process valid hex colors
      if (!bgColor.startsWith('#')) {
        return 'text-black';
      }
      
      // Use luminance to determine if text should be white or black
      const luminance = getLuminance(bgColor);
      return luminance > 0.5 ? 'text-black' : 'text-white';
    } catch (error) {
      // Default to black text if there's an error
      return 'text-black';
    }
  }
  
  // Handle the case when no platform is selected
  if (!currentBrand) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>No Brand Selected</CardTitle>
            <CardDescription>Please select a brand to view color palettes.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <Tabs defaultValue="core" value={activeTab} onValueChange={setActiveTab}>
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="core">Core Palettes</TabsTrigger>
            <TabsTrigger value="accent">Accent Palettes</TabsTrigger>
          </TabsList>
          
          <div className="flex items-center gap-2">
            <div className="flex flex-col gap-2 mr-4">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="num-steps" className="text-xs">Steps:</Label>
                  <Select value={numSteps.toString()} onValueChange={(value) => setNumSteps(parseInt(value))}>
                    <SelectTrigger id="num-steps" className="w-16 h-8">
                      <SelectValue placeholder="9" />
                    </SelectTrigger>
                    <SelectContent>
                      {[5, 7, 9, 11, 13, 15, 17, 19, 21, 25].map(num => (
                        <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center gap-2">
                  <Label htmlFor="variation-type" className="text-xs">Vary:</Label>
                  <Select value={useLightness ? "lightness" : "chroma"} onValueChange={(value) => setUseLightness(value === "lightness")}>
                    <SelectTrigger id="variation-type" className="w-24 h-8">
                      <SelectValue placeholder="Lightness" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lightness">Lightness</SelectItem>
                      <SelectItem value="chroma">Chroma</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowAdvancedControls(!showAdvancedControls)}
                  className="text-xs h-7"
                >
                  {showAdvancedControls ? "Hide Advanced Options" : "Show Advanced Options"}
                </Button>
                
                {showAdvancedControls && (
                  <div className="mt-2 p-3 border rounded-md bg-muted/20">
                    <div className="mb-3">
                      <Label htmlFor="lightness-preset" className="text-xs mb-1 block">Lightness Distribution:</Label>
                      <Select value={lightnessPreset} onValueChange={(value) => setLightnessPreset(value as any)}>
                        <SelectTrigger id="lightness-preset" className="w-full h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="linear">Linear</SelectItem>
                          <SelectItem value="curved">Curved</SelectItem>
                          <SelectItem value="custom">Custom</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      {/* Lightness Distribution Preview */}
                      <div className="mt-2 mb-3">
                        <div className="flex h-4 w-full rounded-sm overflow-hidden">
                          {Array.from({ length: 20 }).map((_, i) => {
                            // Calculate lightness based on preset
                            let lightness;
                            const normalizedIndex = i / 19; // 0 to 1
                            const range = lightnessRange[1] - lightnessRange[0];
                            
                            switch (lightnessPreset) {
                              case 'linear':
                                lightness = lightnessRange[0] + (normalizedIndex * range);
                                break;
                              case 'curved':
                                if (normalizedIndex < 0.5) {
                                  lightness = lightnessRange[0] + (4 * normalizedIndex * normalizedIndex * normalizedIndex * range / 2);
                                } else {
                                  lightness = lightnessRange[0] + (1 - Math.pow(-2 * normalizedIndex + 2, 3) / 2 + 1) * range / 2;
                                }
                                break;
                              default:
                                lightness = lightnessRange[0] + (normalizedIndex * range);
                            }
                            
                            return (
                              <div 
                                key={i} 
                                className="flex-1 h-full" 
                                style={{ backgroundColor: `hsl(0 0% ${lightness * 100}%)` }}
                              />
                            );
                          })}
                        </div>
                        <div className="flex justify-between mt-1">
                          <span className="text-xs text-muted-foreground">{Math.round(lightnessRange[0] * 100)}%</span>
                          <span className="text-xs text-muted-foreground">{Math.round(lightnessRange[1] * 100)}%</span>
                        </div>
                      </div>
                      
                      {lightnessPreset === 'custom' && (
                        <div className="mt-2">
                          <Label className="text-xs mb-1 block">Lightness Range:</Label>
                          <div className="flex items-center gap-2">
                            <Slider
                              defaultValue={[lightnessRange[0] * 100, lightnessRange[1] * 100]}
                              max={100}
                              step={1}
                              onValueChange={(values) => setLightnessRange([values[0] / 100, values[1] / 100])}
                              className="flex-1"
                            />
                            <div className="text-xs text-muted-foreground">
                              {Math.round(lightnessRange[0] * 100)}% - {Math.round(lightnessRange[1] * 100)}%
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <Label htmlFor="chroma-preset" className="text-xs mb-1 block">Chroma Distribution:</Label>
                      <Select value={chromaPreset} onValueChange={(value) => setChromaPreset(value as any)}>
                        <SelectTrigger id="chroma-preset" className="w-full h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="constant">Constant</SelectItem>
                          <SelectItem value="decrease">Decrease with Lightness</SelectItem>
                          <SelectItem value="increase">Increase with Lightness</SelectItem>
                          <SelectItem value="custom">Custom</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      {/* Chroma Distribution Preview */}
                      <div className="mt-2 mb-3">
                        <div className="flex h-4 w-full rounded-sm overflow-hidden">
                          {Array.from({ length: 20 }).map((_, i) => {
                            // Calculate chroma based on preset
                            let chroma;
                            const normalizedIndex = i / 19; // 0 to 1
                            const range = chromaRange[1] - chromaRange[0];
                            const lightness = lightnessRange[0] + (normalizedIndex * (lightnessRange[1] - lightnessRange[0]));
                            const normalizedLightness = (lightness - lightnessRange[0]) / (lightnessRange[1] - lightnessRange[0]);
                            
                            switch (chromaPreset) {
                              case 'constant':
                                chroma = 0.2; // Default chroma for preview
                                break;
                              case 'decrease':
                                chroma = chromaRange[1] - (normalizedLightness * range);
                                break;
                              case 'increase':
                                chroma = chromaRange[0] + (normalizedLightness * range);
                                break;
                              default:
                                chroma = chromaRange[0] + (normalizedIndex * range);
                            }
                            
                            return (
                              <div 
                                key={i} 
                                className="flex-1 h-full" 
                                style={{ backgroundColor: `oklch(50% ${chroma} 20)` }}
                              />
                            );
                          })}
                        </div>
                        <div className="flex justify-between mt-1">
                          <span className="text-xs text-muted-foreground">{Math.round(chromaRange[0] * 100)}%</span>
                          <span className="text-xs text-muted-foreground">{Math.round(chromaRange[1] * 100)}%</span>
                        </div>
                      </div>
                      
                      {chromaPreset === 'custom' && (
                        <div className="mt-2">
                          <Label className="text-xs mb-1 block">Chroma Range:</Label>
                          <div className="flex items-center gap-2">
                            <Slider
                              defaultValue={[chromaRange[0] * 100, chromaRange[1] * 100]}
                              max={40}
                              step={1}
                              onValueChange={(values) => setChromaRange([values[0] / 100, values[1] / 100])}
                              className="flex-1"
                            />
                            <div className="text-xs text-muted-foreground">
                              {Math.round(chromaRange[0] * 100)}% - {Math.round(chromaRange[1] * 100)}%
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Color Scale Preview */}
                    <div className="mt-4 pt-3 border-t">
                      <Label className="text-xs mb-2 block">Preview Scale ({numSteps} Steps):</Label>
                      <div className="flex h-6 w-full rounded-sm overflow-hidden">
                        {Array.from({ length: numSteps }).map((_, i) => {
                          // Create a preview of the color scale based on current settings
                          const normalizedIndex = i / (numSteps - 1); // 0 to 1
                          
                          // Calculate lightness based on preset
                          let l;
                          const lightnessRange = [0.05, 0.95];
                          const lightnessRange_diff = lightnessRange[1] - lightnessRange[0];
                          
                          switch (lightnessPreset) {
                            case 'linear':
                              l = lightnessRange[0] + (normalizedIndex * lightnessRange_diff);
                              break;
                            case 'curved':
                              if (normalizedIndex < 0.5) {
                                l = lightnessRange[0] + (4 * normalizedIndex * normalizedIndex * normalizedIndex * lightnessRange_diff / 2);
                              } else {
                                l = lightnessRange[0] + (1 - Math.pow(-2 * normalizedIndex + 2, 3) / 2 + 1) * lightnessRange_diff / 2;
                              }
                              break;
                            default:
                              l = lightnessRange[0] + (normalizedIndex * lightnessRange_diff);
                          }
                          
                          // Calculate chroma based on preset
                          let c = 0.2; // Default value
                          const normalizedLightness = (l - lightnessRange[0]) / lightnessRange_diff;
                          const chromaRange_diff = chromaRange[1] - chromaRange[0];
                          
                          switch (chromaPreset) {
                            case 'constant':
                              c = 0.2; // Default for preview
                              break;
                            case 'decrease':
                              c = chromaRange[1] - (normalizedLightness * chromaRange_diff);
                              break;
                            case 'increase':
                              c = chromaRange[0] + (normalizedLightness * chromaRange_diff);
                              break;
                            case 'custom':
                              c = chromaRange[0] + (normalizedIndex * chromaRange_diff);
                              break;
                          }
                          
                          const h = 250; // Default hue for preview
                          const backgroundColor = useLightness 
                            ? `oklch(${l * 100}% ${c} ${h})` 
                            : `oklch(50% ${c} ${h})`;
                          
                          return (
                            <div 
                              key={i} 
                              className="flex-1 h-full" 
                              style={{ backgroundColor }}
                            />
                          );
                        })}
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-xs text-muted-foreground">1</span>
                        <span className="text-xs text-muted-foreground">{numSteps}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex flex-col gap-2">
              <Input 
                placeholder="New palette name" 
                value={newPaletteName} 
                onChange={(e) => setNewPaletteName(e.target.value)}
                className="w-48 h-8"
              />
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleCreatePalette(activeTab === 'core')}
                disabled={!newPaletteName || !currentBrand}
                className="h-8"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Palette
              </Button>
            </div>
          </div>
        </div>
        
        <TabsContent value="core" className="space-y-6">
          {corePalettes.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No core palettes found. Create your first palette.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-8">
              {corePalettes.map(palette => (
                <PaletteCard 
                  key={palette.id}
                  palette={palette}
                  isEditing={editingPalette === palette.id}
                  onEdit={() => setEditingPalette(palette.id)}
                  onCancelEdit={() => setEditingPalette(null)}
                  onUpdate={(updates) => {
                    handleUpdatePalette(palette, updates)
                    setEditingPalette(null)
                  }}
                  onDelete={() => handleDeletePalette(palette.id)}
                  onColorChange={(stepId, color) => handleColorChange(palette, stepId, color)}
                  onSelect={() => setCurrentPalette(palette.id)}
                  isSelected={currentPaletteId === palette.id}
                  onAddColorStep={handleAddColorStep}
                />
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="accent" className="space-y-6">
          {accentPalettes.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No accent palettes found. Create your first accent palette.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-8">
              {accentPalettes.map(palette => (
                <PaletteCard 
                  key={palette.id}
                  palette={palette}
                  isEditing={editingPalette === palette.id}
                  onEdit={() => setEditingPalette(palette.id)}
                  onCancelEdit={() => setEditingPalette(null)}
                  onUpdate={(updates) => {
                    handleUpdatePalette(palette, updates)
                    setEditingPalette(null)
                  }}
                  onDelete={() => handleDeletePalette(palette.id)}
                  onColorChange={(stepId, color) => handleColorChange(palette, stepId, color)}
                  onSelect={() => setCurrentPalette(palette.id)}
                  isSelected={currentPaletteId === palette.id}
                  onAddColorStep={handleAddColorStep}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      {currentPalette && (
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Color Accessibility Analysis</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Contrast Ratios</CardTitle>
                <CardDescription>WCAG compliance for each color in the palette</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {currentPalette.steps.map(step => (
                    <div key={step.id} className="flex items-center gap-4 p-2 rounded hover:bg-muted/50">
                      <div 
                        className="w-8 h-8 rounded" 
                        style={{ backgroundColor: step.values.hex }}
                      />
                      <div className="flex-1">
                        <p className="font-medium">{step.name}</p>
                        <div className="text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-white border border-gray-200 rounded"></div>
                            <p className={cn(
                              step.accessibility.contrastWithWhite >= 4.5 ? "text-green-600" : "text-red-600"
                            )}>
                              {step.accessibility.contrastWithWhite.toFixed(2)}:1
                              {step.accessibility.contrastWithWhite >= 4.5 && " ✓ AA"}
                              {step.accessibility.contrastWithWhite >= 7 && " ✓ AAA"}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="w-4 h-4 bg-black rounded"></div>
                            <p className={cn(
                              step.accessibility.contrastWithBlack >= 4.5 ? "text-green-600" : "text-red-600"
                            )}>
                              {step.accessibility.contrastWithBlack.toFixed(2)}:1
                              {step.accessibility.contrastWithBlack >= 4.5 && " ✓ AA"}
                              {step.accessibility.contrastWithBlack >= 7 && " ✓ AAA"}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-right">
                        <div className={cn(
                          "font-medium",
                          (step.accessibility.wcagAANormal) ? "text-green-600" : "text-red-600"
                        )}>
                          {step.accessibility.wcagAANormal ? "Passes AA" : "Fails AA"}
                        </div>
                        <div className={cn(
                          "font-medium",
                          (step.accessibility.wcagAAA) ? "text-green-600" : "text-red-600"
                        )}>
                          {step.accessibility.wcagAAA ? "Passes AAA" : "Fails AAA"}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Color Formats</CardTitle>
                <CardDescription>View and copy color values in different formats</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Format</Label>
                      <Select value={selectedFormat} onValueChange={(value) => setSelectedFormat(value as ColorFormat)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select format" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hex">HEX</SelectItem>
                          <SelectItem value="rgb">RGB</SelectItem>
                          <SelectItem value="oklch">OKLCH</SelectItem>
                          <SelectItem value="cmyk">CMYK</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Base Color</Label>
                      <div className="flex items-center mt-2 gap-2">
                        <div 
                          className="w-6 h-6 rounded" 
                          style={{ backgroundColor: currentPalette.baseColor?.hex || '#808080' }}
                        />
                        <code className="text-sm bg-muted p-1 rounded">
                          {currentPalette.baseColor?.[selectedFormat] || 'N/A'}
                        </code>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6"
                          onClick={() => {
                            navigator.clipboard.writeText(currentPalette.baseColor?.[selectedFormat] || '');
                          }}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <Label className="mb-2 block">Palette Colors</Label>
                    <div className="grid grid-cols-1 gap-2">
                      {currentPalette.steps.map(step => (
                        <div key={step.id} className="flex items-center gap-2 p-2 rounded border">
                          <div 
                            className="w-6 h-6 rounded" 
                            style={{ backgroundColor: step.values?.hex || '#808080' }}
                          />
                          <div className="flex-1">
                            <div className="font-medium">{step.name}</div>
                            <code className="text-xs bg-muted p-1 rounded">
                              {step.values?.[selectedFormat] || 'N/A'}
                            </code>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6"
                            onClick={() => {
                              navigator.clipboard.writeText(step.values?.[selectedFormat] || '');
                            }}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}

interface PaletteCardProps {
  palette: ColorPalette
  isEditing: boolean
  isSelected: boolean
  onEdit: () => void
  onCancelEdit: () => void
  onUpdate: (updates: Partial<ColorPalette>) => void
  onDelete: () => void
  onColorChange: (stepId: string, color: string) => void
  onSelect: () => void
  onAddColorStep: (paletteId: string) => void
}

function PaletteCard({ 
  palette, 
  isEditing, 
  isSelected, 
  onEdit, 
  onCancelEdit, 
  onUpdate, 
  onDelete, 
  onColorChange,
  onSelect,
  onAddColorStep
}: PaletteCardProps) {
  const [name, setName] = useState(palette.name)
  const [description, setDescription] = useState(palette.description || '')
  
  return (
    <Card className={cn(
      "transition-all",
      isSelected && "ring-2 ring-primary",
      "hover:shadow-md"
    )} onClick={onSelect}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          {isEditing ? (
            <div className="space-y-2 w-full">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Palette name"
                className="font-bold"
              />
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description (optional)"
              />
            </div>
          ) : (
            <div>
              <CardTitle>{palette.name}</CardTitle>
              {palette.description && (
                <CardDescription>{palette.description}</CardDescription>
              )}
            </div>
          )}
          
          <div className="flex gap-1">
            {isEditing ? (
              <>
                <Button variant="ghost" size="icon" onClick={() => {
                  onUpdate({ name, description })
                }}>
                  <Check className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={onCancelEdit}>
                  <X className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="icon" onClick={onEdit}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={(e) => {
                  e.stopPropagation()
                  onDelete()
                }}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-10 gap-1 h-20">
          {palette.steps.map(step => (
            <HoverCard key={step.id}>
              <HoverCardTrigger asChild>
                <div
                  className="relative group h-full flex items-center justify-center rounded overflow-hidden"
                  style={{ backgroundColor: step.values.hex }}
                >
                  <span className={cn(
                    "font-medium text-xs opacity-0 group-hover:opacity-100 transition-opacity",
                    getTextColor(step.values.hex)
                  )}>
                    {step.name}
                  </span>
                  
                  <input
                    type="color"
                    value={step.values.hex}
                    onChange={(e) => onColorChange(step.id, e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </HoverCardTrigger>
              <HoverCardContent className="w-64">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-6 h-6 rounded" 
                      style={{ backgroundColor: step.values.hex }}
                    />
                    <div className="font-semibold">{step.name} - {step.values.hex}</div>
                  </div>
                  
                  <div className="space-y-1.5">
                    <div className="text-sm font-medium">WCAG contrast</div>
                    <div className="flex items-center gap-2">
                      <div className="bg-white text-black px-2 py-1 rounded text-xs">Aa</div>
                      <div className="font-mono font-bold">
                        {step.accessibility?.contrastWithWhite?.toFixed(2) || '1.00'}:1
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="text-xs">Large text</div>
                        <div className={cn(
                          "text-xs px-1 rounded",
                          (step.accessibility?.contrastWithWhite >= 3) ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                        )}>
                          {(step.accessibility?.contrastWithWhite >= 3) ? "AA" : "Fail"}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <div className="text-xs">Small text</div>
                        <div className={cn(
                          "text-xs px-1 rounded",
                          (step.accessibility?.contrastWithWhite >= 4.5) ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                        )}>
                          {(step.accessibility?.contrastWithWhite >= 4.5) ? "AA" : "Fail"}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <div className="text-xs">Graphics</div>
                        <div className={cn(
                          "text-xs px-1 rounded",
                          (step.accessibility?.contrastWithWhite >= 3) ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                        )}>
                          {(step.accessibility?.contrastWithWhite >= 3) ? "AA" : "Fail"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </HoverCardContent>
            </HoverCard>
          ))}
          <Button 
            variant="outline" 
            className="h-full flex items-center justify-center rounded border-dashed"
            onClick={() => onAddColorStep(palette.id)}
          >
            <PlusCircle className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="grid grid-cols-10 gap-1 mt-1">
          {palette.steps.map(step => (
            <div key={step.id} className="text-center">
              <span className="text-xs text-muted-foreground">{step.name}</span>
            </div>
          ))}
          <div className="text-center">
            <span className="text-xs text-muted-foreground">Add</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between pt-2">
        <div className="text-sm text-muted-foreground">
          {palette.steps.length} colors
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Base: </span>
          <div 
            className="w-5 h-5 rounded-full" 
            style={{ backgroundColor: palette.baseColor.hex }}
          />
          <code className="text-xs bg-muted p-1 rounded">
            {palette.baseColor.hex}
          </code>
        </div>
      </CardFooter>
    </Card>
  )
}
