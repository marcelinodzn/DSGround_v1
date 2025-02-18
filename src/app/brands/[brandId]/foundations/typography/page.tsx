'use client'

import { useEffect } from "react"
import { useLayout } from "@/contexts/layout-context"
import { Button } from "@/components/ui/button"
import { Maximize2, Minimize2 } from 'lucide-react'
import { cn } from "@/lib/utils"
import { useBrandStore } from "@/store/brand-store"
import { useFontStore } from "@/store/font-store"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { useRouter } from 'next/navigation'
import { supabase } from "@/lib/supabase"

// Make sure this is the correct route being accessed
console.log('Rendering typography page at: /brands/[brandId]/foundations/typography')

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
  const { fonts, loadFonts, brandTypography, saveBrandTypography, loadBrandTypography } = useFontStore()

  console.log('Current route:', window.location.pathname)
  console.log('Brand ID from params:', brandId)
  console.log('Current brand:', currentBrand)

  useEffect(() => {
    const initPage = async () => {
      if (brandId) {
        try {
          await Promise.all([
            fetchBrand(brandId),
            loadFonts(),
            loadBrandTypography(brandId)
          ])
        } catch (error) {
          console.error('Error initializing page:', error)
          toast.error('Failed to load typography settings')
          if (error instanceof Error && error.message.includes('404')) {
            router.push('/404')
          }
        }
      }
    }
    initPage()
  }, [brandId, fetchBrand, loadFonts, loadBrandTypography])

  useEffect(() => {
    console.log('Route Debug:', {
      currentURL: window.location.pathname,
      expectedPattern: '/brands/[brandId]/foundations/typography',
      actualBrandId: brandId,
      params: params
    })
  }, [brandId, params])

  const handleFontChange = async (fontId: string | null, type: FontType) => {
    if (!brandId) return

    try {
      const updatedTypography = {
        brand_id: brandId,
        [`${type}_font_id`]: fontId,
        updated_at: new Date().toISOString()
      }

      if (fontId === null) {
        // If setting to none, make sure we're sending a valid null value
        updatedTypography[`${type}_font_id`] = null
      }

      await saveBrandTypography(brandId, updatedTypography)
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} font updated successfully`)
    } catch (error) {
      console.error('Error saving typography:', error)
      toast.error('Failed to update font selection')
    }
  }

  if (!currentBrand) {
    return <div>Loading...</div>
  }

  const currentTypography = brandTypography[brandId]

  const getFontFamily = (fontId: string | null | undefined) => {
    if (!fontId) return 'inherit'
    const font = fonts.find(f => f.id === fontId)
    return font ? `"${font.family}", sans-serif` : 'inherit'
  }

  // Update the getFontProperties function
  const getFontProperties = (fontId: string | null | undefined) => {
    if (!fontId || fontId === 'none') return { weight: '400', style: 'normal', format: 'TTF', variable: false }
    const font = fonts.find(f => f.id === fontId)
    
    // Add debug logging to see font properties
    console.log('Font properties:', font)
    
    return {
      weight: font?.is_variable ? '1-1000' : (font?.weight?.toString() || '400'),
      style: font?.style || 'normal',
      format: font?.format?.toUpperCase() || 'TTF',
      // Check both is_variable flag and format for variable fonts
      variable: font?.is_variable || 
               (font?.format?.toLowerCase().includes('variable') || 
                font?.format?.toLowerCase().includes('var')) || 
               false
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
            <h1 className="text-[30px] font-bold">{currentBrand.name} - Typography</h1>
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
                    onValueChange={(value) => handleFontChange(value === 'none' ? null : value, 'primary')}
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
                  <div 
                    className="text-2xl md:text-3xl py-6"
                    style={{
                      fontFamily: getFontFamily(currentTypography?.primary_font_id)
                    }}
                  >
                    The quick brown fox jumps over the lazy dog
                  </div>
                </div>
                <div className="col-span-1 text-xs text-right">
                  {(() => {
                    const props = getFontProperties(currentTypography?.primary_font_id)
                    return (
                      <>
                        <div>{props.weight}</div>
                        <div>{props.style}</div>
                      </>
                    )
                  })()}
                </div>
                <div className="col-span-1 flex flex-col items-end gap-1">
                  <div className="text-sm font-medium">{getFontProperties(currentTypography?.primary_font_id).format}</div>
                  <div className={cn(
                    "text-xs px-2 py-1 rounded",
                    getFontProperties(currentTypography?.primary_font_id).variable
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 text-gray-900"
                  )}>
                    {getFontProperties(currentTypography?.primary_font_id).variable ? 'Variable' : 'Static'}
                  </div>
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
                    value={currentTypography?.secondary_font_id || undefined}
                    onValueChange={(value) => handleFontChange(value || null, 'secondary')}
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
                  <div 
                    className="text-2xl md:text-3xl py-6"
                    style={{
                      fontFamily: getFontFamily(currentTypography?.secondary_font_id)
                    }}
                  >
                    The quick brown fox jumps over the lazy dog
                  </div>
                </div>
                <div className="col-span-1 text-xs text-right">
                  {(() => {
                    const props = getFontProperties(currentTypography?.secondary_font_id)
                    return (
                      <>
                        <div>{props.weight}</div>
                        <div>{props.style}</div>
                      </>
                    )
                  })()}
                </div>
                <div className="col-span-1 flex flex-col items-end gap-1">
                  <div className="text-sm font-medium">{getFontProperties(currentTypography?.secondary_font_id).format}</div>
                  <div className={cn(
                    "text-xs px-2 py-1 rounded",
                    getFontProperties(currentTypography?.secondary_font_id).variable
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 text-gray-900"
                  )}>
                    {getFontProperties(currentTypography?.secondary_font_id).variable ? 'Variable' : 'Static'}
                  </div>
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
                    value={currentTypography?.tertiary_font_id || undefined}
                    onValueChange={(value) => handleFontChange(value || null, 'tertiary')}
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
                  <div 
                    className="text-2xl md:text-3xl py-6"
                    style={{
                      fontFamily: getFontFamily(currentTypography?.tertiary_font_id)
                    }}
                  >
                    The quick brown fox jumps over the lazy dog
                  </div>
                </div>
                <div className="col-span-1 text-xs text-right">
                  {(() => {
                    const props = getFontProperties(currentTypography?.tertiary_font_id)
                    return (
                      <>
                        <div>{props.weight}</div>
                        <div>{props.style}</div>
                      </>
                    )
                  })()}
                </div>
                <div className="col-span-1 flex flex-col items-end gap-1">
                  <div className="text-sm font-medium">{getFontProperties(currentTypography?.tertiary_font_id).format}</div>
                  <div className={cn(
                    "text-xs px-2 py-1 rounded",
                    getFontProperties(currentTypography?.tertiary_font_id).variable
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 text-gray-900"
                  )}>
                    {getFontProperties(currentTypography?.tertiary_font_id).variable ? 'Variable' : 'Static'}
                  </div>
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
      </div>
    </div>
  )
}
