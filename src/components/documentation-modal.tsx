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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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

export function DocumentationModal({
  isOpen,
  onClose
}: {
  isOpen: boolean
  onClose: () => void
}) {
  const { platforms, currentPlatform, getScaleValues } = useTypographyStore()
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all')
  
  useEffect(() => {
    setSelectedPlatform('all')
  }, [currentPlatform])

  const scaleMethodExplanations = {
    'modular': 'Modular scales use a mathematical ratio to create harmonious size relationships. Each step is multiplied by the ratio, creating exponential growth.',
    'linear': 'Linear scales add a fixed value to each step, creating consistent size increments. This results in more predictable, evenly-spaced type sizes.',
    'custom': 'Custom scales allow you to define specific values for each step, giving you complete control over your typography hierarchy.'
  }

  const generateScaleTable = () => {
    if (selectedPlatform === 'all') {
      return null
    }

    const platform = platforms.find(p => p.id === selectedPlatform)
    if (!platform) return null

    const scaleValues = getScaleValues(selectedPlatform)
    
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
            const stylesAtScale = platform.typeStyles.filter(
              style => style.scaleStep === value.label
            )
            
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
    if (selectedPlatform === 'all') {
      return null // Don't show type style table for all platforms view
    }

    const platform = platforms.find(p => p.id === selectedPlatform)
    if (!platform) return null
    
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
          {platform.typeStyles.map((style) => {
            const scaleValue = platform.getScaleValues?.(platform.id)
              ?.find(s => s.label === style.scaleStep)

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
            )
          })}
        </TableBody>
      </Table>
    )
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
          .flatMap(platform =>
            platform.typeStyles.map(style => {
              const scaleValue = platform.getScaleValues?.(platform.id)
                .find(s => s.label === style.scaleStep)

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
          )}
      </TableBody>
    </Table>
  )

  // Platform comparison table with correct base size calculations
  const PlatformComparison = () => {
    const { platforms, getScaleValues } = useTypographyStore()
    
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
              let displayBaseSize = platform.scale.baseSize

              // Calculate base size for distance-based platforms
              if (platform.scaleMethod === 'distance' && platform.distanceScale) {
                displayBaseSize = calculateDistanceBasedSize(
                  platform.distanceScale.viewingDistance,
                  platform.distanceScale.visualAcuity,
                  platform.distanceScale.meanLengthRatio,
                  platform.distanceScale.textType,
                  platform.distanceScale.lighting,
                  platform.distanceScale.ppi
                )
              }

              // For AI method, use the base size directly from scale config
              // For modular method, use the base size from scale config

              return (
                <TableRow key={platform.id}>
                  <TableCell>{platform.name}</TableCell>
                  <TableCell>
                    {platform.scaleMethod === 'distance' 
                      ? `${Math.round(displayBaseSize)}px (distance-based)`
                      : `${displayBaseSize}px`
                    }
                  </TableCell>
                  <TableCell>{platform.scaleMethod}</TableCell>
                  <TableCell>{platform.scale.ratio}</TableCell>
                  <TableCell>{platform.scale.stepsUp}/{platform.scale.stepsDown}</TableCell>
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
          .flatMap(platform =>
            platform.typeStyles.map(style => {
              const scaleValue = platform.getScaleValues?.(platform.id)
                ?.find(s => s.label === style.scaleStep)

              return (
                <TableRow key={`${platform.id}-${style.id}`}>
                  <TableCell className="font-medium">{platform.name}</TableCell>
                  <TableCell>{style.name}</TableCell>
                  <TableCell>{scaleValue ? `${Math.round(scaleValue.size)}px` : '-'}</TableCell>
                  <TableCell>{style.lineHeight}</TableCell>
                  <TableCell>{style.letterSpacing}em</TableCell>
                  <TableCell>{style.fontWeight}</TableCell>
                  <TableCell>{style.scaleStep}</TableCell>
                  <TableCell>{style.opticalSize}</TableCell>
                </TableRow>
              )
            })
          )}
      </TableBody>
    </Table>
  )

  // Update the details tab content
  const renderDetailsContent = () => {
    if (selectedPlatform === 'all') {
      return (
        <div className="text-center py-8 text-muted-foreground">
          Please select a specific platform to view detailed settings
        </div>
      )
    }

    return (
      <section className="space-y-8">
        <h2 className="text-2xl font-bold mb-4">
          {selectedPlatform.toUpperCase()} Details
        </h2>
        {generateScaleTable()}
        {renderTypeStyleTable()}
      </section>
    )
  }

  // Update the code tab content
  const renderCodeContent = () => {
    if (selectedPlatform === 'all') {
      return (
        <div className="text-center py-8 text-muted-foreground">
          Please select a specific platform to view implementation code
        </div>
      )
    }

    const platform = platforms.find(p => p.id === selectedPlatform)
    if (!platform) return null

    return (
      <section>
        <h2 className="text-2xl font-bold mb-4">Implementation</h2>
        <div className="space-y-4">
          {platform.id === 'web' && (
            <>
              <div>
                <h3 className="text-lg font-medium mb-2">CSS Variables</h3>
                <pre className="bg-muted p-4 rounded-md">
                  {platform.typeStyles.map(style => 
                    `--font-size-${style.name}: ${Math.round(getScaleValues(platform.id)
                      .find(s => s.label === style.scaleStep)?.size || platform.scale.baseSize)}px;`
                  ).join('\n')}
                </pre>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2">Tailwind Config</h3>
                <pre className="bg-muted p-4 rounded-md">
                  {`module.exports = {
  theme: {
    fontSize: {
      ${platform.typeStyles.map(style => {
        const size = getScaleValues(platform.id)
          .find(s => s.label === style.scaleStep)?.size || platform.scale.baseSize
        return `'${style.name}': ['${Math.round(size)}px', { lineHeight: '${style.lineHeight}' }]`
      }).join(',\n      ')}
    }
  }
}`}
                </pre>
              </div>
            </>
          )}

          {platform.id === 'ios' && (
            <div>
              <h3 className="text-lg font-medium mb-2">Swift Constants</h3>
              <pre className="bg-muted p-4 rounded-md">
                {platform.typeStyles.map(style => {
                  const size = getScaleValues(platform.id)
                    .find(s => s.label === style.scaleStep)?.size || platform.scale.baseSize
                  return `static let ${style.name}Size: CGFloat = ${Math.round(size)}`
                }).join('\n')}
              </pre>
            </div>
          )}

          {platform.id === 'android' && (
            <div>
              <h3 className="text-lg font-medium mb-2">Android Dimensions</h3>
              <pre className="bg-muted p-4 rounded-md">
                {platform.typeStyles.map(style => {
                  const size = getScaleValues(platform.id)
                    .find(s => s.label === style.scaleStep)?.size || platform.scale.baseSize
                  return `<dimen name="text_size_${style.name}">${Math.round(size)}sp</dimen>`
                }).join('\n')}
              </pre>
            </div>
          )}
        </div>
      </section>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-2xl font-bold">
            Typography Documentation
          </DialogTitle>
          <DialogDescription className="text-lg">
            Cross-platform typography system
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="overview" className="flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="code">Code</TabsTrigger>
            </TabsList>

            <Select 
              value={selectedPlatform} 
              onValueChange={(value: string) => setSelectedPlatform(value)}
            >
              <SelectTrigger className="w-[180px] h-9 mr-4">
                <SelectValue placeholder="Select platform" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Platforms</SelectItem>
                {platforms.map(platform => (
                  <SelectItem key={platform.id} value={platform.id}>
                    {platform.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 min-h-0">
            <ScrollArea className="h-full">
              <TabsContent value="overview" className="m-0">
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
              </TabsContent>

              <TabsContent value="preview" className="m-0">
                {renderPreviewTable()}
              </TabsContent>

              <TabsContent value="details" className="space-y-8 m-0">
                {renderDetailsContent()}
              </TabsContent>

              <TabsContent value="code" className="space-y-8 m-0">
                {renderCodeContent()}
              </TabsContent>
            </ScrollArea>
          </div>
        </Tabs>

        <div className="flex justify-end mt-4 pt-4 border-t flex-shrink-0">
          <Button onClick={() => {
            const doc = generatePDF(platforms)
            doc.save('typography-documentation.pdf')
          }}>
            Export Documentation
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 