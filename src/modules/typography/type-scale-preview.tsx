import { useState, useMemo, useEffect, useCallback } from "react"
import { useTypographyStore, TypeStyle } from "@/store/typography"
import { usePlatformStore, Platform } from "@/store/platform-store"
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
  platformId?: string
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
const ScaleView = dynamic(() => Promise.resolve(({ baseSize, fontFamily, typographyUnit, platformId }: ScaleViewProps & { platformId?: string }) => {
  const { getScaleValues } = useTypographyStore()
  
  // Get scale values directly from the store
  const scaleValues = useMemo(() => {
    if (!platformId) return [];
    const values = getScaleValues(platformId);
    
    // Ensure all size values are rounded
    const roundedValues = values.map(value => ({
      ...value,
      size: Math.round(value.size)
    }));
    
    console.log(`ScaleView fetched ${roundedValues.length} scale values for platform ${platformId}`);
    return roundedValues;
  }, [platformId, getScaleValues])

  // Add debugging to log received props
  useEffect(() => {
    console.log("ScaleView received props:", {
      platformId,
      scaleValuesCount: scaleValues?.length || 0,
      baseSize,
      fontFamily,
      typographyUnit,
      scaleValues
    });
  }, [scaleValues, baseSize, fontFamily, typographyUnit, platformId]);

  // Load font if provided and ensure it's available for the preview
  useEffect(() => {
    if (fontFamily && typeof document !== 'undefined') {
      // The fontFamily string should be in format: "Font Name, category"
      const fontName = fontFamily.split(',')[0]?.replace(/["']/g, '');
      if (fontName) {
        console.log(`Using font in preview: ${fontName}`);
        
        // Forcibly load the font to ensure it's available
        document.fonts.ready.then(() => {
          console.log(`Fonts ready, applying: ${fontName}`);
          
          // Add a style tag with @font-face to ensure the font is prioritized
          const styleTag = document.createElement('style');
          styleTag.textContent = `
            .font-preview-container {
              font-family: "${fontName}", var(--fallback-fonts);
            }
          `;
          document.head.appendChild(styleTag);
          
          // Force browser to recognize font change
          setTimeout(() => {
            // Find and update all preview containers
            document.querySelectorAll('.font-preview-container').forEach(element => {
              // Apply inline style directly to ensure it overrides any cascading styles
              (element as HTMLElement).style.fontFamily = `"${fontName}", var(--fallback-fonts)`;
              element.classList.add('font-loaded');
              
              // Force a repaint
              const currentDisplay = (element as HTMLElement).style.display;
              (element as HTMLElement).style.display = 'none';
              void element.offsetHeight; // Trigger a reflow
              (element as HTMLElement).style.display = currentDisplay;
            });
            console.log(`Applied font to all preview containers: ${fontName}`);
          }, 100);
        });
      }
    }
  }, [fontFamily]);

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
              <div className="min-w-0 font-preview-container">
                <div 
                  className="font-preview-text overflow-hidden" 
                  style={{ 
                    fontSize: `${item?.size || 16}px`,
                    lineHeight: 1.2,
                    wordBreak: 'break-word',
                    overflowWrap: 'break-word',
                    whiteSpace: 'normal',
                    minHeight: `${Math.max((item?.size || 16) * 1.2, 48)}px`,
                    display: 'flex',
                    alignItems: 'center'
                  }} 
                >
                  <span 
                    style={{
                      fontFamily: fontFamily ? `${fontFamily} !important` : 'inherit'
                    }}
                    data-font-name={fontFamily?.split(',')[0]?.replace(/["']/g, '')}
                  >
                    The quick brown fox jumps over the lazy dog
                  </span>
                </div>
              </div>
            </TableCell>
            <TableCell className="py-6 text-right">
              {Math.round(item?.size || 16)}{typographyUnit}
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
  const { fonts, brandTypography } = useFontStore()
  const { currentBrand } = useBrandStore()
  
  // Get the current platform and font information
  const currentPlatformSettings = platformSettings.find(p => p.id === currentPlatform)
  const typographyUnit = currentPlatformSettings?.units.typography || 'rem'
  
  // Get current typography and platform for font selection
  const currentTypography = useMemo(() => 
    currentBrand?.id ? brandTypography[currentBrand.id] : null
  , [currentBrand?.id, brandTypography])
  
  const platform = useMemo(() => 
    platforms.find(p => p.id === currentPlatform)
  , [platforms, currentPlatform])
  
  // Load all relevant fonts when component mounts
  useEffect(() => {
    const loadFonts = async () => {
      // First load style-specific fonts
      const styleFontFamilies = typeStyles.map(style => style.fontFamily);
      
      // Then also load brand fonts if we have a current brand
      let brandFonts: string[] = [];
      if (currentBrand?.id && brandTypography[currentBrand.id]) {
        const typography = brandTypography[currentBrand.id];
        const fontIds = [
          typography.primary_font_id, 
          typography.secondary_font_id, 
          typography.tertiary_font_id
        ].filter(Boolean);
        
        // Find font families for each font ID
        brandFonts = fontIds.map(id => {
          const font = fonts.find(f => f.id === id);
          return font ? font.family : '';
        }).filter(Boolean);
      }
      
      // Combine all unique font families
      const allFontFamilies = [...new Set([...styleFontFamilies, ...brandFonts])];
      
      // Load each font that exists
      for (const fontFamily of allFontFamilies) {
        const font = fonts.find(f => f.family === fontFamily);
        if (!font?.file_url) continue;
        
        try {
          console.log(`Loading font for styles: ${font.family}`);
          const fontFace = new FontFace(
            font.family,
            `url(${font.file_url})`,
            {
              weight: font.is_variable ? '1 1000' : `${font.weight || 400}`,
              style: font.style || 'normal',
            }
          );
          
          const loadedFont = await fontFace.load();
          document.fonts.add(loadedFont);
          console.log(`Font loaded successfully: ${font.family}`);
        } catch (error) {
          console.error(`Error loading font ${font.family}:`, error);
        }
      }
    };
    
    loadFonts();
  }, [typeStyles, fonts, currentBrand?.id, brandTypography])
  
  return (
    <div className="space-y-8">
      {typeStyles.map((style, index) => {
        // First try to find the style font
        let font = fonts.find(f => f.family === style.fontFamily);
        
        // If not found, and we have current typography, try to use the current font role
        if (!font && currentBrand?.id && currentTypography && platform?.currentFontRole) {
          const fontId = currentTypography[`${platform.currentFontRole}_font_id`];
          const roleFontMatch = fonts.find(f => f.id === fontId);
          if (roleFontMatch) {
            font = roleFontMatch;
            console.log(`Using current font role (${platform.currentFontRole}) font instead of style font:`, font.family);
          }
        }
        
        // Calculate fallback fonts
        const fallbackFonts = getFontCategoryFallback(font?.category || 'sans-serif');
        const fontFamilyValue = font ? `"${font.family}", ${fallbackFonts}` : `system-ui, ${fallbackFonts}`;

        return (
          <div key={index} className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="text-sm font-medium text-muted-foreground">
                  {style.name}
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-xs text-muted-foreground">
                    {font?.family || 'System Font'}
                  </div>
                  {font?.is_variable && (
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
                {style.scaleStep}px
              </div>
            </div>
            <div 
              className="font-preview-container break-words"
              style={{ 
                fontFamily: `${fontFamilyValue} !important`,
                fontSize: `${style.scaleStep}px`,
                fontWeight: style.fontWeight,
                lineHeight: style.lineHeight,
                letterSpacing: style.letterSpacing,
                fontVariationSettings: font?.is_variable ? `'wght' ${style.fontWeight}` : undefined,
              }}
              data-font-name={font?.family}
            >
              The quick brown fox jumps over the lazy dog
            </div>
          </div>
        )
      })}
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

  // Always define these memoized values unconditionally
  const currentTypography = useMemo(() => 
    currentBrand?.id ? brandTypography[currentBrand.id] : null
  , [currentBrand?.id, brandTypography])

  // Compute active platform - always define this
  const activePlatform = useMemo(() => {
    if (currentPlatform && platformSettings.find(p => p.id === currentPlatform)) {
      return currentPlatform
    }
    return platformSettings.length > 0 ? platformSettings[0].id : ''
  }, [currentPlatform, platformSettings])

  // Get platform details - must define these unconditionally
  const platform = useMemo(() => 
    platforms.find(p => p.id === currentPlatform)
  , [platforms, currentPlatform])

  const platformSetting = useMemo(() => 
    platformSettings.find(p => p.id === currentPlatform)
  , [platformSettings, currentPlatform])

  // Get scale values - must be called unconditionally
  const scaleValues = useMemo(() => 
    activePlatform ? getScaleValues(activePlatform) : []
  , [
    activePlatform, 
    getScaleValues,
    // Add dependencies for scale properties to ensure recalculation when they change
    platform?.scale?.baseSize,
    platform?.scale?.ratio,
    platform?.scale?.stepsUp,
    platform?.scale?.stepsDown,
    platform?.scaleMethod
  ])

  // Set initial platform if none selected
  useEffect(() => {
    if (!currentPlatform && platformSettings.length > 0) {
      setCurrentPlatform(platformSettings[0].id)
    }
  }, [currentPlatform, platformSettings, setCurrentPlatform])

  // Fetch platform typography settings if not already loaded
  useEffect(() => {
    if (activePlatform && currentBrand?.id) {
      loadBrandTypography(currentBrand.id)
      fetchPlatformsByBrand(currentBrand.id)
    }
  }, [activePlatform, currentBrand, loadBrandTypography, fetchPlatformsByBrand])

  // Compute font family - must be called unconditionally
  const fontFamily = useMemo(() => {
    if (!currentTypography || !platform?.currentFontRole) return undefined
    const fontId = currentTypography[`${platform.currentFontRole}_font_id`]
    if (!fontId) return undefined
    
    const font = fonts.find(f => f.id === fontId)
    
    // Define fallback fonts based on category
    let fallbackFonts = 'sans-serif';
    if (font?.category) {
      switch(font.category) {
        case 'serif': fallbackFonts = 'Georgia, Times, serif'; break;
        case 'monospace': fallbackFonts = 'Consolas, "Courier New", monospace'; break;
        case 'display': fallbackFonts = 'Impact, fantasy'; break;
        case 'handwriting': fallbackFonts = 'cursive'; break;
        default: fallbackFonts = 'Arial, Helvetica, sans-serif';
      }
    }
    
    return font ? `"${font.family}", ${fallbackFonts}` : undefined
  }, [currentTypography, platform?.currentFontRole, fonts])

  // Handle DOM side effects for font loading in a separate effect
  useEffect(() => {
    if (!fontFamily) return;
    
    // Extract the fallback part after the comma
    const fallbackFonts = fontFamily.split(',').slice(1).join(',').trim();
    const fontName = fontFamily.split(',')[0].trim();
    
    if (typeof document !== 'undefined') {
      // Use requestAnimationFrame to ensure this happens after render
      const id = requestAnimationFrame(() => {
        const styleEl = document.createElement('style');
        styleEl.textContent = `:root { --fallback-fonts: ${fallbackFonts}; }`;
        document.head.appendChild(styleEl);
        
        // Set the font family on the document root to ensure it loads
        document.documentElement.style.setProperty('--current-font', fontName);
      });
      
      // Clean up
      return () => {
        cancelAnimationFrame(id);
      };
    }
  }, [fontFamily]);

  // Current font info - must be called unconditionally
  const currentFontInfo = useMemo(() => {
    if (!currentTypography || !platform?.currentFontRole) return null
    const fontId = currentTypography[`${platform.currentFontRole}_font_id`]
    if (!fontId) return null
    
    const font = fonts.find(f => f.id === fontId)
    return font ? {
      name: font.family,
      role: platform.currentFontRole,
      category: font.category || 'sans-serif'
    } : null
  }, [currentTypography, platform?.currentFontRole, fonts])

  const viewTabs = [
    { id: 'scale', label: 'Scale View' },
    { id: 'styles', label: 'Styles View' }
  ]

  // Force refresh when scale values change
  const [refreshKey, setRefreshKey] = useState(0);
  
  useEffect(() => {
    if (platform?.scale) {
      // Force a refresh when any scale value changes
      setRefreshKey(prev => prev + 1);
      console.log("Forcing TypeScalePreview refresh due to scale change:", {
        baseSize: platform.scale.baseSize,
        ratio: platform.scale.ratio,
        stepsUp: platform.scale.stepsUp,
        stepsDown: platform.scale.stepsDown
      });
    }
  }, [
    platform?.scale?.baseSize,
    platform?.scale?.ratio, 
    platform?.scale?.stepsUp, 
    platform?.scale?.stepsDown
  ]);

  // Early return if no platforms are available - AFTER all hooks are called
  if (platformSettings.length === 0) {
    return (
      <div className="w-full">
        <div className="flex items-center justify-center h-[200px] text-muted-foreground">
          {currentBrand ? (
            <div className="text-center">
              <p className="mb-4">No platforms have been created yet.</p>
              <Button 
                onClick={() => router.push('/settings/platforms')}
              >
                Create Platform
              </Button>
            </div>
          ) : (
            <div className="text-center">
              <p className="mb-4">Please select a brand first.</p>
              <Button 
                onClick={() => router.push('/settings/brand')}
              >
                Select Brand
              </Button>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Early return if platform is not available - AFTER all hooks are called
  if (!platform || !platformSetting) {
    return (
      <div className="flex items-center justify-center h-[200px] text-muted-foreground">
        Please select a platform to view typography scale
      </div>
    )
  }

  // Now we can safely use these values - calculate derived state AFTER all hooks
  const { scaleMethod, scale, distanceScale } = platform
  const typographyUnit = platformSetting.units.typography

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

  // Add debugging to log the scale values
  console.log("TypeScalePreview - Scale Values:", {
    platform: platform.id,
    scaleMethod: platform.scaleMethod,
    baseSize: platform.scale?.baseSize,
    ratio: platform.scale?.ratio,
    stepsUp: platform.scale?.stepsUp,
    stepsDown: platform.scale?.stepsDown,
    valueCount: scaleValues?.length || 0,
    values: scaleValues
  });

  return (
    <div className="relative w-full">
      <div className="relative w-full">
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
            {platform?.currentFontRole && fontFamily && (
              <>
                <span className="ml-2">•</span>
                <span className="ml-2 text-xs border px-2 py-1 rounded bg-gray-50 dark:bg-gray-800">
                  Using <span className="font-medium">{platform.currentFontRole}</span> font: {fontFamily.split(',')[0].replace(/['"]/g, '')}
                </span>
              </>
            )}
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
                key={`scale-view-${platform.id}-${platform.scale.baseSize}-${platform.scale.ratio}-${platform.scale.stepsUp}-${platform.scale.stepsDown}-${refreshKey}`}
                baseSize={displayBaseSize}
                fontFamily={fontFamily}
                typographyUnit={typographyUnit}
                platformId={platform.id}
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
