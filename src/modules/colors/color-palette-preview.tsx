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
import { 
  convertToAllFormats, 
  generatePalette as generateColorPalette,
  getLuminance, 
  calculateContrast
} from '@/lib/color-utils'

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
  const { 
    palettes, 
    currentPaletteId, 
    setCurrentPalette, 
    createPalette, 
    updatePalette, 
    deletePalette, 
    addColorStep, 
    updateColorStep, 
    deleteColorStep, 
    generatePalette,
    convertColor,
    paletteConfig
  } = useColorStore()
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
  
  // Add state for preview colors
  const [previewColors, setPreviewColors] = useState<string[]>([])
  
  // Function to calculate preview colors based on current settings
  const updatePreviewColors = () => {
    if (!currentPalette) return;
    
    const colors: string[] = [];
    // Always use the current palette's base color
    const baseColorHex = currentPalette.baseColor?.hex || '#3264C8';
    
    // Parse the base color to get its components
    try {
      const baseColorObj = convertToAllFormats(baseColorHex);
      
      // Extract the hue from the base color's OKLCH value
      const oklchMatch = baseColorObj.oklch.match(/oklch\((\d+)%\s+([\d.]+)\s+([\d.]+)\)/);
      const baseHue = oklchMatch ? parseFloat(oklchMatch[3]) : 250; // Default to 250 if parsing fails
      
      for (let i = 0; i < paletteConfig.numSteps; i++) {
        const normalizedIndex = i / (paletteConfig.numSteps - 1); // 0 to 1
        
        // Calculate lightness based on preset
        let l;
        const lightnessRange_diff = paletteConfig.lightnessRange[1] - paletteConfig.lightnessRange[0];
        
        switch (paletteConfig.lightnessPreset) {
          case 'linear':
            l = paletteConfig.lightnessRange[0] + (normalizedIndex * lightnessRange_diff);
            break;
          case 'curved':
            if (normalizedIndex < 0.5) {
              l = paletteConfig.lightnessRange[0] + (4 * normalizedIndex * normalizedIndex * normalizedIndex * lightnessRange_diff / 2);
            } else {
              l = paletteConfig.lightnessRange[0] + (1 - Math.pow(-2 * normalizedIndex + 2, 3) / 2 + 1) * lightnessRange_diff / 2;
            }
            break;
          default:
            l = paletteConfig.lightnessRange[0] + (normalizedIndex * lightnessRange_diff);
        }
        
        // Calculate chroma based on preset
        let c = 0.2; // Default value
        const normalizedLightness = (l - paletteConfig.lightnessRange[0]) / lightnessRange_diff;
        const chromaRange_diff = paletteConfig.chromaRange[1] - paletteConfig.chromaRange[0];
        
        switch (paletteConfig.chromaPreset) {
          case 'constant':
            c = paletteConfig.chromaRange[1]; // Use the max value for constant
            break;
          case 'decrease':
            c = paletteConfig.chromaRange[1] - (normalizedLightness * chromaRange_diff);
            break;
          case 'increase':
            c = paletteConfig.chromaRange[0] + (normalizedLightness * chromaRange_diff);
            break;
          case 'custom':
            c = paletteConfig.chromaRange[0] + (normalizedIndex * chromaRange_diff);
            break;
        }
        
        // Use the base color's hue
        const h = baseHue;
        
        // Apply hue shift if specified
        const finalHue = paletteConfig.hueShift ? 
          (h + paletteConfig.hueShift + 360) % 360 : h;
        
        const backgroundColor = paletteConfig.useLightness 
          ? `oklch(${Math.round(l * 100)}% ${c.toFixed(2)} ${finalHue})` 
          : `oklch(50% ${c.toFixed(2)} ${finalHue})`;
        
        colors.push(backgroundColor);
      }
      
      setPreviewColors(colors);
    } catch (error) {
      console.error('Error updating preview colors:', error);
    }
  };
  
  // Update preview colors when configuration changes
  useEffect(() => {
    updatePreviewColors();
  }, [
    paletteConfig.numSteps, 
    paletteConfig.useLightness, 
    paletteConfig.lightnessRange, 
    paletteConfig.chromaRange, 
    paletteConfig.lightnessPreset, 
    paletteConfig.chromaPreset,
    currentPalette?.baseColor?.hex
  ]);
  
  // Add this effect to listen for palette creation events - MOVED UP HERE
  useEffect(() => {
    const handlePaletteCreated = () => {
      updatePreviewColors();
    };
    
    window.addEventListener('paletteCreated', handlePaletteCreated);
    
    return () => {
      window.removeEventListener('paletteCreated', handlePaletteCreated);
    };
  }, []);
  
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
      const generatedSteps = generateColorPalette(defaultBaseColor, numSteps, useLightness, {
        lightnessPreset: paletteOptions.lightnessPreset,
        chromaPreset: paletteOptions.chromaPreset,
        lightnessRange: paletteOptions.lightnessRange as [number, number],
        chromaRange: paletteOptions.chromaRange as [number, number]
      });
      
      // Add required accessibility property to each step
      const stepsWithAccessibility = generatedSteps.map(step => ({
        ...step,
        accessibility: step.accessibility || {
          contrastWithWhite: 0,
          contrastWithBlack: 0,
          wcagAANormal: false,
          wcagAALarge: false,
          wcagAAA: false
        }
      }));
      
      // Create the palette in the store
      await createPalette(currentBrand.id, {
        name: "Primary",
        description: "Primary brand color palette",
        baseColor: defaultBaseColor,
        steps: stepsWithAccessibility as any,
        isCore: true,
        brandId: currentBrand.id
      });
      
      // Set the current palette to the first one in the list
      const palettes = useColorStore.getState().palettes;
      if (palettes.length > 0) {
        setCurrentPalette(palettes[0].id);
      }
      
      return true;
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
      const generatedSteps = generateColorPalette(defaultBaseColor, numSteps, useLightness, {
        lightnessPreset: paletteOptions.lightnessPreset,
        chromaPreset: paletteOptions.chromaPreset,
        lightnessRange: paletteOptions.lightnessRange as [number, number],
        chromaRange: paletteOptions.chromaRange as [number, number]
      });
      
      // Add required accessibility property to each step
      const stepsWithAccessibility = generatedSteps.map(step => ({
        ...step,
        accessibility: step.accessibility || {
          contrastWithWhite: 0,
          contrastWithBlack: 0,
          wcagAANormal: false,
          wcagAALarge: false,
          wcagAAA: false
        }
      }));
      
      // Create a local-only palette
      const localPalette = {
        id: `local-${Date.now()}`,
        name: "Primary",
        description: "Primary brand color palette (local only)",
        baseColor: defaultBaseColor,
        steps: stepsWithAccessibility,
        isCore: true,
        brandId: currentBrand.id
      };
      
      // Manually update the store state
      useColorStore.setState(state => ({
        palettes: [...state.palettes, localPalette],
        currentPaletteId: localPalette.id
      }));
      
      return false;
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
      const generatedSteps = generateColorPalette(defaultBaseColor, numSteps, useLightness, {
        lightnessPreset: paletteOptions.lightnessPreset,
        chromaPreset: paletteOptions.chromaPreset,
        lightnessRange: paletteOptions.lightnessRange as [number, number],
        chromaRange: paletteOptions.chromaRange as [number, number]
      });
      console.log('Generated steps:', generatedSteps);
      
      // Add required accessibility property to each step
      const stepsWithAccessibility = generatedSteps.map(step => ({
        ...step,
        accessibility: step.accessibility || {
          contrastWithWhite: 0,
          contrastWithBlack: 0,
          wcagAANormal: false,
          wcagAALarge: false,
          wcagAAA: false
        }
      }));
      
      // Create the palette in the store (which will handle both local state and Supabase)
      await createPalette(currentBrand.id, {
        name: newPaletteName,
        description: `${newPaletteName} color palette`,
        baseColor: defaultBaseColor,
        steps: stepsWithAccessibility as any,
        isCore,
        brandId: currentBrand.id
      });
      
      console.log('New palette created');
      setNewPaletteName('');
      
      // Set the current palette to the first one in the list
      const palettes = useColorStore.getState().palettes;
      if (palettes.length > 0) {
        setCurrentPalette(palettes[0].id);
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
      const generatedSteps = generateColorPalette(defaultBaseColor, numSteps, useLightness, {
        lightnessPreset: paletteOptions.lightnessPreset,
        chromaPreset: paletteOptions.chromaPreset,
        lightnessRange: paletteOptions.lightnessRange as [number, number],
        chromaRange: paletteOptions.chromaRange as [number, number]
      });
      
      // Add required accessibility property to each step
      const stepsWithAccessibility = generatedSteps.map(step => ({
        ...step,
        accessibility: step.accessibility || {
          contrastWithWhite: 0,
          contrastWithBlack: 0,
          wcagAANormal: false,
          wcagAALarge: false,
          wcagAAA: false
        }
      }));
      
      // Add the palette to the local state only
      const localPalette = {
        id: `local-${Date.now()}`,
        name: newPaletteName,
        description: `${newPaletteName} color palette (local only)`,
        baseColor: defaultBaseColor,
        steps: stepsWithAccessibility,
        isCore,
        brandId: currentBrand.id
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
    const updatedValues = convertToAllFormats(colorHex);
    
    await updateColorStep(palette.id, stepId, {
      values: updatedValues
    });
  };
  
  const handleAddColorStep = async (paletteId: string) => {
    try {
      // Create a default color (light gray)
      const defaultColor = convertToAllFormats('#E0E0E0');
      
      // Add the color step to the palette
      await addColorStep(paletteId, {
        name: `New Step`,
        values: defaultColor,
        accessibility: {
          contrastWithWhite: 0,
          contrastWithBlack: 0,
          wcagAANormal: false,
          wcagAALarge: false,
          wcagAAA: false
        }
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

  // Handle deleting a color step
  const handleDeleteColorStep = async (paletteId: string, stepId: string) => {
    try {
      await deleteColorStep(paletteId, stepId);
      console.log('Color step deleted successfully');
    } catch (error) {
      console.error('Error deleting color step:', error);
    }
  };

  return (
    <div className="space-y-8">
      <div dir="ltr" data-orientation="horizontal">
        <Tabs defaultValue="palettes" className="space-y-4">
          <TabsList>
            <TabsTrigger value="palettes">Palettes</TabsTrigger>
            <TabsTrigger value="formats">Color Formats</TabsTrigger>
            <TabsTrigger value="accessibility">Accessibility</TabsTrigger>
          </TabsList>
          
          {/* Color Palettes Tab Content */}
          <TabsContent value="palettes" className="space-y-6">
            {/* Preview Scale based on current configuration */}
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-2">Preview Scale ({paletteConfig.numSteps} Steps)</h3>
              <div className="flex h-12 w-full rounded-md overflow-hidden">
                {previewColors.map((color, index) => (
                  <div
                    key={index}
                    className="flex-1 h-full"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-xs text-muted-foreground">1</span>
                <span className="text-xs text-muted-foreground">{paletteConfig.numSteps}</span>
              </div>
            </div>
            
            <Tabs defaultValue="core" value={activeTab} onValueChange={setActiveTab}>
              <div className="flex justify-between items-center mb-4">
                <TabsList>
                  <TabsTrigger value="core">Core Palettes</TabsTrigger>
                  <TabsTrigger value="accent">Accent Palettes</TabsTrigger>
                </TabsList>
              </div>
              
              <TabsContent value="core" className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  {corePalettes.map(palette => (
                    <PaletteCard
                      key={palette.id}
                      palette={palette}
                      isSelected={palette.id === currentPaletteId}
                      isEditing={editingPalette === palette.id}
                      onSelect={() => setCurrentPalette(palette.id)}
                      onEdit={() => setEditingPalette(palette.id)}
                      onCancelEdit={() => setEditingPalette(null)}
                      onUpdate={(updates) => handleUpdatePalette(palette, updates)}
                      onDelete={() => handleDeletePalette(palette.id)}
                      onColorChange={(stepId, newColor) => handleColorChange(palette, stepId, newColor)}
                      onAddColorStep={() => handleAddColorStep(palette.id)}
                      onDeleteStep={(stepId) => handleDeleteColorStep(palette.id, stepId)}
                    />
                  ))}
                  {/* Add palette button */}
                  <Button 
                    variant="outline" 
                    className="w-full h-24 flex items-center justify-center rounded border-dashed"
                    onClick={() => setActiveTab('create')}
                  >
                    <Plus className="h-4 w-4 mr-2" /> Add Core Palette
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="accent" className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  {accentPalettes.map(palette => (
                    <PaletteCard
                      key={palette.id}
                      palette={palette}
                      isSelected={palette.id === currentPaletteId}
                      isEditing={editingPalette === palette.id}
                      onSelect={() => setCurrentPalette(palette.id)}
                      onEdit={() => setEditingPalette(palette.id)}
                      onCancelEdit={() => setEditingPalette(null)}
                      onUpdate={(updates) => handleUpdatePalette(palette, updates)}
                      onDelete={() => handleDeletePalette(palette.id)}
                      onColorChange={(stepId, newColor) => handleColorChange(palette, stepId, newColor)}
                      onAddColorStep={() => handleAddColorStep(palette.id)}
                      onDeleteStep={(stepId) => handleDeleteColorStep(palette.id, stepId)}
                    />
                  ))}
                  {/* Add palette button */}
                  <Button 
                    variant="outline" 
                    className="w-full h-24 flex items-center justify-center rounded border-dashed"
                    onClick={() => setActiveTab('create')}
                  >
                    <Plus className="h-4 w-4 mr-2" /> Add Accent Palette
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </TabsContent>
          
          {/* Color Formats Tab Content */}
          <TabsContent value="formats">
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
              <div className="flex flex-col space-y-1.5 p-6">
                <h3 className="text-2xl font-semibold leading-none tracking-tight">Color Formats</h3>
                <p className="text-sm text-muted-foreground">View and copy color values in different formats</p>
              </div>
              <div className="p-6 pt-0">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium leading-none">Format</Label>
                      <Select value={selectedFormat} onValueChange={(value) => setSelectedFormat(value as ColorFormat)}>
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hex">HEX</SelectItem>
                          <SelectItem value="rgb">RGB</SelectItem>
                          <SelectItem value="oklch">OKLCH</SelectItem>
                          <SelectItem value="cmyk">CMYK</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {currentPalette && (
                      <div>
                        <Label className="text-sm font-medium leading-none">Base Color</Label>
                        <div className="flex items-center mt-2 gap-2">
                          <div className="w-6 h-6 rounded" style={{ backgroundColor: currentPalette.baseColor.hex }}></div>
                          <code className="text-sm bg-muted p-1 rounded">{currentPalette.baseColor[selectedFormat] || currentPalette.baseColor.hex}</code>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => navigator.clipboard.writeText(currentPalette.baseColor[selectedFormat] || currentPalette.baseColor.hex)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {currentPalette && (
                    <div className="mt-4">
                      <Label className="text-sm font-medium leading-none mb-2 block">Palette Colors</Label>
                      <div className="grid grid-cols-1 gap-2">
                        {currentPalette.steps.map(step => (
                          <div key={step.id} className="flex items-center gap-2 p-2 rounded border">
                            <div className="w-6 h-6 rounded" style={{ backgroundColor: step.values.hex }}></div>
                            <div className="flex-1">
                              <div className="font-medium">{step.name}</div>
                              <code className="text-xs bg-muted p-1 rounded">{step.values[selectedFormat] || step.values.hex}</code>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => navigator.clipboard.writeText(step.values[selectedFormat] || step.values.hex)}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
          
          {/* Accessibility Tab Content */}
          <TabsContent value="accessibility">
            <h2 className="text-2xl font-bold mb-4">Color Accessibility Analysis</h2>
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
              <div className="flex flex-col space-y-1.5 p-6">
                <h3 className="text-2xl font-semibold leading-none tracking-tight">Contrast Ratios</h3>
                <p className="text-sm text-muted-foreground">WCAG compliance for each color in the palette</p>
              </div>
              <div className="p-6 pt-0">
                <div className="space-y-4">
                  {currentPalette?.steps.map(step => (
                    <div key={step.id} className="flex items-center gap-4 p-2 rounded hover:bg-muted/50">
                      <div className="w-8 h-8 rounded" style={{ backgroundColor: step.values.hex }}></div>
                      <div className="flex-1">
                        <p className="font-medium">{step.name}</p>
                        <div className="text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-white border border-gray-200 rounded"></div>
                            <p className={step.accessibility?.contrastWithWhite >= 4.5 ? "text-green-600" : "text-red-600"}>
                              {step.accessibility?.contrastWithWhite.toFixed(2)}:1
                              {step.accessibility?.contrastWithWhite >= 4.5 && " ✓ AA"}
                              {step.accessibility?.contrastWithWhite >= 7 && " ✓ AAA"}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="w-4 h-4 bg-black rounded"></div>
                            <p className={step.accessibility?.contrastWithBlack >= 4.5 ? "text-green-600" : "text-red-600"}>
                              {step.accessibility?.contrastWithBlack.toFixed(2)}:1
                              {step.accessibility?.contrastWithBlack >= 4.5 && " ✓ AA"}
                              {step.accessibility?.contrastWithBlack >= 7 && " ✓ AAA"}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-right">
                        <div className="font-medium text-green-600">
                          {step.accessibility?.wcagAANormal ? "Passes AA" : ""}
                        </div>
                        <div className="font-medium text-green-600">
                          {step.accessibility?.wcagAAA ? "Passes AAA" : ""}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

interface PaletteCardProps {
  palette: ColorPalette
  isSelected: boolean
  isEditing: boolean
  onSelect: () => void
  onEdit: () => void
  onCancelEdit: () => void
  onUpdate: (updates: Partial<ColorPalette>) => void
  onDelete: () => void
  onColorChange: (stepId: string, newColor: string) => void
  onAddColorStep: () => void
  onDeleteStep: (stepId: string) => void
}

function PaletteCard({ 
  palette, 
  isSelected, 
  isEditing, 
  onSelect, 
  onEdit, 
  onCancelEdit, 
  onUpdate, 
  onDelete, 
  onColorChange,
  onAddColorStep,
  onDeleteStep
}: PaletteCardProps) {
  const [name, setName] = useState(palette.name)
  const [description, setDescription] = useState(palette.description || '')
  const [selectedFormat, setSelectedFormat] = useState<ColorFormat>('hex')
  const [editingStep, setEditingStep] = useState<string | null>(null)
  const [editingColor, setEditingColor] = useState('')
  
  useEffect(() => {
    setName(palette.name)
    setDescription(palette.description || '')
  }, [palette, isEditing])
  
  // Handle color edit submission
  const handleColorEditSubmit = (stepId: string) => {
    onColorChange(stepId, editingColor);
    setEditingStep(null);
    setEditingColor('');
  }
  
  return (
    <Card 
      className={cn(
        "transition-all ring-2 hover:shadow-md",
        isSelected ? "ring-primary" : "ring-transparent"
      )}
      onClick={() => onSelect()}
    >
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          {isEditing ? (
            <div className="space-y-2 w-full">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Palette name"
                className="font-semibold text-lg"
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
        {/* Format selector */}
        <div className="mb-4 flex justify-between items-center">
          <Select value={selectedFormat} onValueChange={(value: ColorFormat) => setSelectedFormat(value)}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Format" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hex">HEX</SelectItem>
              <SelectItem value="rgb">RGB</SelectItem>
              <SelectItem value="oklch">OKLCH</SelectItem>
            </SelectContent>
          </Select>
          
          <Button 
            variant="outline" 
            size="sm"
            className="flex items-center justify-center rounded border-dashed"
            onClick={(e) => {
              e.stopPropagation();
              onAddColorStep();
            }}
          >
            <PlusCircle className="h-4 w-4 mr-1" /> Add Color
          </Button>
        </div>
        
        {/* Base color */}
        <div className="flex items-center gap-2 p-2 rounded bg-muted/50 mb-3">
          <div className="font-medium text-sm w-12">Base</div>
          <div 
            className="w-8 h-8 rounded-md" 
            style={{ backgroundColor: palette.baseColor.hex }}
          />
          <code className="flex-1 text-xs bg-background p-1 rounded">
            {palette.baseColor[selectedFormat] || palette.baseColor.hex}
          </code>
          <Button variant="ghost" size="icon" onClick={(e) => {
            e.stopPropagation();
            navigator.clipboard.writeText(palette.baseColor[selectedFormat] || palette.baseColor.hex);
          }}>
            <Copy className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Color steps - horizontal layout */}
        <div className="overflow-x-auto pb-2">
          <div className="flex gap-2 min-w-max">
            {palette.steps.map(step => (
              <div 
                key={step.id} 
                className={cn(
                  "w-32 border rounded-md p-2 hover:bg-muted/50",
                  step.isBaseColor && "ring-2 ring-primary"
                )}
              >
                {editingStep === step.id ? (
                  <div className="space-y-2">
                    <Input 
                      value={editingColor}
                      onChange={(e) => setEditingColor(e.target.value)}
                      className="w-full"
                    />
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" className="w-full" onClick={() => handleColorEditSubmit(step.id)}>
                        <Check className="h-3 w-3 mr-1" /> Save
                      </Button>
                      <Button size="sm" variant="ghost" className="w-full" onClick={() => setEditingStep(null)}>
                        <X className="h-3 w-3 mr-1" /> Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-center mb-1">
                      <div className="font-medium text-sm flex items-center gap-1">
                        {step.name}
                        {step.isBaseColor && (
                          <span className="text-xs bg-primary text-primary-foreground px-1 rounded">Base</span>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => {
                          e.stopPropagation();
                          setEditingStep(step.id);
                          setEditingColor(step.values.hex);
                        }}>
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Delete color step "${step.name}"?`)) {
                            onDeleteStep(step.id);
                          }
                        }}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div 
                      className="w-full h-12 rounded-md mb-1" 
                      style={{ backgroundColor: step.values.hex }}
                    />
                    <div className="flex items-center gap-1">
                      <code className="flex-1 text-xs bg-background p-1 rounded overflow-hidden text-ellipsis">
                        {step.values[selectedFormat] || step.values.hex}
                      </code>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => {
                        e.stopPropagation();
                        navigator.clipboard.writeText(step.values[selectedFormat] || step.values.hex);
                      }}>
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ))}
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
