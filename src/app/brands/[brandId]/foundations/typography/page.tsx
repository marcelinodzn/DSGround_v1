'use client'

import { useEffect } from "react"
import { useLayout } from "@/contexts/layout-context"
import { Button } from "@/components/ui/button"
import { Maximize2, Minimize2 } from 'lucide-react'
import { cn } from "@/lib/utils"
import { useBrandStore } from "@/store/brand-store"
import { useFontStore } from "@/store/font-store"
import { useTypographyStore } from "@/store/typography"
import { usePlatformStore } from "@/store/platform-store"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { useRouter } from 'next/navigation'
import { supabase } from "@/lib/supabase"
import { TypographyDebugMode } from "./debug-mode"
import { loadFontOnce, getFontCategoryFallback } from "@/lib/font-utils"
import { ErrorBoundary, FallbackProps } from "react-error-boundary"
import React from "react"

// Make sure this is the correct route being accessed
console.log('Rendering typography page at: /brands/[brandId]/foundations/typography')

const FontLoadingErrorFallback = ({ error, resetErrorBoundary }: FallbackProps) => {
  return (
    <div className="p-6 bg-red-50 border border-red-200 rounded-md">
      <h3 className="text-lg font-medium text-red-800">Error loading typography</h3>
      <p className="mt-2 text-sm text-red-500">{error.message}</p>
      <Button 
        variant="outline" 
        className="mt-4" 
        onClick={resetErrorBoundary}
      >
        Try Again
      </Button>
    </div>
  )
}

interface BrandFoundationsTypographyPageProps {
  params: {
    brandId: string
  }
}

const fontTypes = ['primary', 'secondary', 'tertiary'] as const
type FontType = typeof fontTypes[number]

