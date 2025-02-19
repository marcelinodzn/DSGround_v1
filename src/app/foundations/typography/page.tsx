'use client'

import { useEffect } from "react"
import { useLayout } from "@/contexts/layout-context"
import { Button } from "@/components/ui/button"
import { Maximize2, Minimize2 } from 'lucide-react'
import { TypeScalePreview } from "@/modules/typography/type-scale-preview"
import { cn } from "@/lib/utils"
import { useBrandStore } from "@/store/brand-store"
import { usePlatformStore } from "@/store/platform-store"
import { useTypographyStore } from "@/store/typography"
import { TypographyProperties } from '@/modules/brand/typography-properties'

export default function TypographyPage() {
  const { isFullscreen, setIsFullscreen } = useLayout()
  const currentBrand = useBrandStore((state) => state.currentBrand)
  const { 
    platforms, 
    currentPlatform, 
    setCurrentPlatform, 
    fetchPlatformsByBrand 
  } = usePlatformStore()
  const { platforms: typographyPlatforms } = useTypographyStore()

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
            setCurrentPlatform(currentPlatforms[0].id)
          }
        } else {
          setCurrentPlatform(null)
        }
      } catch (error) {
        console.error('Error fetching platforms:', error)
      }
    }

    fetchAndSelectPlatform()
  }, [currentBrand, fetchPlatformsByBrand, setCurrentPlatform, currentPlatform])

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
            <h1 className="text-[30px] font-bold">Typography Scale</h1>
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
          <TypeScalePreview />
        </div>
      </div>
    </div>
  )
}
