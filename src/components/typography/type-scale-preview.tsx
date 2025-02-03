import { useState, useMemo, useEffect } from "react"
import { useTypographyStore, TypeStyle } from "@/store/typography"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import dynamic from 'next/dynamic'
import { AnimatedTabs } from "@/components/ui/animated-tabs"

const calculateDistanceBasedSize = (
  distance: number,
  visualAcuity: number,
  meanLengthRatio: number,
  textType: 'continuous' | 'isolated',
  lighting: 'good' | 'moderate' | 'poor',
  ppi: number
): number => {
  // Constants from leserlich.info calculation
  const MIN_VISUAL_ANGLE = 0.21 // Minimum visual angle in degrees
  const LIGHTING_FACTORS = {
    good: 1,
    moderate: 1.25,
    poor: 1.5
  }
  const TEXT_TYPE_FACTORS = {
    continuous: 1,
    isolated: 1.5
  }

  // Convert distance from cm to mm
  const distanceInMm = distance * 10

  // Calculate base size using visual angle formula
  const visualAngleRad = (MIN_VISUAL_ANGLE * Math.PI) / 180
  let baseSize = 2 * distanceInMm * Math.tan(visualAngleRad / 2)

  // Apply visual acuity adjustment
  baseSize = baseSize / visualAcuity

  // Apply mean length ratio
  baseSize = baseSize * meanLengthRatio

  // Apply lighting and text type factors
  baseSize = baseSize * LIGHTING_FACTORS[lighting] * TEXT_TYPE_FACTORS[textType]

  // Convert mm to pixels using PPI
  const pixelSize = (baseSize * ppi) / 25.4 // 25.4 mm per inch

  return Math.round(pixelSize)
}

// Add interface for component props
interface ScaleViewProps {
  scaleValues: Array<{
    label: string
    size: number
    ratio: number
  }>
}

interface StylesViewProps {
  typeStyles: TypeStyle[]
  scaleValues: Array<{
    label: string
    size: number
    ratio: number
  }>
}

