import { useTypographyStore } from "@/store/typography"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { TypeStyle } from "@/store/typography"

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

export function TypeScalePreview() {
  const { 
    currentPlatform,
    platforms,
    getScaleValues
  } = useTypographyStore()

  const currentSettings = platforms.find(p => p.id === currentPlatform)!
  const { scaleMethod, scale } = currentSettings
  
  const scaleValues = getScaleValues(currentPlatform)

  const [view, setView] = useState<'scale' | 'styles'>('scale')

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="py-4 text-sm text-muted-foreground">
          Base Size: {scale.baseSize}px • Scale Ratio: {scale.ratio} • Steps Up: {scale.stepsUp} • Steps Down: {scale.stepsDown}
        </div>
        <div className="flex gap-2">
          <Button 
            variant={view === 'scale' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setView('scale')}
          >
            Scale View
          </Button>
          <Button
            variant={view === 'styles' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setView('styles')}
          >
            Styles View
          </Button>
        </div>
      </div>

      {view === 'scale' ? (
        <ScaleView scaleValues={scaleValues} />
      ) : (
        <StylesView typeStyles={currentSettings.typeStyles} scaleValues={scaleValues} />
      )}
    </div>
  )
}

function ScaleView({ scaleValues }: ScaleViewProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[100px] pl-0">Label</TableHead>
          <TableHead className="pl-0">Preview</TableHead>
          <TableHead className="w-[100px] pl-0">Size</TableHead>
          <TableHead className="w-[100px] pl-0">Scale Factor</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {scaleValues.map((item) => (
          <TableRow key={item.label} className="h-auto">
            <TableCell className="font-medium py-4 pl-0">{item.label}</TableCell>
            <TableCell className="py-4 pl-0">
              <div className="min-w-0 max-w-full">
                <div 
                  style={{ 
                    fontSize: `${item.size}px`,
                    lineHeight: 1.2,
                    wordBreak: 'break-word',
                    overflowWrap: 'break-word',
                    whiteSpace: 'normal',
                    maxHeight: `${Math.max(item.size * 1.2 * 2, 48)}px`,
                    overflow: 'hidden'
                  }} 
                >
                  The quick brown fox jumps over the lazy dog
                </div>
              </div>
            </TableCell>
            <TableCell className="py-4 pl-0">{Math.round(item.size)}px</TableCell>
            <TableCell className="py-4 pl-0 text-muted-foreground text-sm">
              {item.ratio.toFixed(3)}x
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

function StylesView({ typeStyles, scaleValues }: StylesViewProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[150px] pl-0">Style</TableHead>
          <TableHead className="pl-0">Preview</TableHead>
          <TableHead className="w-[100px] pl-0">Size</TableHead>
          <TableHead className="w-[100px] pl-0">Properties</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {typeStyles.map(style => {
          const scaleValue = scaleValues.find(s => s.label === style.scaleStep)
          return (
            <TableRow key={style.id} className="h-auto">
              <TableCell className="font-medium py-4 pl-0">
                <div className="flex flex-col">
                  <span>{style.name}</span>
                  <span className="text-xs text-muted-foreground">{style.scaleStep}</span>
                </div>
              </TableCell>
              <TableCell className="py-4 pl-0">
                <div className="min-w-0 max-w-full">
                  <div 
                    style={{ 
                      fontSize: `${scaleValue?.size}px`,
                      lineHeight: style.lineHeight,
                      fontWeight: style.fontWeight,
                      letterSpacing: `${style.letterSpacing}em`,
                      fontOpticalSizing: 'auto',
                      fontVariationSettings: `'opsz' ${style.opticalSize}`,
                      wordBreak: 'break-word',
                      overflowWrap: 'break-word',
                      whiteSpace: 'normal',
                      maxHeight: `${Math.max((scaleValue?.size || 16) * style.lineHeight * 2, 48)}px`,
                      overflow: 'hidden'
                    }} 
                  >
                    The quick brown fox jumps over the lazy dog
                  </div>
                </div>
              </TableCell>
              <TableCell className="py-4 pl-0">
                {scaleValue?.size ? `${Math.round(scaleValue.size)}px` : '-'}
              </TableCell>
              <TableCell className="py-4 pl-0">
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
