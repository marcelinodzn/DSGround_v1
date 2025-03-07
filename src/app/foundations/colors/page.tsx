'use client'

import { useEffect } from "react"
import { useLayout } from "@/contexts/layout-context"
import { Button } from "@/components/ui/button"
import { Maximize2, Minimize2 } from 'lucide-react'
import { cn } from "@/lib/utils"
import { useBrandStore } from "@/store/brand-store"
import { usePlatformStore } from "@/store/platform-store"
import { useColorStore } from "@/store/color-store"
import { ColorPalettePreview } from "@/modules/colors/color-palette-preview"

export default function ColorsPage() {
  const { isFullscreen, setIsFullscreen } = useLayout()
  const currentBrand = useBrandStore((state) => state.currentBrand)
  const { 
    platforms, 
    currentPlatform, 
    setCurrentPlatform, 
    fetchPlatformsByBrand 
  } = usePlatformStore()
  const { 
    palettes, 
    fetchPalettesByBrand, 
    currentPaletteId, 
    setCurrentPalette 
  } = useColorStore()

  // When brand changes, fetch platforms and select a platform
  useEffect(() => {
    const fetchAndSelectPlatform = async () => {
      if (!currentBrand) {
        setCurrentPlatform(null)
        return
      }
      
      try {
        await fetchPlatformsByBrand(currentBrand.id)
        
        // Get fresh platforms after fetch
        const currentPlatforms = usePlatformStore.getState().platforms
        if (currentPlatforms && currentPlatforms.length > 0) {
          // Select the first platform if none is selected
          if (!currentPlatform) {
            try {
              await setCurrentPlatform(currentPlatforms[0].id)
            } catch (err) {
              console.error('Error setting current platform:', err)
              // If there's an error setting the current platform, just set it to null
              setCurrentPlatform(null)
            }
          }
        } else {
          setCurrentPlatform(null)
        }
      } catch (error) {
        console.error('Error fetching platforms:', error)
        setCurrentPlatform(null)
      }
    }

    fetchAndSelectPlatform()
  }, [currentBrand, fetchPlatformsByBrand, setCurrentPlatform, currentPlatform])

  // When brand changes, fetch color palettes
  useEffect(() => {
    if (currentBrand) {
      fetchPalettesByBrand(currentBrand.id)
    }
  }, [currentBrand, fetchPalettesByBrand])

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
            <h1 className="text-[30px] font-bold">Color Palettes</h1>
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

        <div className="py-8 px-6 max-w-full overflow-x-hidden">
          <ColorPalettePreview />
        </div>
      </div>
    </div>
  )
}
