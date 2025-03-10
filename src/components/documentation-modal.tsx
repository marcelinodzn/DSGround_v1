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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Download, File, FileJson } from "lucide-react"

// Helper function to get typography data for a platform
interface TypographyPlatformData {
  id: string;
  scaleMethod?: string;
  scale?: any;
  typeStyles?: any[];
  [key: string]: any;
}

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
  const getTypographyData = (platformId: string): TypographyPlatformData | undefined => {
    return typographyPlatforms.find(p => p.id === platformId)
  }

  const generateScaleTable = () => {
    const platformId = selectedPlatform === 'all' ? platforms[0]?.id : selectedPlatform
    if (!platformId) return null
    
    const typographyData = getTypographyData(platformId)
    if (!typographyData) return null
    
    const scaleValues = getScaleValues(platformId)
    
    return (
      <Table>
        <TableCaption>Typography Scale for {typographyData.name || platformId}</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Step</TableHead>
            <TableHead>Size (px)</TableHead>
            <TableHead>Ratio</TableHead>
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
                <TableCell className="font-medium">{value.label}</TableCell>
                <TableCell>{Math.round(value.size)}</TableCell>
                <TableCell>{value.ratio.toFixed(2)}</TableCell>
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
                <TableCell className="text-right">
                  {style.lineHeightUnit === 'multiplier' 
                    ? `${style.lineHeight.toFixed(2)}×` 
                    : `${(style.lineHeight * 100).toFixed(0)}%`}
                </TableCell>
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
                      ? `${Math.round(scaleValue.size)}${typographyData.units.typography || 'px'}` 
                      : '-'}
                  </TableCell>
                  <TableCell>
                    {style.lineHeightUnit === 'multiplier' 
                      ? `${style.lineHeight.toFixed(2)}×` 
                      : `${(style.lineHeight * 100).toFixed(0)}%`}
                  </TableCell>
                  <TableCell>{style.letterSpacing}em</TableCell>
                  <TableCell>{style.fontWeight}</TableCell>
                  <TableCell>{style.scaleStep}</TableCell>
                  <TableCell>{style.opticalSize}{typographyData.units.typography || 'px'}</TableCell>
                </TableRow>
              )
            })
          })}
      </TableBody>
    </Table>
  )

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-5xl h-[85vh] p-6 flex flex-col">
        <DialogHeader className="flex-shrink-0 mb-6">
          <DialogTitle>Typography Documentation</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col flex-1 gap-6 overflow-hidden">
          <div className="flex items-center justify-between gap-4 flex-shrink-0">
            <div className="flex items-center gap-4">
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
              layoutId="documentation-tabs"
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
                <DropdownMenuItem onClick={() => {
                  // Generate SVG content with table-like styling
                  const svgWidth = 1200;
                  let svgHeight = 1600; // Increased height for more content
                  const initialPadding = 40;
                  
                  let svg = `<svg width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}" xmlns="http://www.w3.org/2000/svg">
                    <style>
                      text { font-family: system-ui, sans-serif; }
                      .heading { font-weight: bold; font-size: 24px; }
                      .platform-name { font-weight: bold; font-size: 20px; }
                      .style-name { font-weight: 500; font-size: 16px; }
                      .table-header { font-weight: 600; font-size: 14px; fill: #6b7280; }
                      .table-row-odd { fill: #f9fafb; }
                      .table-row-even { fill: #ffffff; }
                      .table-cell { font-size: 14px; }
                      .table-cell-small { font-size: 12px; fill: #6b7280; }
                      .table-border { stroke: #e5e7eb; stroke-width: 1; }
                      @font-face {
                        font-family: 'system-ui';
                        src: local('system-ui');
                      }
                    </style>
                    <rect width="${svgWidth}" height="${svgHeight}" fill="#ffffff" />
                    <text x="${initialPadding}" y="${initialPadding}" class="heading">Typography Documentation</text>`;
                  
                  let yOffset = initialPadding + 60;
                  
                  // Function to create a table
                  const createTable = (
                    x: number, 
                    y: number, 
                    width: number, 
                    headers: string[], 
                    rows: Array<Array<string | { main: string; sub?: string; style?: any }>>,
                    rowHeight = 80
                  ): number => {
                    const colWidths: number[] = [];
                    const headerHeight = 40;
                    
                    // Calculate column widths based on header content
                    let totalWidth = 0;
                    headers.forEach((header, i) => {
                      let colWidth: number;
                      if (i === 0) colWidth = width * 0.25; // Style name column - reduced from 0.3
                      else if (i === 1) colWidth = width * 0.6; // Preview column - increased from 0.5
                      else colWidth = width * 0.15; // Size column - reduced from 0.2
                      colWidths.push(colWidth);
                      totalWidth += colWidth;
                    });
                    
                    // Draw table header
                    svg += `<rect x="${x}" y="${y}" width="${width}" height="${headerHeight}" fill="#f9fafb" class="table-border" />`;
                    
                    let xPos = x;
                    headers.forEach((header, i) => {
                      const textX = xPos + (i === headers.length - 1 ? colWidths[i] - 10 : 10);
                      const textAnchor = i === headers.length - 1 ? 'end' : 'start';
                      svg += `<text x="${textX}" y="${y + 25}" class="table-header" text-anchor="${textAnchor}">${header}</text>`;
                      
                      // Draw vertical line after each column except the last
                      if (i < headers.length - 1) {
                        // If this is the first column (style), reduce the gap
                        if (i === 0) {
                          svg += `<line x1="${xPos + colWidths[i]}" y1="${y}" x2="${xPos + colWidths[i]}" y2="${y + headerHeight + rows.length * rowHeight}" class="table-border" />`;
                        } else {
                          svg += `<line x1="${xPos + colWidths[i]}" y1="${y}" x2="${xPos + colWidths[i]}" y2="${y + headerHeight + rows.length * rowHeight}" class="table-border" />`;
                        }
                      }
                      
                      xPos += colWidths[i];
                    });
                    
                    // Draw rows
                    rows.forEach((row, rowIndex) => {
                      const rowY = y + headerHeight + rowIndex * rowHeight;
                      const fillClass = rowIndex % 2 === 0 ? 'table-row-even' : 'table-row-odd';
                      
                      // Draw row background
                      svg += `<rect x="${x}" y="${rowY}" width="${width}" height="${rowHeight}" fill="${fillClass === 'table-row-odd' ? '#f9fafb' : '#ffffff'}" class="table-border" />`;
                      
                      // Draw row content
                      xPos = x;
                      row.forEach((cell, cellIndex) => {
                        const textX = xPos + (cellIndex === row.length - 1 ? colWidths[cellIndex] - 10 : 10);
                        const textAnchor = cellIndex === row.length - 1 ? 'end' : 'start';
                        
                        if (typeof cell === 'object') {
                          if (cellIndex === 1 && cell.style) {
                            // This is a preview cell with style information
                            const style = cell.style;
                            const fontSize = style.fontSize || 16;
                            const fontWeight = style.fontWeight || 400;
                            const lineHeight = style.lineHeight || 1.2;
                            const textTransform = style.textTransform || 'none';
                            const fontFamily = style.fontFamily || 'system-ui';
                            
                            // Apply text transformation
                            let previewText = 'The quick brown fox jumps over the lazy dog';
                            if (textTransform === 'uppercase') previewText = previewText.toUpperCase();
                            else if (textTransform === 'lowercase') previewText = previewText.toLowerCase();
                            else if (textTransform === 'capitalize') previewText = previewText.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
                            
                            // Calculate position based on line height
                            const textY = rowY + (rowHeight / 2) + (fontSize / 4);
                            
                            svg += `<text 
                              x="${textX}" 
                              y="${textY}" 
                              font-family="${fontFamily}, system-ui, sans-serif" 
                              font-size="${fontSize}px" 
                              font-weight="${fontWeight}"
                              text-anchor="${textAnchor}"
                              style="text-transform: ${textTransform};"
                            >${previewText}</text>`;
                          } else {
                            // Complex cell with main text and subtext
                            svg += `<text x="${textX}" y="${rowY + 25}" class="table-cell" text-anchor="${textAnchor}">${cell.main}</text>`;
                            if (cell.sub) {
                              svg += `<text x="${textX}" y="${rowY + 45}" class="table-cell-small" text-anchor="${textAnchor}">${cell.sub}</text>`;
                            }
                          }
                        } else {
                          // Simple cell with just text
                          svg += `<text x="${textX}" y="${rowY + rowHeight/2 + 5}" class="table-cell" text-anchor="${textAnchor}">${cell}</text>`;
                        }
                        
                        xPos += colWidths[cellIndex];
                      });
                      
                      // Draw horizontal line after each row
                      svg += `<line x1="${x}" y1="${rowY + rowHeight}" x2="${x + width}" y2="${rowY + rowHeight}" class="table-border" />`;
                    });
                    
                    return y + headerHeight + rows.length * rowHeight;
                  };
                  
                  // Process each platform
                  platforms.forEach((platform, platformIndex) => {
                    // Get typography data from the store
                    const platformData = getTypographyData(platform.id);
                    if (!platformData) return;
                    
                    const typeStyles = platformData.typeStyles || [];
                    if (typeStyles.length === 0) return;
                    
                    // Add platform heading
                    svg += `<text x="${initialPadding}" y="${yOffset}" class="platform-name">${platform.name}</text>`;
                    yOffset += 40;
                    
                    // Create table headers
                    const headers = ['Style', 'Preview', `Size (${platform.units?.typography || 'px'})`];
                    
                    // Create table rows
                    const rows = typeStyles.map(style => {
                      const scaleValue = getScaleValues(platform.id)?.find(s => s.label === style.scaleStep);
                      const fontSize = style.fontSize || (scaleValue ? scaleValue.size : 16);
                      
                      // Format line height based on unit
                      const lineHeight = style.lineHeightUnit === 'multiplier' 
                        ? `${style.lineHeight.toFixed(2)}×` 
                        : `${(style.lineHeight * 100).toFixed(0)}%`;
                      
                      // Format text transform if present
                      const textTransform = style.textTransform && style.textTransform !== 'none' 
                        ? `, Transform: ${style.textTransform}` 
                        : '';
                      
                      return [
                        { main: style.name, sub: style.fontFamily || 'System Font' },
                        { main: 'The quick brown fox jumps over the lazy dog', style: {
                          ...style,
                          fontSize: fontSize
                        }},
                        { main: `${fontSize}${platform.units?.typography || 'px'}`, sub: `Line Height: ${lineHeight}${textTransform}` }
                      ];
                    });
                    
                    // Create the table
                    const tableWidth = svgWidth - (initialPadding * 2);
                    yOffset = createTable(initialPadding, yOffset, tableWidth, headers, rows);
                    
                    // Add spacing between platform tables
                    yOffset += 60;
                    
                    // If we're running out of space, increase the SVG height
                    if (yOffset > svgHeight - 200) {
                      const newHeight = yOffset + 200;
                      svg = svg.replace(`height="${svgHeight}"`, `height="${newHeight}"`);
                      svg = svg.replace(`viewBox="0 0 ${svgWidth} ${svgHeight}"`, `viewBox="0 0 ${svgWidth} ${newHeight}"`);
                      svgHeight = newHeight;
                    }
                  });
                  
                  svg += `</svg>`;
                  
                  // Download SVG
                  const blob = new Blob([svg], { type: 'image/svg+xml' });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = 'typography-documentation.svg';
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  URL.revokeObjectURL(url);
                }}>
                  <File className="h-4 w-4 mr-2" />
                  Export as SVG
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  // Generate JSON data
                  const exportData = platforms.map(platform => {
                    const typographyData = getTypographyData(platform.id) || {} as TypographyPlatformData;
                    return {
                      id: platform.id,
                      name: platform.name,
                      scaleMethod: typographyData.scaleMethod,
                      scale: typographyData.scale,
                      typeStyles: typographyData.typeStyles?.map((style: any) => {
                        // Include all necessary properties for the Figma plugin
                        return {
                          ...style,
                          // Ensure all required properties are present
                          id: style.id || `style-${Math.random().toString(36).substr(2, 9)}`,
                          name: style.name,
                          scaleStep: style.scaleStep,
                          fontFamily: style.fontFamily || 'Inter',
                          fontWeight: style.fontWeight,
                          lineHeight: style.lineHeight,
                          lineHeightUnit: style.lineHeightUnit || 'multiplier',
                          letterSpacing: style.letterSpacing,
                          opticalSize: style.opticalSize,
                          fontSize: style.fontSize,
                          textTransform: style.textTransform || 'none'
                        };
                      })
                    };
                  });
                  
                  // Download JSON
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
                }}>
                  <FileJson className="h-4 w-4 mr-2" />
                  Export as JSON
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  // Generate JSON data specifically for the Figma plugin
                  const exportData = platforms.map(platform => {
                    const typographyData = getTypographyData(platform.id) || {} as TypographyPlatformData;
                    return {
                      id: platform.id,
                      name: platform.name,
                      scaleMethod: typographyData.scaleMethod,
                      scale: typographyData.scale,
                      typeStyles: typographyData.typeStyles?.map((style: any) => {
                        // Include all necessary properties for the Figma plugin
                        return {
                          ...style,
                          // Ensure all required properties are present
                          id: style.id || `style-${Math.random().toString(36).substr(2, 9)}`,
                          name: style.name,
                          scaleStep: style.scaleStep,
                          fontFamily: style.fontFamily || 'Inter',
                          fontWeight: style.fontWeight,
                          lineHeight: style.lineHeight,
                          lineHeightUnit: style.lineHeightUnit || 'multiplier',
                          letterSpacing: style.letterSpacing,
                          opticalSize: style.opticalSize,
                          fontSize: style.fontSize,
                          textTransform: style.textTransform || 'none'
                        };
                      })
                    };
                  });
                  
                  // Download JSON
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
                }}>
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