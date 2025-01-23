import { useTypographyStore } from "@/store/typography"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

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

export function TypeScalePreview() {
  const { 
    currentPlatform,
    platforms,
    getScaleValues
  } = useTypographyStore()

  const currentSettings = platforms.find(p => p.id === currentPlatform)!
  const { scaleMethod, scale } = currentSettings
  
  const scaleValues = getScaleValues(currentPlatform)

  return (
    <div className="border-y">
      <div className="py-4 text-sm text-muted-foreground">
        Base Size: {scale.baseSize}px • Scale Ratio: {scale.ratio} • Steps Up: {scale.stepsUp} • Steps Down: {scale.stepsDown}
      </div>
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
    </div>
  )
}
