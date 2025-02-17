'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { AnimatedTabs } from "@/components/ui/animated-tabs"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { useTypeScale } from "@/contexts/type-scale-context"
import { calculateScale, calculateDistanceBasedSize } from '@/lib/scale-calculations'
import { generatePDF } from '@/lib/generate-pdf'
import { Platform, ScaleValue, TypeStyle } from '@/types/typography'
import { useTypographyStore } from '@/store/typography'
import { usePlatformStore } from "@/store/platform-store"
import { Label } from "@/components/ui/label"

export function DocumentationModal({
  isOpen,
  onClose
}: {
  isOpen: boolean
  onClose: () => void
}) {
  const { platforms } = usePlatformStore()
  const { 
    platforms: typographyPlatforms, 
    getScaleValues 
  } = useTypographyStore()
  
  const [selectedPlatform, setSelectedPlatform] = useState('all')
  const [activeTab, setActiveTab] = useState('overview')
  
  const scaleMethodExplanations = {
    'modular': 'Modular scales use a mathematical ratio to create harmonious size relationships. Each step is multiplied by the ratio, creating exponential growth.',
    'linear': 'Linear scales add a fixed value to each step, creating consistent size increments. This results in more predictable, evenly-spaced type sizes.',
    'custom': 'Custom scales allow you to define specific values for each step, giving you complete control over your typography hierarchy.'
  }

  // Helper function to get typography data for a platform
  const getTypographyData = (platformId: string) => {
    return typographyPlatforms.find(p => p.id === platformId)
  }

  const generateScaleTable = () => {
    if (selectedPlatform === 'all') {
      return null
    }

    const platform = platforms.find(p => p.id === selectedPlatform)
    const typographyData = getTypographyData(selectedPlatform)
    if (!platform || !typographyData) return null

    const scaleValues = getScaleValues(selectedPlatform)
    if (!scaleValues) return null
    
    return (
      <Table>
        <TableCaption>Type Scale Values for {platform.name}</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Step</TableHead>
            <TableHead>Size (px)</TableHead>
            <TableHead>Size (rem)</TableHead>
            <TableHead>Scale Factor</TableHead>
            <TableHead>Type Styles</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {scaleValues.map((value) => {
            const stylesAtScale = typographyData.typeStyles?.filter(
              style => style.scaleStep === value.label
            ) || []
            
            return (
              <TableRow key={value.label}>
                <TableCell>{value.label}</TableCell>
                <TableCell>{value.size}px</TableCell>
                <TableCell>{(value.size / 16).toFixed(3)}rem</TableCell>
                <TableCell>{value.ratio}</TableCell>
                <TableCell>
                  {stylesAtScale.length > 0 
                    ? stylesAtScale.map(style => style.name).join(', ')
                    : '-'
                  }
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    )
  }

  const renderTypeStyleTable = () => {
    if (selectedPlatform === 'all') return null;

    const platform = platforms.find(p => p.id === selectedPlatform);
    const typographyData = getTypographyData(selectedPlatform);
    if (!platform || !typographyData?.typeStyles) return null;

    return (
      <Table>
        <TableCaption>Type Styles for {platform.name}</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead className="text-right">Size</TableHead>
            <TableHead className="text-right">Line Height</TableHead>
            <TableHead className="text-right">Letter Spacing</TableHead>
            <TableHead className="text-right">Weight</TableHead>
            <TableHead>Scale Step</TableHead>
            <TableHead>Optical Size</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {typographyData.typeStyles.map((style) => {
            const scaleValue = getScaleValues(selectedPlatform)
              ?.find(s => s.label === style.scaleStep);

            return (
              <TableRow key={style.id}>
                <TableCell className="font-medium">{style.name}</TableCell>
                <TableCell className="text-right">
                  {scaleValue ? `${Math.round(scaleValue.size)}px` : '-'}
                </TableCell>
                <TableCell className="text-right">{style.lineHeight}</TableCell>
                <TableCell className="text-right">{style.letterSpacing}em</TableCell>
                <TableCell className="text-right">{style.fontWeight}</TableCell>
                <TableCell>{style.scaleStep}</TableCell>
                <TableCell>{style.opticalSize}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    );
  }

  const renderPreviewTable = () => (
    <Table>
      <TableCaption>Typography Preview</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Platform</TableHead>
          <TableHead>Style</TableHead>
          <TableHead>Preview</TableHead>
          <TableHead>Properties</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {platforms
          .filter(platform => selectedPlatform === 'all' || platform.id === selectedPlatform)
          .flatMap(platform => {
            const typographyData = getTypographyData(platform.id)
            if (!typographyData?.typeStyles) return []

            return typographyData.typeStyles.map(style => {
              const scaleValue = getScaleValues(platform.id)
                ?.find(s => s.label === style.scaleStep)

              return (
                <TableRow key={`${platform.id}-${style.id}`}>
                  <TableCell className="font-medium capitalize">{platform.name}</TableCell>
                  <TableCell>{style.name}</TableCell>
                  <TableCell>
                    <span
                      style={{
                        fontSize: scaleValue ? `${Math.round(scaleValue.size)}px` : undefined,
                        lineHeight: style.lineHeight,
                        fontWeight: style.fontWeight,
                        letterSpacing: `${style.letterSpacing}em`,
                      }}
                    >
                      The quick brown fox
                    </span>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div>Scale: {style.scaleStep}</div>
                      <div>Line Height: {style.lineHeight}</div>
                      <div>Weight: {style.fontWeight}</div>
                      <div>Letter Spacing: {style.letterSpacing}em</div>
                      <div>Optical Size: {style.opticalSize}</div>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })
          })}
      </TableBody>
    </Table>
  )

  // Platform comparison table with correct base size calculations
  const PlatformComparison = () => {
    return (
      <Table>
        <TableCaption>Platform Scale Settings</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Platform</TableHead>
            <TableHead>Base Size</TableHead>
            <TableHead>Scale Method</TableHead>
            <TableHead>Ratio</TableHead>
            <TableHead>Steps Up/Down</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {platforms
            .filter(platform => selectedPlatform === 'all' || platform.id === selectedPlatform)
            .map(platform => {
              const typographyData = getTypographyData(platform.id)
              if (!typographyData) return null

              let displayBaseSize = typographyData.scale.baseSize

              // Calculate base size for distance-based platforms
              if (typographyData.scaleMethod === 'distance' && typographyData.distanceScale) {
                displayBaseSize = calculateDistanceBasedSize(
                  typographyData.distanceScale.viewingDistance,
                  typographyData.distanceScale.visualAcuity,
                  typographyData.distanceScale.meanLengthRatio,
                  typographyData.distanceScale.textType,
                  typographyData.distanceScale.lighting,
                  typographyData.distanceScale.ppi
                )
              }

              // For AI method, use the base size directly from scale config
              // For modular method, use the base size from scale config

              return (
                <TableRow key={platform.id}>
                  <TableCell>{platform.name}</TableCell>
                  <TableCell>
                    {typographyData.scaleMethod === 'distance' 
                      ? `${Math.round(displayBaseSize)}px (distance-based)`
                      : `${displayBaseSize}px`
                    }
                  </TableCell>
                  <TableCell>{typographyData.scaleMethod}</TableCell>
                  <TableCell>{typographyData.scale.ratio}</TableCell>
                  <TableCell>{typographyData.scale.stepsUp}/{typographyData.scale.stepsDown}</TableCell>
                </TableRow>
              )
            })}
        </TableBody>
      </Table>
    )
  }

  // All platforms type styles table
  const TypeStylesTable = () => (
    <Table>
      <TableCaption>Type Styles Across Platforms</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Platform</TableHead>
          <TableHead>Style Name</TableHead>
          <TableHead>Size</TableHead>
          <TableHead>Line Height</TableHead>
          <TableHead>Letter Spacing</TableHead>
          <TableHead>Weight</TableHead>
          <TableHead>Scale Step</TableHead>
          <TableHead>Optical Size</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {platforms
          .filter(platform => selectedPlatform === 'all' || platform.id === selectedPlatform)
          .flatMap(platform => {
            const typographyData = getTypographyData(platform.id)
            if (!typographyData?.typeStyles) return []

            return typographyData.typeStyles.map(style => {
              const scaleValue = getScaleValues(platform.id)
                ?.find(s => s.label === style.scaleStep)

              return (
                <TableRow key={`${platform.id}-${style.id}`}>
                  <TableCell className="font-medium">{platform.name}</TableCell>
                  <TableCell>{style.name}</TableCell>
                  <TableCell>
                    {scaleValue 
                      ? `${Math.round(scaleValue.size)}${typographyData.units.typography}` 
                      : '-'}
                  </TableCell>
                  <TableCell>{style.lineHeight}</TableCell>
                  <TableCell>{style.letterSpacing}em</TableCell>
                  <TableCell>{style.fontWeight}</TableCell>
                  <TableCell>{style.scaleStep}</TableCell>
                  <TableCell>{style.opticalSize}{typographyData.units.typography}</TableCell>
                </TableRow>
              )
            })
          })}
      </TableBody>
    </Table>
  )

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Typography Documentation
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-6">
              <AnimatedTabs 
                tabs={[
                  { id: 'overview', label: 'Overview' },
                  { id: 'preview', label: 'Preview' }
                ]}
                defaultTab="overview"
                onChange={(tab) => setActiveTab(tab)}
                layoutId="documentation-tabs"
              />

              <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select platform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Platforms</SelectItem>
                  {platforms.map((platform) => (
                    <SelectItem key={platform.id} value={platform.id}>
                      {platform.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 min-h-0">
              <ScrollArea className="h-full">
                {activeTab === 'overview' && (
                  <div className="space-y-8">
                    <section className="mt-6">
                      <h2 className="text-xl font-semibold mb-4">Platform Settings</h2>
                      <PlatformComparison />
                    </section>
                    <section>
                      <h2 className="text-xl font-semibold mb-4">Type Styles</h2>
                      <TypeStylesTable />
                    </section>
                  </div>
                )}

                {activeTab === 'preview' && renderPreviewTable()}
              </ScrollArea>
            </div>
          </div>

          <div className="flex justify-end mt-4 pt-4 border-t flex-shrink-0">
            <Button onClick={() => {
              const doc = generatePDF(platforms)
              doc.save('typography-documentation.pdf')
            }}>
              Export Documentation
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 