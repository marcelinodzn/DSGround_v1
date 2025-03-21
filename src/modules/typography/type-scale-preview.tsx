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
import { getFontCategoryFallback, loadFontOnce, applyFontToElements } from '@/lib/font-utils'

// Helper to create a font loader that's safe and cancellable
const createSafeFontLoader = () => {
  let isCancelled = false;
  
  const load = async (fontFamily: string, url: string, options = {}) => {
    if (isCancelled) return null;
    return loadFontOnce(fontFamily, url, options);
  };
  
  const cancel = () => {
    isCancelled = true;
  };
  
  return { load, cancel };
};

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
    if (!fontFamily || typeof document === 'undefined') return;
    
    // The fontFamily string should be in format: "Font Name, category"
    const fontName = fontFamily.split(',')[0]?.replace(/["']/g, '');
    if (!fontName) return;
    
    console.log(`Using font in preview: ${fontName}`);
    
    // Create a safe font loader that can be cancelled on cleanup
    const fontLoader = createSafeFontLoader();
    
    // Apply the font to all preview containers
    const applyFont = () => {
      try {
        applyFontToElements('.font-preview-container', fontName);
        console.log(`Applied font to all preview containers: ${fontName}`);
      } catch (err) {
        console.error("Error applying font:", err);
      }
    };
    
    // Wait for fonts to be ready before applying
    document.fonts.ready.then(() => {
      console.log(`Fonts ready, applying: ${fontName}`);
      applyFont();
    }).catch(err => {
      console.warn("Error waiting for fonts to be ready:", err);
      // Still try to apply the font even if fonts.ready fails
      applyFont();
    });
    
    // Clean up function
    return () => {
      fontLoader.cancel();
    };
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

// Update the StylesView component to use the Table component for a consistent look with the scale view
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
    const fontLoader = createSafeFontLoader();
    
    const loadFonts = async () => {
      try {
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
        
        // Load each font that exists, but limit to 3 concurrent loads
        // to avoid overwhelming the browser
        const loadFont = async (fontFamily: string) => {
          const font = fonts.find(f => f.family === fontFamily);
          if (!font?.file_url) return;
          
          try {
            console.log(`Loading font for styles: ${font.family}`);
            await fontLoader.load(
              font.family,
              font.file_url,
              {
                weight: font.is_variable ? '1 1000' : `${font.weight || 400}`,
                style: font.style || 'normal',
              }
            );
          } catch (error) {
            console.error(`Error loading font ${font.family}:`, error);
          }
        };
        
        // Load fonts in batches of 3 to prevent performance issues
        const BATCH_SIZE = 3;
        for (let i = 0; i < allFontFamilies.length; i += BATCH_SIZE) {
          const batch = allFontFamilies.slice(i, i + BATCH_SIZE);
          await Promise.allSettled(batch.map(loadFont));
        }
      } catch (error) {
        console.error('Error loading fonts:', error);
      }
    };
    
    loadFonts();
    
    // Cleanup
    return () => {
      fontLoader.cancel();
    };
  }, [typeStyles, fonts, currentBrand?.id, brandTypography]);
  
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Style</TableHead>
          <TableHead>Preview</TableHead>
          <TableHead className="text-right w-[120px]">Size ({typographyUnit})</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
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
          
          // Find the actual font size from the scale values based on the style's scale step
          const scaleValue = scaleValues.find(s => s.label === style.scaleStep);
          const fontSize = style.fontSize || (scaleValue ? scaleValue.size : 16);

          return (
            <TableRow key={style.id}>
              <TableCell className="py-4">
                <div className="space-y-2">
                  <div className="font-medium">
                    {style.name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {font?.family || 'System Font'}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    {font?.is_variable && (
                      <Badge variant="secondary" className="text-[10px] h-4">
                        Variable
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-[10px] h-4">
                      Weight: {style.fontWeight}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] h-4">
                      Scale: {style.scaleStep}
                    </Badge>
                  </div>
                </div>
              </TableCell>
              <TableCell className="py-4">
                <div 
                  className="font-preview-container break-words"
                  style={{ 
                    fontFamily: `${fontFamilyValue} !important`,
                    fontSize: `${fontSize}${typographyUnit}`,
                    fontWeight: style.fontWeight,
                    lineHeight: style.lineHeight,
                    letterSpacing: style.letterSpacing,
                    textTransform: style.textTransform || 'none',
                    fontVariationSettings: font?.is_variable ? `'wght' ${style.fontWeight}` : undefined,
                  }}
                  data-font-name={font?.family}
                >
                  The quick brown fox jumps over the lazy dog
                </div>
              </TableCell>
              <TableCell className="py-4 text-right">
                {fontSize}{typographyUnit}
                <div className="text-xs text-muted-foreground">
                  Line Height: {style.lineHeightUnit === 'multiplier' 
                    ? `${style.lineHeight.toFixed(2)}×` 
                    : `${(style.lineHeight * 100).toFixed(0)}%`}
                  {style.textTransform && style.textTransform !== 'none' && 
                    `, Transform: ${style.textTransform}`}
                </div>
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
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
  // Add loading state to prevent UI blocking
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

  // Get scale values - must be called unconditionally, with safety checks
  const scaleValues = useMemo(() => {
    try {
      return activePlatform ? getScaleValues(activePlatform) : []
    } catch (err) {
      console.error("Error getting scale values:", err)
      setError("Failed to load scale values")
      return []
    }
  }, [
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

  // Current font info - must be called unconditionally with safety checks
  const currentFontInfo = useMemo(() => {
    try {
      if (!currentTypography || !platform?.currentFontRole) return null
      const fontId = currentTypography[`${platform.currentFontRole}_font_id`]
      if (!fontId) return null
      
      const font = fonts.find(f => f.id === fontId)
      return font ? {
        name: font.family,
        role: platform.currentFontRole,
        category: font.category || 'sans-serif'
      } : null
    } catch (err) {
      console.error("Error getting current font info:", err)
      return null
    }
  }, [currentTypography, platform?.currentFontRole, fonts])

  // Font family calculation with safety checks
  const fontFamily = useMemo(() => {
    if (!currentFontInfo) return undefined
    try {
      // Add default fallback fonts if none are found
      const fallbackFonts = getFontCategoryFallback(currentFontInfo.category || 'sans-serif')
      return `"${currentFontInfo.name}", ${fallbackFonts}`
    } catch (err) {
      console.error("Error calculating font family:", err)
      return undefined
    }
  }, [currentFontInfo])

  // Handle DOM side effects for font loading in a separate effect with better error handling
  useEffect(() => {
    if (!fontFamily) return;
    
    try {
      // Extract the fallback part after the comma
      const fallbackFonts = fontFamily.split(',').slice(1).join(',').trim();
      const fontName = fontFamily.split(',')[0].trim().replace(/["']/g, '');
      
      if (typeof document !== 'undefined') {
        // Use requestAnimationFrame to ensure this happens after render
        const id = requestAnimationFrame(() => {
          try {
            const styleEl = document.createElement('style');
            styleEl.textContent = `:root { --fallback-fonts: ${fallbackFonts}; }`;
            document.head.appendChild(styleEl);
            
            // Set the font family on the document root to ensure it loads
            document.documentElement.style.setProperty('--current-font', fontName);
          } catch (err) {
            console.error("Error setting font styles:", err);
          }
        });
        
        // Clean up
        return () => {
          cancelAnimationFrame(id);
        };
      }
    } catch (err) {
      console.error("Error processing font family:", err);
    }
  }, [fontFamily]);

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

  // If there's an error, show it
  if (error) {
    return (
      <div className="w-full">
        <div className="flex items-center justify-center h-[200px] text-red-500">
          <div className="text-center">
            <p className="mb-4">{error}</p>
            <Button 
              onClick={() => window.location.reload()}
            >
              Reload Page
            </Button>
          </div>
        </div>
      </div>
    )
  }

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

  // Safety check for required properties
  if (!platform.scale || !platform.scaleMethod) {
    return (
      <div className="flex items-center justify-center h-[200px] text-amber-500">
        <div className="text-center">
          <p className="mb-4">Platform scale configuration is incomplete</p>
          <Button 
            onClick={() => router.push('/settings/platforms')}
          >
            Configure Platform
          </Button>
        </div>
      </div>
    )
  }

  // Now we can safely use these values - calculate derived state AFTER all hooks
  const { scaleMethod, scale, distanceScale } = platform
  const typographyUnit = platformSetting.units?.typography || 'px'

  // Calculate the correct base size based on scale method with safety checks
  let displayBaseSize = 16 // Default fallback
  try {
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
  } catch (err) {
    console.error("Error calculating base size:", err)
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
            Scale Ratio: {scale.ratio || 1.2} • 
            Steps Up: {scale.stepsUp || 3} • 
            Steps Down: {scale.stepsDown || 2}
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
                key={`scale-view-${platform.id}-${platform.scale.baseSize || 16}-${platform.scale.ratio || 1.2}-${platform.scale.stepsUp || 3}-${platform.scale.stepsDown || 2}-${refreshKey}`}
                baseSize={displayBaseSize}
                fontFamily={fontFamily}
                typographyUnit={typographyUnit}
                platformId={platform.id}
                scaleValues={scaleValues || []}
              />
            ) : (
              <StylesView 
                typeStyles={platform.typeStyles || []} 
                scaleValues={scaleValues || []}
                baseSize={scale.baseSize || 16}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
