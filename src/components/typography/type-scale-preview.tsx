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
    platforms
  } = useTypographyStore()

  const currentSettings = platforms.find(p => p.id === currentPlatform)!
  const { scaleMethod, scale, distanceScale } = currentSettings
  
  const calculateSize = (step: number) => {
    if (scaleMethod === 'distance') {
      const baseSize = calculateDistanceBasedSize(
        distanceScale.viewingDistance,
        distanceScale.visualAcuity,
        distanceScale.meanLengthRatio,
        distanceScale.textType,
        distanceScale.lighting,
        distanceScale.ppi
      )
      return Math.round(baseSize * Math.pow(scale.ratio, step))  // Using the same ratio as modular scale
    }
    return Math.round(scale.baseSize * Math.pow(scale.ratio, step))
  }

  const getBaseSize = () => {
    if (scaleMethod === 'distance') {
      return calculateDistanceBasedSize(
        distanceScale.viewingDistance,
        distanceScale.visualAcuity,
        distanceScale.meanLengthRatio,
        distanceScale.textType,
        distanceScale.lighting,
        distanceScale.ppi
      )
    }
    return scale.baseSize
  }

  const calculateRatio = (size: number) => {
    const baseSize = scaleMethod === 'distance' 
      ? calculateDistanceBasedSize(
          distanceScale.viewingDistance,
          distanceScale.visualAcuity,
          distanceScale.meanLengthRatio,
          distanceScale.textType,
          distanceScale.lighting,
          distanceScale.ppi
        )
      : scale.baseSize
    return size === baseSize ? '1x' : `${(size / baseSize).toFixed(3)}x`
  }

  const typeScaleItems = [
    { id: 'h1', label: 'H1', step: 5 },
    { id: 'h2', label: 'H2', step: 4 },
    { id: 'h3', label: 'H3', step: 3 },
    { id: 'h4', label: 'H4', step: 2 },
    { id: 'h5', label: 'H5', step: 1 },
    { id: 'h6', label: 'H6', step: 0 },
    { id: 'body', label: 'Body', step: 0 },
  ].map(item => {
    const size = calculateSize(item.step)
    return {
      ...item,
      size,
      ratio: calculateRatio(size)
    }
  })

  const baseSize = getBaseSize()

  return (
    <div className="border-y">
      <div className="py-4 text-sm text-muted-foreground">
        Base Size: {baseSize}px • Scale Ratio: {scale.ratio}
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px] pl-0">Label</TableHead>
            <TableHead className="pl-0">Preview</TableHead>
            <TableHead className="w-[100px] pl-0">Size</TableHead>
            <TableHead className="w-[100px] pl-0">Ratio</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {typeScaleItems.map((item) => (
            <TableRow key={item.id} className="h-auto">
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
              <TableCell className="py-4 pl-0">{item.size}px</TableCell>
              <TableCell className="py-4 pl-0">{item.ratio}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