export default function BrandFoundationsTypographyPage({ params }: BrandFoundationsTypographyPageProps) {
  const { brandId } = params
  const router = useRouter()
  const { isFullscreen, setIsFullscreen } = useLayout()
  const { currentBrand, fetchBrand } = useBrandStore()
  const { fonts, loadFonts, brandTypography, loadBrandTypography, saveBrandTypography } = useFontStore()
  const { currentPlatform, fetchPlatformsByBrand } = usePlatformStore()
  const currentTypography = currentBrand?.id ? brandTypography[currentBrand.id] : null
  
  useEffect(() => {
    // Use a ref to track if initialization has already been attempted
    const initAttemptedRef = React.useRef(false);
    
    if (initAttemptedRef.current) {
      console.log("Typography page initialization already attempted, skipping");
      return;
    }
    
    initAttemptedRef.current = true;
    
    const initPage = async () => {
      console.log("Initializing typography page");
      try {
        // Wrap these calls in a try-catch to prevent uncaught exceptions
        if (brandId) {
          // Validate brandId to ensure it's a valid UUID format
          if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(brandId)) {
            console.error('Invalid brand ID format:', brandId);
            toast.error('Invalid brand ID format');
            router.push('/404');
            return;
          }
          
          console.log(`Fetching brand with ID: ${brandId}`);
          await fetchBrand(brandId);
          
          // Verify the brand was fetched successfully
          const brand = useBrandStore.getState().currentBrand;
          if (!brand) {
            console.error('Brand not found:', brandId);
            toast.error('Brand not found');
            router.push('/404');
            return;
          }
          
          console.log("Loading fonts");
          await loadFonts();
          
          console.log(`Loading typography for brand: ${brandId}`);
          await loadBrandTypography(brandId);
          
          // Only load fonts if typography data exists
          const typography = brandTypography[brandId];
          
          if (typography) {
            const fontIds = [
              typography.primary_font_id,
              typography.secondary_font_id, 
              typography.tertiary_font_id
            ].filter(Boolean);
            
            if (fontIds.length === 0) {
              console.log("No fonts selected for this brand");
              return;
            }
            
            console.log(`Loading ${fontIds.length} fonts for brand typography`);
            const allFonts = useFontStore.getState().fonts;
            
            // Load each font one at a time with a maximum of 3 attempts in parallel
            // Use Promise.allSettled to prevent one failing font from crashing the app
            const loadPromises = fontIds.map(fontId => {
              const font = allFonts.find(f => f.id === fontId);
              if (!font?.file_url) {
                console.warn(`Font with ID ${fontId} not found or has no URL`);
                return Promise.resolve(null);
              }
              
              console.log(`Loading font: ${font.family}`);
              // Use our new utility for safe font loading
              return loadFontOnce(
                font.family,
                font.file_url,
                {
                  weight: font.is_variable ? '1 1000' : `${font.weight || 400}`,
                  style: font.style || 'normal',
                }
              );
            });
            
            // Wait for all fonts to load (or fail gracefully)
            const results = await Promise.allSettled(loadPromises);
            
            // Log the results of font loading
            results.forEach((result, index) => {
              if (result.status === 'fulfilled') {
                if (result.value) {
                  console.log(`Font ${index + 1} loaded successfully`);
                } else {
                  console.warn(`Font ${index + 1} loading returned null`);
                }
              } else {
                console.error(`Font ${index + 1} loading failed:`, result.reason);
              }
            });
            
            console.log("All font loading attempts completed");
          } else {
            console.log(`No typography data for brand ${brandId}`);
          }
        }
      } catch (error) {
        console.error('Error initializing typography page:', error);
        toast.error('Failed to load typography settings');
        if (error instanceof Error && error.message.includes('404')) {
          router.push('/404');
        }
      }
    }
    
    // Set a timeout to avoid infinite loading if something goes wrong
    const initTimeout = setTimeout(() => {
      toast.error('Typography loading timed out');
    }, 10000);
    
    initPage().finally(() => clearTimeout(initTimeout));
    
    // Only run this effect once on component mount
  }, []);

  useEffect(() => {
    console.log('Route Debug:', {
      currentURL: window.location.pathname,
      expectedPattern: '/brands/[brandId]/foundations/typography',
      actualBrandId: brandId,
      params: params
    })
  }, [brandId, params])

  const handleFontChange = async (fontId: string, role: 'primary' | 'secondary' | 'tertiary') => {
    if (!currentBrand?.id) return
    
    try {
      // If selecting 'none', set to null
      const actualFontId = fontId === 'none' ? null : fontId
      
      await useFontStore.getState().saveBrandTypography(currentBrand.id, {
        brand_id: currentBrand.id,
        [`${role}_font_id`]: actualFontId
      })
      
      // If a font was selected, ensure it's loaded
      if (actualFontId) {
        const font = fonts.find(f => f.id === actualFontId)
        if (font?.file_url) {
          // Use our utility for safe font loading
          await loadFontOnce(
            font.family,
            font.file_url,
            {
              weight: font.is_variable ? '1 1000' : `${font.weight || 400}`,
              style: font.style || 'normal',
              force: true // Force reload to ensure it's available
            }
          )
        }
      }
    } catch (error) {
      console.error('Error changing font:', error)
      toast.error('Failed to update font')
    }
  }

  if (!currentBrand) {
    return <div>Loading...</div>
  }

  const getFontFamily = (fontId: string | null | undefined): string => {
    if (!fontId) return 'system-ui, sans-serif' // Default fallback
    
    const font = fonts.find(f => f.id === fontId)
    if (!font) return 'system-ui, sans-serif'
    
    const fallbackFonts = getFontCategoryFallback(font.category || 'sans-serif')
    return `"${font.family}", ${fallbackFonts}`
  }
  
  const getFontProperties = (fontId: string | null | undefined) => {
    if (!fontId) return null
    
    const font = fonts.find(f => f.id === fontId)
    if (!font) return null
    
    return {
      weight: font.weight || 400,
      style: font.style || 'normal',
      format: font.format || 'ttf',
      variable: !!font.is_variable
    }
  }

  return (
    <div className={cn(
      "h-full flex transition-all duration-300 ease-in-out",
      isFullscreen && "fixed inset-0 bg-background z-50 overflow-y-auto p-6 max-w-[100vw]"
    )}>
      <div className="flex-1 min-w-0 max-w-full">
        <div className={cn(
          "flex items-center justify-between mb-6",
          isFullscreen ? "" : "pt-6 px-6"
        )}>
          <div>
            <h1 className="text-[30px] font-bold">Typography</h1>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="ml-2"
          >
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </Button>
        </div>

        <ErrorBoundary
          FallbackComponent={FontLoadingErrorFallback}
          onReset={() => {
            // Reset the error boundary
            loadFonts()
            if (currentBrand?.id) {
              loadBrandTypography(currentBrand.id)
            }
          }}
        >
          <div className="py-8 px-6">
            <p className="text-muted-foreground mb-8">
              Select the typefaces that will be used across your brand. For optimal consistency, we recommend using no more than two typefaces.
            </p>

            <div className="w-full">
              <div className="grid grid-cols-12 gap-4 mb-4 text-sm text-muted-foreground">
                <div className="col-span-2">Role</div>
                <div className="col-span-2">Typeface</div>
                <div className="col-span-6">Preview</div>
                <div className="col-span-1 text-right">Properties</div>
                <div className="col-span-1 text-right">Format</div>
              </div>

              <div className="space-y-4">
                {/* Primary Font Row */}
                <div className="grid grid-cols-12 gap-4 items-center py-4 border-t">
                  <div className="col-span-2">
                    <div className="font-medium text-foreground">Primary</div>
                    <div className="text-sm text-muted-foreground">Main brand typeface</div>
                  </div>
                  <div className="col-span-2">
                    <Select
                      value={currentTypography?.primary_font_id || 'none'}
                      onValueChange={(value) => handleFontChange(value, 'primary')}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select primary font" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {fonts.map((font) => (
                          <SelectItem key={font.id} value={font.id}>
                            {font.family}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-6">
                    {currentTypography?.primary_font_id && (
                      <div 
                        className="text-2xl md:text-3xl py-6"
                        style={{
                          fontFamily: getFontFamily(currentTypography?.primary_font_id)
                        }}
                      >
                        The quick brown fox jumps over the lazy dog
                      </div>
                    )}
                  </div>
                  <div className="col-span-1 text-xs text-right">
                    {(() => {
                      const props = getFontProperties(currentTypography?.primary_font_id)
                      return props ? (
                        <>
                          <div>{props.weight}</div>
                          <div>{props.style}</div>
                        </>
                      ) : null
                    })()}
                  </div>
                  <div className="col-span-1 flex flex-col items-end gap-1">
                    {(() => {
                      const props = getFontProperties(currentTypography?.primary_font_id)
                      return props ? (
                        <>
                          <div className="text-sm font-medium">{props.format}</div>
                          <div className={cn(
                            "text-xs px-2 py-1 rounded",
                            props.variable
                              ? "bg-blue-500 text-white"
                              : "bg-gray-100 text-gray-900"
                          )}>
                            {props.variable ? 'Variable' : 'Static'}
                          </div>
                        </>
                      ) : null
                    })()}
                  </div>
                </div>

                {/* Secondary Font Row */}
                <div className="grid grid-cols-12 gap-4 items-center py-4 border-t">
                  <div className="col-span-2">
                    <div className="font-medium text-foreground">Secondary</div>
                    <div className="text-sm text-muted-foreground">Supporting typeface</div>
                  </div>
                  <div className="col-span-2">
                    <Select
                      value={currentTypography?.secondary_font_id || 'none'}
                      onValueChange={(value) => handleFontChange(value, 'secondary')}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select secondary font" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {fonts.map((font) => (
                          <SelectItem key={font.id} value={font.id}>
                            {font.family}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-6">
                    {currentTypography?.secondary_font_id && (
                      <div 
                        className="text-2xl md:text-3xl py-6"
                        style={{
                          fontFamily: getFontFamily(currentTypography?.secondary_font_id)
                        }}
                      >
                        The quick brown fox jumps over the lazy dog
                      </div>
                    )}
                  </div>
                  <div className="col-span-1 text-xs text-right">
                    {(() => {
                      const props = getFontProperties(currentTypography?.secondary_font_id)
                      return props ? (
                        <>
                          <div>{props.weight}</div>
                          <div>{props.style}</div>
                        </>
                      ) : null
                    })()}
                  </div>
                  <div className="col-span-1 flex flex-col items-end gap-1">
                    {(() => {
                      const props = getFontProperties(currentTypography?.secondary_font_id)
                      return props ? (
                        <>
                          <div className="text-sm font-medium">{props.format}</div>
                          <div className={cn(
                            "text-xs px-2 py-1 rounded",
                            props.variable
                              ? "bg-blue-500 text-white"
                              : "bg-gray-100 text-gray-900"
                          )}>
                            {props.variable ? 'Variable' : 'Static'}
                          </div>
                        </>
                      ) : null
                    })()}
                  </div>
                </div>

                {/* Tertiary Font Row */}
                <div className="grid grid-cols-12 gap-4 items-center py-4 border-t">
                  <div className="col-span-2">
                    <div className="font-medium text-foreground">Tertiary</div>
                    <div className="text-sm text-muted-foreground">Additional typeface</div>
                  </div>
                  <div className="col-span-2">
                    <Select
                      value={currentTypography?.tertiary_font_id || 'none'}
                      onValueChange={(value) => handleFontChange(value, 'tertiary')}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select tertiary font" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {fonts.map((font) => (
                          <SelectItem key={font.id} value={font.id}>
                            {font.family}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-6">
                    {currentTypography?.tertiary_font_id && (
                      <div 
                        className="text-2xl md:text-3xl py-6"
                        style={{
                          fontFamily: getFontFamily(currentTypography?.tertiary_font_id)
                        }}
                      >
                        The quick brown fox jumps over the lazy dog
                      </div>
                    )}
                  </div>
                  <div className="col-span-1 text-xs text-right">
                    {(() => {
                      const props = getFontProperties(currentTypography?.tertiary_font_id)
                      return props ? (
                        <>
                          <div>{props.weight}</div>
                          <div>{props.style}</div>
                        </>
                      ) : null
                    })()}
                  </div>
                  <div className="col-span-1 flex flex-col items-end gap-1">
                    {(() => {
                      const props = getFontProperties(currentTypography?.tertiary_font_id)
                      return props ? (
                        <>
                          <div className="text-sm font-medium">{props.format}</div>
                          <div className={cn(
                            "text-xs px-2 py-1 rounded",
                            props.variable
                              ? "bg-blue-500 text-white"
                              : "bg-gray-100 text-gray-900"
                          )}>
                            {props.variable ? 'Variable' : 'Static'}
                          </div>
                        </>
                      ) : null
                    })()}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border flex items-center gap-2">
              <div className="text-amber-500">⚠️</div>
              <p className="text-sm text-muted-foreground">
                Using a tertiary typeface is not recommended. Consider using only primary and secondary typefaces for better brand consistency.
              </p>
            </div>
          </div>
        </ErrorBoundary>
      </div>
      
      {/* Add the debug mode component */}
      <TypographyDebugMode />
    </div>
  )
}
