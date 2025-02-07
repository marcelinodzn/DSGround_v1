import { useState, useMemo, useEffect } from "react"
import { useTypographyStore, TypeStyle } from "@/store/typography"
import { usePlatformStore } from "@/store/platform-store"
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

// Update the ScaleViewProps interface with default values
interface ScaleViewProps {
  scaleValues: Array<{
    label: string
    size: number
    ratio: number
  }>
  units?: Platform['units']  // Make units optional
  baseSize: number
}

// Update the defaultUnits constant
const defaultUnits = {
  typography: 'px',
  spacing: 'px',
  dimensions: 'px'
} as const

// Add unit conversion helper
const convertToUnit = (pixels: number, unit: string, baseSize: number = 16) => {
  switch (unit) {
    case 'rem':
      return `${(pixels / baseSize).toFixed(3)}rem`
    case 'em':
      return `${(pixels / baseSize).toFixed(3)}em`
    case 'pt':
      return `${Math.round(pixels * 0.75)}pt`
    case '%':
      return `${(pixels / baseSize * 100).toFixed(1)}%`
    case 'vw':
      return `${(pixels / window.innerWidth * 100).toFixed(2)}vw`
    case 'vh':
      return `${(pixels / window.innerHeight * 100).toFixed(2)}vh`
    default:
      return `${Math.round(pixels)}px`
  }
}

// Create a dynamic version of ScaleView with SSR disabled
const ScaleView = dynamic(() => Promise.resolve(({ scaleValues, baseSize }: ScaleViewProps) => {
  const { platforms, currentPlatform } = useTypographyStore()
  const { platforms: platformSettings } = usePlatformStore()
  const currentPlatformSettings = platformSettings.find(p => p.id === currentPlatform)
  const typographyUnit = currentPlatformSettings?.units.typography || 'rem'

  return (
    <div className="w-full min-w-0">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Label</TableHead>
            <TableHead>Preview</TableHead>
            <TableHead className="w-[100px] text-right">Size ({typographyUnit})</TableHead>
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
                      fontSize: `${item.size}${typographyUnit}`,
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
              <TableCell className="py-6 text-right">
                {item.size.toFixed(2)}{typographyUnit}
              </TableCell>
              <TableCell className="text-muted-foreground text-sm py-6 text-right">
                {item.ratio.toFixed(3)}x
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}), { ssr: false })

interface StylesViewProps {
  typeStyles: TypeStyle[]
  scaleValues: Array<{
    label: string
    size: number
    ratio: number
  }>
  units?: Platform['units']  // Make units optional
  baseSize: number
}

// Update the StylesView component with default units
function StylesView({ typeStyles, scaleValues, baseSize }: StylesViewProps) {
  const { platforms, currentPlatform } = useTypographyStore()
  const { platforms: platformSettings } = usePlatformStore()
  
  // Get the current platform settings
  const currentPlatformSettings = platformSettings.find(p => p.id === currentPlatform)
  const typographyUnit = currentPlatformSettings?.units.typography || 'rem'
  
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[100px]">Label</TableHead>
          <TableHead>Preview</TableHead>
          <TableHead className="w-[100px] text-right">Size ({typographyUnit})</TableHead>
          <TableHead className="w-[100px] text-right">Properties</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {typeStyles.map((style) => {
          const scaleValue = scaleValues.find(s => s.label === style.scaleStep)
          const size = scaleValue ? scaleValue.size : baseSize

          return (
            <TableRow key={style.name}>
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
                      fontSize: `${size}${typographyUnit}`,
                      lineHeight: style.lineHeight,
                      fontWeight: style.fontWeight,
                      letterSpacing: `${style.letterSpacing}em`,
                      fontOpticalSizing: 'auto',
                      fontVariationSettings: `'opsz' ${style.opticalSize}`,
                      wordBreak: 'break-word',
                      overflowWrap: 'break-word',
                      whiteSpace: 'normal',
                      minHeight: `${Math.max(size * style.lineHeight, 48)}px`,
                      display: 'flex',
                      alignItems: 'center'
                    }} 
                  >
                    The quick brown fox jumps over the lazy dog
                  </div>
                </div>
              </TableCell>
              <TableCell className="py-6 text-right">
                {size.toFixed(2)}{typographyUnit}
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

// Update the TypeScalePreview component with null checks
export function TypeScalePreview() {
  const {
    currentPlatform,
    platforms,
    getScaleValues
  } = useTypographyStore()
  
  const [view, setView] = useState<'scale' | 'styles'>('scale')

  const viewTabs = [
    { id: 'scale', label: 'Scale View' },
    { id: 'styles', label: 'Styles View' }
  ]

  // Find current settings and handle the case where none are found
  const currentSettings = platforms.find(p => p.id === currentPlatform)
  
  // If no settings found, show loading or return null
  if (!currentSettings) {
    return null
  }

  const { scaleMethod, scale, distanceScale } = currentSettings
  const units = currentSettings.units || defaultUnits
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

  return (
    <div className="relative w-full">
      <div className="-mt-[25px] relative w-screen -ml-[calc(50vw-50%)]">
        <Separator className="w-screen" />
      </div>
      
      <div className="flex justify-between items-center pt-6">
        <div className="py-4 text-sm text-muted-foreground">
          Base Size: {convertToUnit(displayBaseSize, units.typography, scale.baseSize)}
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
            <ScaleView 
              scaleValues={scaleValues} 
              baseSize={scale.baseSize}
            />
          ) : (
            <StylesView 
              typeStyles={currentSettings.typeStyles} 
              scaleValues={scaleValues}
              baseSize={scale.baseSize}
            />
          )}
        </div>
      </div>
    </div>
  )
}
