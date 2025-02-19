import { useState, useMemo, useEffect } from "react"
import { useTypographyStore, TypeStyle } from "@/store/typography"
import { usePlatformStore } from "@/store/platform-store"
import { useBrandStore } from "@/store/brand-store"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
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
import { useFontStore } from "@/store/font-store"
import { Badge } from "@/components/ui/badge"
import { calculateDistanceBasedSize } from '@/lib/scale-calculations'

interface ScaleViewProps {
  scaleValues: Array<{
    label: string
    size: number
    ratio: number
  }>
  units?: Platform['units']
  baseSize: number
  fontFamily?: string
  typographyUnit: string
}

const defaultUnits = {
  typography: 'px',
  spacing: 'px',
  dimensions: 'px'
}

// Add unit conversion helper
function convertToUnit(pixels: number, unit: string, baseSize: number = 16) {
  switch (unit) {
    case 'rem':
      return pixels / baseSize
    case 'em':
      return pixels / baseSize
    case 'px':
    default:
      return pixels
  }
}

// Create a dynamic version of ScaleView with SSR disabled
const ScaleView = dynamic(() => Promise.resolve(({ scaleValues, baseSize, fontFamily, typographyUnit }: ScaleViewProps) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[100px]">Label</TableHead>
          <TableHead>Preview</TableHead>
          <TableHead className="w-[100px] text-right">Size ({typographyUnit})</TableHead>
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
                    fontSize: `${item.size}px`,
                    lineHeight: 1.2,
                    wordBreak: 'break-word',
                    overflowWrap: 'break-word',
                    whiteSpace: 'normal',
                    minHeight: `${Math.max(item.size * 1.2, 48)}px`,
                    display: 'flex',
                    alignItems: 'center',
                    fontFamily: fontFamily
                  }} 
                >
                  The quick brown fox jumps over the lazy dog
                </div>
              </div>
            </TableCell>
            <TableCell className="py-6 text-right">
              {item.size.toFixed(2)}{typographyUnit}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}), { ssr: false })

interface StylesViewProps {
  typeStyles: TypeStyle[]
  scaleValues: Array<{
    label: string
    size: number
    ratio: number
  }>
  units?: Platform['units']
  baseSize: number
}

// Add helper function for font fallbacks
const getFontCategoryFallback = (category: string) => {
  switch (category) {
    case 'serif':
      return 'serif'
    case 'monospace':
      return 'monospace'
    case 'display':
      return 'cursive'
    case 'handwriting':
      return 'cursive'
    default:
      return 'sans-serif'
  }
}

// Update the StylesView component with default units
function StylesView({ typeStyles, scaleValues, baseSize }: StylesViewProps) {
  const { platforms, currentPlatform } = useTypographyStore()
  const { platforms: platformSettings } = usePlatformStore()
  const { fonts } = useFontStore()
  
  // Get the current platform settings
  const currentPlatformSettings = platformSettings.find(p => p.id === currentPlatform)
  const typographyUnit = currentPlatformSettings?.units.typography || 'rem'
  
  // Load fonts when component mounts or typeStyles change
  useEffect(() => {
    typeStyles.forEach(async (style) => {
      const font = fonts.find(f => f.family === style.fontFamily)
      if (!font?.fileUrl) return

      try {
        const fontFace = new FontFace(
          style.fontFamily,
          `url(${font.fileUrl})`,
          {
            weight: font.isVariable ? '1 1000' : font.weight.toString(),
            style: font.style || 'normal',
          }
        )
        const loadedFont = await fontFace.load()
        document.fonts.add(loadedFont)
      } catch (error) {
        console.error('Error loading font:', error)
      }
    })
  }, [typeStyles, fonts])
  
  return (
    <div className="space-y-8">
      {typeStyles.map((style, index) => (
        <div key={index} className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="text-sm font-medium text-muted-foreground">
                {style.name}
              </div>
              <div className="flex items-center gap-2">
                <div className="text-xs text-muted-foreground">
                  {style.fontFamily}
                </div>
                {style.isVariable && (
                  <Badge variant="secondary" className="text-[10px] h-4">
                    Variable
                  </Badge>
                )}
                <Badge variant="outline" className="text-[10px] h-4">
                  {style.fontWeight}
                </Badge>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              {style.fontSize}px
            </div>
          </div>
          <div 
            style={{ 
              fontFamily: `"${style.fontFamily}", ${getFontCategoryFallback(style.fontCategory || 'sans-serif')}`,
              fontSize: `${style.fontSize}px`,
              fontWeight: style.fontWeight,
              lineHeight: style.lineHeight,
              letterSpacing: style.letterSpacing,
              fontVariationSettings: style.isVariable ? `'wght' ${style.fontWeight}` : undefined,
            }}
            className="break-words"
          >
            The quick brown fox jumps over the lazy dog
          </div>
        </div>
      ))}
    </div>
  )
}

