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
import { TypeStyle } from '@/types/typography'
import { useTypographyStore } from '@/store/typography'
import { usePlatformStore, Platform } from "@/store/platform-store"
import { Label } from "@/components/ui/label"
import { Download, File, FileJson } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Scale method explanations
const scaleMethodExplanations = {
  'linear': 'Sizes increase by adding a constant value',
  'modular': 'Sizes increase by multiplying by a ratio',
  'custom': 'Custom defined sizes',
  'distance-based': 'Sizes based on viewing distance',
};

/**
 * Generate SVG from typography style data
 */
const generateSVG = (platforms: Platform[]) => {
  const svgWidth = 1200;
  const svgHeight = 800;
  const initialPadding = 40;
  
  let svg = `<svg width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}" xmlns="http://www.w3.org/2000/svg">
    <style>
      text { font-family: system-ui, sans-serif; }
      .heading { font-weight: bold; font-size: 20px; }
      .platform-name { font-weight: bold; font-size: 16px; }
      .style-name { font-weight: 500; }
    </style>
    <rect width="${svgWidth}" height="${svgHeight}" fill="#ffffff" />
    <text x="${initialPadding}" y="${initialPadding}" class="heading">Typography Documentation</text>`;
  
  let yOffset = initialPadding + 40;
  let xPadding = initialPadding;
  
  platforms.forEach((platform, platformIndex) => {
    // Get typography data from the store
    const typeStyles = typographyPlatforms[platform.id]?.typeStyles || [];
    
    svg += `<text x="${xPadding}" y="${yOffset}" class="platform-name">${platform.name}</text>`;
    yOffset += 30;
    
    const scaleMethod = typographyPlatforms[platform.id]?.scaleMethod || 'None';
    svg += `<text x="${xPadding}" y="${yOffset}">Scale Method: ${scaleMethod}</text>`;
    
    const scale = typographyPlatforms[platform.id]?.scale;
    if (scale) {
      yOffset += 20;
      svg += `<text x="${xPadding}" y="${yOffset}">Base Size: ${scale.baseSize}px, Ratio: ${scale.ratio}</text>`;
    }
    
    yOffset += 40;
    
    // Add type styles
    typeStyles.forEach((style, styleIndex) => {
      if (styleIndex > 0 && styleIndex % 10 === 0) {
        // Start a new column after 10 styles
        yOffset = initialPadding + 40;
        xPadding += 300;
      }
      
      svg += `<text x="${xPadding}" y="${yOffset}" class="style-name">${style.name}</text>`;
      yOffset += 20;
      svg += `<text x="${xPadding + 20}" y="${yOffset}">Size: ${style.size}px</text>`;
      yOffset += 20;
      svg += `<text x="${xPadding + 20}" y="${yOffset}">Weight: ${style.fontWeight}</text>`;
      yOffset += 20;
      svg += `<text x="${xPadding + 20}" y="${yOffset}">Line Height: ${style.lineHeight}</text>`;
      yOffset += 30;
    });
    
    yOffset += 40;
    if (yOffset > svgHeight - 100) {
      yOffset = initialPadding + 40;
      xPadding += 300;
    }
  });
  
  svg += `</svg>`;
  return svg;
};

/**
 * Export SVG as a downloadable file
 */
const downloadSVG = (platforms: Platform[]) => {
  const svg = generateSVG(platforms);
  const blob = new Blob([svg], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = 'typography-documentation.svg';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Export as JSON
 */
const downloadJSON = () => {
  const exportData = platforms.map(platform => {
    const typographyData = getTypographyData(platform.id) || {};
    return {
      id: platform.id,
      name: platform.name,
      scaleMethod: typographyData.scaleMethod,
      scale: typographyData.scale,
      typeStyles: typographyData.typeStyles
    };
  });
  
  const json = JSON.stringify(exportData, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = 'typography-documentation.json';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Export as JSON for Figma Plugin
 */
const downloadJSONForFigma = () => {
  const exportData = platforms.map(platform => {
    const typographyData = getTypographyData(platform.id) || {};
    return {
      id: platform.id,
      name: platform.name,
      scale: {
        baseSize: typographyData.scale?.baseSize || 16,
        ratio: typographyData.scale?.ratio || 1.25,
        stepsUp: typographyData.scale?.stepsUp || 5,
        stepsDown: typographyData.scale?.stepsDown || 2
      },
      typeStyles: (typographyData.typeStyles || []).map(style => ({
        id: style.id || `style-${Math.random().toString(36).substr(2, 9)}`,
        name: style.name || 'Unnamed Style',
        scaleStep: style.scaleStep || 'f0',
        fontFamily: style.fontFamily || 'Inter',
        fontWeight: style.fontWeight || 400,
        lineHeight: style.lineHeight || 1.5,
        lineHeightUnit: style.lineHeightUnit || 'multiplier',
        letterSpacing: style.letterSpacing || 0,
        opticalSize: style.opticalSize || 0,
        fontSize: style.fontSize,
        textTransform: style.textTransform || 'none'
      }))
    };
  });
  
  const json = JSON.stringify(exportData, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = 'figma-typography-styles.json';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

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
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-4xl h-[85vh] p-6 flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Typography Documentation</DialogTitle>
          <DialogDescription>
            Export and review your typography system
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col flex-1 gap-6 overflow-hidden">
          <div className="flex items-center justify-between gap-4 flex-shrink-0">
            <div className="flex items-center gap-4">
              <Label htmlFor="platformSelect">Platform:</Label>
              <Select
                value={selectedPlatform}
                onValueChange={setSelectedPlatform}
              >
                <SelectTrigger id="platformSelect" className="w-40">
                  <SelectValue placeholder="Select Platform" />
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
            
            <AnimatedTabs
              tabs={[
                { id: 'overview', label: 'Overview' },
                { id: 'styles', label: 'Type Styles' },
                { id: 'preview', label: 'Preview' },
              ]}
              defaultTab="overview"
              onChange={setActiveTab}
            />
          </div>

          <div className="flex-1 overflow-hidden border rounded-md">
            <div className="h-full flex flex-col">
              <ScrollArea className="flex-1 p-4">
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    <section>
                      <h3 className="text-lg font-medium mb-4">Scale Method Explanation</h3>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Method</TableHead>
                            <TableHead>Description</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {Object.entries(scaleMethodExplanations).map(([method, description]) => (
                            <TableRow key={method}>
                              <TableCell className="font-medium">{method}</TableCell>
                              <TableCell>{description}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </section>

                    <section>
                      <h3 className="text-lg font-medium mb-4">Platform Type Scales</h3>
                      <PlatformComparison />
                    </section>
                  </div>
                )}

                {activeTab === 'styles' && (
                  <div className="space-y-6">
                    <section>
                      <h3 className="text-lg font-medium mb-4">Type Styles</h3>
                      <TypeStylesTable />
                    </section>
                  </div>
                )}

                {activeTab === 'preview' && renderPreviewTable()}
              </ScrollArea>
            </div>
          </div>

          <div className="flex justify-end mt-4 pt-4 border-t flex-shrink-0 gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Download className="h-4 w-4" />
                  Export <span className="sr-only">Export Options</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => {
                  const doc = generatePDF(platforms);
                  doc.save('typography-documentation.pdf');
                }}>
                  <File className="h-4 w-4 mr-2" />
                  Export as PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={downloadJSON}>
                  <FileJson className="h-4 w-4 mr-2" />
                  Export as JSON
                </DropdownMenuItem>
                <DropdownMenuItem onClick={downloadJSONForFigma}>
                  <FileJson className="h-4 w-4 mr-2" />
                  Export for Figma Plugin
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 