// Create a dynamic version of ScaleView with SSR disabled
const ScaleView = dynamic(() => Promise.resolve(({ scaleValues }: ScaleViewProps) => (
  <div className="w-full min-w-0">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[100px]">Label</TableHead>
          <TableHead>Preview</TableHead>
          <TableHead className="w-[100px] text-right">Size</TableHead>
          <TableHead className="w-[100px] text-right">Scale Factor</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {scaleValues.map((item) => (
          <TableRow key={item.label}>
            <TableCell className="font-medium py-6">{item.label}</TableCell>
            <TableCell className="py-6">
              <div className="min-w-0">
                <div 
                  style={{ 
                    fontSize: `${Math.round(item.size)}px`,
                    lineHeight: 1.2,
                    wordBreak: 'break-word',
                    overflowWrap: 'break-word',
                    whiteSpace: 'normal',
                    minHeight: `${Math.max(item.size * 1.2, 48)}px`,
                    display: 'flex',
                    alignItems: 'center'
                  }} 
                >
                  The quick brown fox jumps over the lazy dog
                </div>
              </div>
            </TableCell>
            <TableCell className="py-6 text-right">{Math.round(item.size)}px</TableCell>
            <TableCell className="text-muted-foreground text-sm py-6 text-right">
              {item.ratio.toFixed(3)}x
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
)), { ssr: false })

export function TypeScalePreview() {
  const { 
    currentPlatform,
    platforms,
    getScaleValues
  } = useTypographyStore()

  const currentSettings = platforms.find(p => p.id === currentPlatform)!
  const { scaleMethod, scale, distanceScale } = currentSettings
  
  const scaleValues = getScaleValues(currentPlatform)

  // Calculate the correct base size based on scale method
  let displayBaseSize = scale.baseSize
  if (scaleMethod === 'distance' && distanceScale) {
    displayBaseSize = calculateDistanceBasedSize(
      distanceScale.viewingDistance,
      distanceScale.visualAcuity,
      distanceScale.meanLengthRatio,
      distanceScale.textType,
      distanceScale.lighting,
      distanceScale.ppi
    )
  }

  const [view, setView] = useState<'scale' | 'styles'>('scale')

  const viewTabs = [
    { id: 'scale', label: 'Scale View' },
    { id: 'styles', label: 'Styles View' }
  ]

  return (
    <div className="relative w-full">
      <div className="-mt-[25px] relative w-screen -ml-[calc(50vw-50%)]">
        <Separator className="w-screen" />
      </div>
      
      <div className="flex justify-between items-center pt-6">
        <div className="py-4 text-sm text-muted-foreground">
          Base Size: {Math.round(displayBaseSize)}px
          {scaleMethod === 'distance' && ' (distance-based)'} • 
          Scale Ratio: {scale.ratio} • 
          Steps Up: {scale.stepsUp} • 
          Steps Down: {scale.stepsDown}
        </div>
        <AnimatedTabs
          tabs={viewTabs}
          defaultTab="scale"
          onChange={(value) => setView(value as 'scale' | 'styles')}
          layoutId="preview-view-tabs"
        />
      </div>

      <div className="py-4">
        <div className="min-w-0 overflow-x-auto">
          {view === 'scale' ? (
            <ScaleView scaleValues={scaleValues} />
          ) : (
            <StylesView typeStyles={currentSettings.typeStyles} scaleValues={scaleValues} />
          )}
        </div>
      </div>
    </div>
  )
}

function StylesView({ typeStyles, scaleValues }: StylesViewProps) {
  const { platforms, currentPlatform } = useTypographyStore()
  const platform = platforms.find(p => p.id === currentPlatform)
  
  // Calculate the correct base size based on scale method
  let displayBaseSize = platform?.scale.baseSize || 16
  if (platform?.scaleMethod === 'distance' && platform.distanceScale) {
    displayBaseSize = calculateDistanceBasedSize(
      platform.distanceScale.viewingDistance,
      platform.distanceScale.visualAcuity,
      platform.distanceScale.meanLengthRatio,
      platform.distanceScale.textType,
      platform.distanceScale.lighting,
      platform.distanceScale.ppi
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[100px]">Label</TableHead>
          <TableHead>Preview</TableHead>
          <TableHead className="w-[100px] text-right">Size</TableHead>
          <TableHead className="w-[100px] text-right">Properties</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {typeStyles.map(style => {
          const scaleValue = scaleValues.find(s => s.label === style.scaleStep)
          const fontSize = scaleValue?.size || displayBaseSize // Use calculated base size if no scale value

          return (
            <TableRow key={style.id}>
              <TableCell className="font-medium py-6">
                <div className="flex flex-col">
                  <span>{style.name}</span>
                  <span className="text-xs text-muted-foreground">{style.scaleStep}</span>
                </div>
              </TableCell>
              <TableCell className="py-6">
                <div className="min-w-0">
                  <div 
                    style={{ 
                      fontSize: `${fontSize}px`,
                      lineHeight: style.lineHeight,
                      fontWeight: style.fontWeight,
                      letterSpacing: `${style.letterSpacing}em`,
                      fontOpticalSizing: 'auto',
                      fontVariationSettings: `'opsz' ${style.opticalSize}`,
                      wordBreak: 'break-word',
                      overflowWrap: 'break-word',
                      whiteSpace: 'normal',
                      minHeight: `${Math.max(fontSize * style.lineHeight, 48)}px`,
                      display: 'flex',
                      alignItems: 'center'
                    }} 
                  >
                    The quick brown fox jumps over the lazy dog
                  </div>
                </div>
              </TableCell>
              <TableCell className="py-6 text-right">
                {fontSize ? `${Math.round(fontSize)}px` : '-'}
              </TableCell>
              <TableCell className="py-6 text-right">
                <div className="text-xs text-muted-foreground space-y-1">
                  <div>Weight: {style.fontWeight}</div>
                  <div>Line Height: {style.lineHeight}</div>
                  <div>Letter Spacing: {style.letterSpacing}em</div>
                  <div>Optical Size: {style.opticalSize}</div>
                </div>
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