// Update the TypeScalePreview component to hide the property panel when no platform is selected
export function TypeScalePreview() {
  const {
    platforms,
    currentPlatform,
    setCurrentPlatform,
    getScaleValues
  } = useTypographyStore()
  
  const { platforms: platformSettings, fetchPlatformsByBrand } = usePlatformStore()
  const { currentBrand } = useBrandStore()
  const { brandTypography, fonts, loadFonts, loadBrandTypography } = useFontStore()
  const router = useRouter()
  const [view, setView] = useState<string>('scale')

  // Always define these memoized values, even if they're null
  const currentTypography = useMemo(() => 
    currentBrand?.id ? brandTypography[currentBrand.id] : null
  , [currentBrand?.id, brandTypography])

  const platform = useMemo(() => 
    platforms.find(p => p.id === currentPlatform)
  , [platforms, currentPlatform])

  const platformSetting = useMemo(() => 
    platformSettings.find(p => p.id === currentPlatform)
  , [platformSettings, currentPlatform])

  // Compute active platform - always define this
  const activePlatform = useMemo(() => {
    if (currentPlatform && platformSettings.find(p => p.id === currentPlatform)) {
      return currentPlatform
    }
    return platformSettings.length > 0 ? platformSettings[0].id : ''
  }, [currentPlatform, platformSettings])

  // Set initial platform if none selected
  useEffect(() => {
    if (!currentPlatform && platformSettings.length > 0) {
      setCurrentPlatform(platformSettings[0].id)
    }
  }, [currentPlatform, platformSettings, setCurrentPlatform])

  // Load data on mount and when brand changes
  useEffect(() => {
    const loadData = async () => {
      if (currentBrand?.id) {
        await Promise.all([
          loadFonts(),
          loadBrandTypography(currentBrand.id),
          fetchPlatformsByBrand(currentBrand.id)
        ])
      }
    }
    loadData()
  }, [loadFonts, currentBrand?.id, loadBrandTypography, fetchPlatformsByBrand])

  // Always compute font family and info, even if they're undefined
  const fontFamily = useMemo(() => {
    if (!currentTypography || !platform?.currentFontRole) return undefined
    const fontId = currentTypography[`${platform.currentFontRole}_font_id`]
    const font = fonts.find(f => f.id === fontId)
    return font ? `"${font.family}", ${font.category}` : undefined
  }, [currentTypography, platform?.currentFontRole, fonts])

  const currentFontInfo = useMemo(() => {
    if (!currentTypography || !platform?.currentFontRole) return null
    const fontId = currentTypography[`${platform.currentFontRole}_font_id`]
    const font = fonts.find(f => f.id === fontId)
    return font ? {
      name: font.family,
      role: platform.currentFontRole,
      category: font.category
    } : null
  }, [currentTypography, platform?.currentFontRole, fonts])

  const viewTabs = [
    { id: 'scale', label: 'Scale View' },
    { id: 'styles', label: 'Styles View' }
  ]

  // Early return if conditions aren't met
  if (!currentBrand) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">Please select a brand</h3>
          <p className="text-muted-foreground mb-4">
            Select a brand to view its typography settings
          </p>
        </div>
      </div>
    )
  }

  if (!platformSetting || !platform || !activePlatform) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">
            {platformSettings.length === 0 ? "No platforms available" : "No platform selected"}
          </h3>
          <p className="text-muted-foreground mb-4">
            {platformSettings.length === 0 
              ? "Create a platform to get started with typography settings"
              : "Select a platform to view its typography settings"}
          </p>
          {platformSettings.length === 0 && (
            <Button 
              onClick={() => router.push('/platforms/new')}
              className="mt-2"
            >
              Create Platform
            </Button>
          )}
        </div>
      </div>
    )
  }

  // Now we can safely use these values
  const { scaleMethod, scale, distanceScale } = platform
  const typographyUnit = platformSetting.units.typography
  const scaleValues = getScaleValues(activePlatform)

  // Calculate the correct base size based on scale method
  let displayBaseSize = scale.baseSize
  if (scaleMethod === 'distance' && distanceScale) {
    const calculated = calculateDistanceBasedSize(
      distanceScale.viewingDistance,
      distanceScale.visualAcuity,
      distanceScale.meanLengthRatio,
      distanceScale.textType,
      distanceScale.lighting,
      distanceScale.ppi
    )
    displayBaseSize = Math.round(calculated * 100) / 100
  } else {
    displayBaseSize = Math.round(scale.baseSize * 100) / 100
  }

  return (
    <div className="relative w-full">
      {currentFontInfo && (
        <div className="mb-4 text-sm">
          <span className="font-medium">Current Font: </span>
          <span>{currentFontInfo.name}</span>
          <span className="text-muted-foreground ml-2">
            ({currentFontInfo.role} font - {currentFontInfo.category})
          </span>
        </div>
      )}
      
      <div className="relative w-full" style={{ 
        fontFamily: fontFamily || 'inherit',
        fontFallback: 'system-ui, -apple-system, sans-serif'
      }}>
        <div className="-mt-[25px] relative w-screen -ml-[calc(50vw-50%)]">
          <Separator className="w-screen" />
        </div>
        
        <div className="flex justify-between items-center pt-6">
          <div className="py-4 text-sm text-muted-foreground">
            Base Size: {displayBaseSize}{typographyUnit}
            {scaleMethod === 'distance' && ' (distance-based)'} • 
            Scale Ratio: {scale.ratio} • 
            Steps Up: {scale.stepsUp} • 
            Steps Down: {scale.stepsDown}
          </div>
          <AnimatedTabs
            tabs={viewTabs}
            defaultTab="scale"
            onChange={(value) => setView(value)}
            layoutId="preview-view-tabs"
          />
        </div>

        <div className="py-4">
          <div className="min-w-0 overflow-x-auto">
            {view === 'scale' ? (
              <ScaleView 
                scaleValues={scaleValues}
                baseSize={displayBaseSize}
                fontFamily={fontFamily}
                typographyUnit={typographyUnit}
              />
            ) : (
              <StylesView 
                typeStyles={platform.typeStyles} 
                scaleValues={scaleValues}
                baseSize={scale.baseSize}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
