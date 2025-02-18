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

  const debugInfo = {
    brandId,
    currentBrand: currentBrand?.id,
    hasTypography: !!currentTypography,
    typographyState: currentTypography,
    availableFonts: fonts.length
  }

  console.log('🔍 Current state:', debugInfo)

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
            <h1 className="text-[30px] font-bold">Brand Typography Settings</h1>
            <p className="text-muted-foreground mt-2">
              Select the primary, secondary, and tertiary fonts for {currentBrand?.name}
            </p>
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
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-6">
              {fontTypes.map((type) => (
                <div key={`${type}-font-select`} className="space-y-2 p-4 border rounded-lg">
                  <label className="text-sm font-medium capitalize">{type} Font</label>
                  <Select
                    value={currentTypography?.[`${type}_font_id`] || undefined}
                    onValueChange={(value) => handleFontChange(value || null, type)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={`Select ${type} font`} />
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
                  {currentTypography?.[`${type}_font_id`] && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Selected: {fonts.find(f => f.id === currentTypography[`${type}_font_id`])?.family}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 p-4 border rounded bg-muted">
            <pre className="text-xs">{JSON.stringify(debugInfo, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  )
}
