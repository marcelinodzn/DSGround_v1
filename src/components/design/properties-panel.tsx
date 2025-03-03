'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useDesignStore } from '@/store/design-store'
import { usePlatformStore } from '@/store/platform-store'
import { ImageUpload } from '@/components/ui/image-upload'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export function PropertiesPanel() {
  const {
    selectedElementId,
    getElement,
    updateElement,
    currentScaleMethod,
    setCurrentScaleMethod,
    selectedLayerStyleId,
    layerStyles,
    setSelectedLayerStyle,
    fetchLayerStyles,
  } = useDesignStore()

  const {
    platforms,
    currentPlatform,
    setCurrentPlatform,
    fetchPlatformsByBrand,
  } = usePlatformStore()

  const [activeBrandId, setActiveBrandId] = useState<string | null>(null)
  const [localProperties, setLocalProperties] = useState<any>({})

  // Initialize with the current element's properties if one is selected
  useEffect(() => {
    if (selectedElementId) {
      const element = getElement(selectedElementId)
      if (element) {
        setLocalProperties(element.properties || {})
      }
    }
  }, [selectedElementId, getElement])

  // Fetch platforms and layer styles when brand changes
  useEffect(() => {
    if (activeBrandId) {
      fetchPlatformsByBrand(activeBrandId)
    }
  }, [activeBrandId, fetchPlatformsByBrand])

  // Fetch layer styles when platform changes
  useEffect(() => {
    if (currentPlatform?.id) {
      fetchLayerStyles(currentPlatform.id)
    }
  }, [currentPlatform?.id, fetchLayerStyles])

  // Handle property change
  const handlePropertyChange = (property: string, value: any) => {
    setLocalProperties((prev: any) => ({
      ...prev,
      [property]: value,
    }))

    // If there's a selected element, update it
    if (selectedElementId) {
      updateElement(selectedElementId, {
        properties: {
          ...localProperties,
          [property]: value,
        },
      }).catch(error => {
        console.error('Error updating element properties:', error)
      })
    }
  }

  // Handle platform change
  const handlePlatformChange = async (platformId: string) => {
    await setCurrentPlatform(platformId)
  }

  // Handle scale method change
  const handleScaleMethodChange = (method: string) => {
    setCurrentScaleMethod(method as any).catch(error => {
      console.error('Error setting scale method:', error)
    })
  }

  // Handle layer style change
  const handleLayerStyleChange = (styleId: string) => {
    setSelectedLayerStyle(styleId)

    // If there's a selected element, update it with the new layer style
    if (selectedElementId) {
      updateElement(selectedElementId, {
        properties: {
          ...localProperties,
          layerStyleId: styleId,
        },
      }).catch(error => {
        console.error('Error updating element layer style:', error)
      })
    }
  }

  return (
    <Card className="w-full max-w-xs">
      <CardHeader>
        <CardTitle>Properties</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Platform Selection */}
        <div className="space-y-2">
          <Label htmlFor="platform">Platform</Label>
          <Select
            value={currentPlatform?.id || ''}
            onValueChange={handlePlatformChange}
          >
            <SelectTrigger id="platform">
              <SelectValue placeholder="Select platform" />
            </SelectTrigger>
            <SelectContent>
              {platforms.map((platform) => (
                <SelectItem key={platform.id} value={platform.id}>
                  {platform.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Tabs defaultValue="styles" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="styles">Styles</TabsTrigger>
            <TabsTrigger value="scale">Scale</TabsTrigger>
            <TabsTrigger value="image">Image</TabsTrigger>
          </TabsList>

          {/* Layer Styles Tab */}
          <TabsContent value="styles" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="layerStyle">Layer Style</Label>
              <Select
                value={selectedLayerStyleId || ''}
                onValueChange={handleLayerStyleChange}
              >
                <SelectTrigger id="layerStyle">
                  <SelectValue placeholder="Select style" />
                </SelectTrigger>
                <SelectContent>
                  {layerStyles.map((style) => (
                    <SelectItem key={style.id} value={style.id}>
                      {style.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Basic style properties */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="opacity" className="text-xs">Opacity</Label>
                <Input
                  id="opacity"
                  type="number"
                  min="0"
                  max="100"
                  value={localProperties.opacity || 100}
                  onChange={(e) => handlePropertyChange('opacity', Number(e.target.value))}
                  className="h-8"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="borderRadius" className="text-xs">Border Radius</Label>
                <Input
                  id="borderRadius"
                  type="number"
                  min="0"
                  value={localProperties.borderRadius || 0}
                  onChange={(e) => handlePropertyChange('borderRadius', Number(e.target.value))}
                  className="h-8"
                />
              </div>
            </div>
          </TabsContent>

          {/* Scale Method Tab */}
          <TabsContent value="scale" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="scaleMethod">Scale Method</Label>
              <Select
                value={currentScaleMethod}
                onValueChange={handleScaleMethodChange}
              >
                <SelectTrigger id="scaleMethod">
                  <SelectValue placeholder="Select scale method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="linear">Linear</SelectItem>
                  <SelectItem value="modular">Modular</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {currentScaleMethod === 'custom' && (
              <div className="space-y-2">
                <Label htmlFor="customScale">Custom Scale</Label>
                <Input
                  id="customScale"
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={localProperties.customScale || 1}
                  onChange={(e) => handlePropertyChange('customScale', Number(e.target.value))}
                />
              </div>
            )}
          </TabsContent>

          {/* Image Upload Tab */}
          <TabsContent value="image" className="space-y-4">
            <ImageUpload />
          </TabsContent>
        </Tabs>

        {selectedElementId && (
          <Button 
            className="w-full" 
            variant="outline"
            onClick={() => {
              // Save all local properties to the element in Supabase
              updateElement(selectedElementId, {
                properties: localProperties,
              }).catch(error => {
                console.error('Error saving properties:', error)
              })
            }}
          >
            Save Properties
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
