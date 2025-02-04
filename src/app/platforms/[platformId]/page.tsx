'use client'

import { useLayout } from "@/contexts/layout-context"
import { Button } from "@/components/ui/button"
import { Maximize2, Minimize2, Pencil } from 'lucide-react'
import { cn } from "@/lib/utils"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AnimatedTabs } from "@/components/ui/animated-tabs"
import { usePlatformStore, Platform } from "@/store/platform-store"
import { useRouter } from "next/navigation"

export default function PlatformPage({ params }: { params: { platformId: string } }) {
  const { isFullscreen, setIsFullscreen } = useLayout()
  const router = useRouter()
  const [isEditingName, setIsEditingName] = useState(false)
  const [platformName, setPlatformName] = useState('')
  const [activeMainTab, setActiveMainTab] = useState('overview')

  const { platforms, updatePlatform } = usePlatformStore()
  const platform = platforms.find(p => p.id === params.platformId)

  const mainTabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'units', label: 'Units' },
    { id: 'size-layout', label: 'Size & Layout' },
  ]

  useEffect(() => {
    if (platform) {
      setPlatformName(platform.name)
    }
  }, [platform])

  const handleNameSave = () => {
    if (platformName.trim() && platform) {
      updatePlatform(platform.id, { name: platformName })
      setIsEditingName(false)
    }
  }

  if (!platform) {
    router.push('/platforms')
    return null
  }

  const handleUpdateUnits = (key: keyof Platform['units'], value: string) => {
    if (platform) {
      updatePlatform(platform.id, {
        units: { ...platform.units, [key]: value }
      })
    }
  }

  const handleUpdateLayout = (key: keyof Platform['layout'], value: number) => {
    if (platform) {
      updatePlatform(platform.id, {
        layout: { ...platform.layout, [key]: value }
      })
    }
  }

  return (
    <div className={cn(
      "h-full flex transition-all duration-300 ease-in-out",
      isFullscreen && "fixed inset-0 bg-background z-50 overflow-y-auto p-6 max-w-[100vw]"
    )}>
      <div className="flex-1 min-w-0 max-w-full">
        <div className={cn(
          "flex items-center justify-between mb-6",
          isFullscreen ? "" : "pt-6 px-6"
        )}>
          <div className="group relative">
            {isEditingName ? (
              <div className="flex items-center gap-2">
                <Input
                  value={platformName}
                  onChange={(e) => setPlatformName(e.target.value)}
                  className="text-[30px] font-bold h-auto"
                  autoFocus
                  onBlur={handleNameSave}
                  onKeyDown={(e) => e.key === 'Enter' && handleNameSave()}
                />
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h1 className="text-[30px] font-bold">{platform.name}</h1>
                <Button
                  variant="ghost"
                  size="icon"
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => setIsEditingName(true)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="ml-2"
          >
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </Button>
        </div>

        <div className="py-8 px-6 max-w-full overflow-x-hidden">
          <div className="space-y-6">
            <AnimatedTabs 
              tabs={mainTabs}
              defaultTab="overview"
              onChange={setActiveMainTab}
              layoutId="main-tabs"
            />

            {activeMainTab === 'overview' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="p-6">
                  <h3 className="text-sm font-medium text-muted-foreground">Base Size</h3>
                  <p className="text-2xl font-bold mt-2">{platform.layout.baseSize}px</p>
                </Card>
                <Card className="p-6">
                  <h3 className="text-sm font-medium text-muted-foreground">Grid Columns</h3>
                  <p className="text-2xl font-bold mt-2">{platform.layout.gridColumns}</p>
                </Card>
                <Card className="p-6">
                  <h3 className="text-sm font-medium text-muted-foreground">Distance Unit</h3>
                  <p className="text-2xl font-bold mt-2">{platform.units.dimensions}</p>
                </Card>
                <Card className="p-6">
                  <h3 className="text-sm font-medium text-muted-foreground">Typography Unit</h3>
                  <p className="text-2xl font-bold mt-2">{platform.units.typography}</p>
                </Card>
              </div>
            )}

            {activeMainTab === 'units' && (
              <Card>
                <CardHeader>
                  <h3 className="font-semibold">Unit Settings</h3>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label>Typography Units</Label>
                      <Select
                        value={platform.units.typography}
                        onValueChange={(value) => handleUpdateUnits('typography', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select typography unit" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="rem">REM</SelectItem>
                          <SelectItem value="em">EM</SelectItem>
                          <SelectItem value="ch">CH</SelectItem>
                          <SelectItem value="ex">EX</SelectItem>
                          <SelectItem value="vw">VW</SelectItem>
                          <SelectItem value="vh">VH</SelectItem>
                          <SelectItem value="%">Percentage (%)</SelectItem>
                          <SelectItem value="px">Pixels (px)</SelectItem>
                          <SelectItem value="pt">Points (pt)</SelectItem>
                          <SelectItem value="pc">Picas (pc)</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-sm text-muted-foreground">Used for font sizes and text-related measurements</p>
                    </div>

                    <div className="space-y-2">
                      <Label>Spacing Units</Label>
                      <Select
                        value={platform.units.spacing}
                        onValueChange={(value) => handleUpdateUnits('spacing', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select spacing unit" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="rem">REM</SelectItem>
                          <SelectItem value="em">EM</SelectItem>
                          <SelectItem value="vw">VW</SelectItem>
                          <SelectItem value="vh">VH</SelectItem>
                          <SelectItem value="%">Percentage (%)</SelectItem>
                          <SelectItem value="px">Pixels (px)</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-sm text-muted-foreground">Used for margins, padding, and general spacing</p>
                    </div>

                    <div className="space-y-2">
                      <Label>Dimension Units</Label>
                      <Select
                        value={platform.units.dimensions}
                        onValueChange={(value) => handleUpdateUnits('dimensions', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select dimension unit" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="%">Percentage (%)</SelectItem>
                          <SelectItem value="vw">Viewport Width (vw)</SelectItem>
                          <SelectItem value="vh">Viewport Height (vh)</SelectItem>
                          <SelectItem value="px">Pixels (px)</SelectItem>
                          <SelectItem value="cm">Centimeters (cm)</SelectItem>
                          <SelectItem value="mm">Millimeters (mm)</SelectItem>
                          <SelectItem value="in">Inches (in)</SelectItem>
                          <SelectItem value="m">Meters (m)</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-sm text-muted-foreground">Used for widths, heights, and fixed dimensions</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeMainTab === 'size-layout' && (
              <Card>
                <CardHeader>
                  <h3 className="font-semibold">Size & Layout Settings</h3>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Base Size</Label>
                      <Input
                        type="number"
                        value={platform.layout.baseSize}
                        onChange={(e) => handleUpdateLayout('baseSize', parseInt(e.target.value))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Grid Columns</Label>
                      <Input
                        type="number"
                        value={platform.layout.gridColumns}
                        onChange={(e) => handleUpdateLayout('gridColumns', parseInt(e.target.value))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Grid Gutter</Label>
                      <Input
                        type="number"
                        value={platform.layout.gridGutter}
                        onChange={(e) => handleUpdateLayout('gridGutter', parseInt(e.target.value))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Container Padding</Label>
                      <Input
                        type="number"
                        value={platform.layout.containerPadding}
                        onChange={(e) => handleUpdateLayout('containerPadding', parseInt(e.target.value))}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 