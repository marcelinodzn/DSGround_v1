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

  // Fetch platforms when brand changes
  useEffect(() => {
    if (currentBrand?.id) {
      fetchPlatformsByBrand(currentBrand.id);
    }
  }, [currentBrand?.id, fetchPlatformsByBrand]);

  // Fetch palettes when brand changes
  useEffect(() => {
    if (currentBrand?.id) {
      fetchPalettesByBrand(currentBrand.id);
    }
  }, [currentBrand?.id, fetchPalettesByBrand]);
  
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
