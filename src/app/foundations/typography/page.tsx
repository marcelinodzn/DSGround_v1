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
import React from "react"
import { ErrorBoundary } from "react-error-boundary"

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
  
  // Create refs at component level
  const attemptedFetchRef = React.useRef<Record<string, boolean>>({});
  const updateCountRef = React.useRef(0);
  const lastBrandIdRef = React.useRef<string | null>(null);

  // When brand changes, fetch platforms and select a platform
  useEffect(() => {
    // Circuit breaker to prevent excessive updates
    if (updateCountRef.current > 5) {
      console.warn('Too many update cycles detected in Typography page, breaking the cycle');
      return;
    }
    
    // Skip if we don't have a valid brand ID
    if (!currentBrand?.id) {
      console.log('No current brand with valid ID, skipping platform fetch');
      // Only set platform to null if it's not already null to avoid endless state updates
      if (currentPlatform !== null) {
        setCurrentPlatform(null);
      }
      return;
    }
    
    // Skip if the brand ID hasn't actually changed
    if (lastBrandIdRef.current === currentBrand.id) {
      console.log(`Brand ID ${currentBrand.id} unchanged, skipping platform fetch`);
      return;
    }
    
    // Track the brand ID we're processing
    lastBrandIdRef.current = currentBrand.id;
    
    // Skip if we've already attempted to fetch platforms for this brand state
    const brandIdKey = currentBrand.id;
    
    if (attemptedFetchRef.current[brandIdKey]) {
      console.log(`Already fetched platforms for ${brandIdKey}, skipping`);
      return;
    }
    
    updateCountRef.current += 1;
    
    const fetchAndSelectPlatform = async () => {
      // Double-check brand ID is valid to prevent unnecessary API calls
      if (!currentBrand?.id) {
        console.log('Brand ID no longer valid, aborting fetch');
        return;
      }
      
      attemptedFetchRef.current[brandIdKey] = true;
      
      try {
        console.log(`Fetching platforms for brand: ${currentBrand.id}`);
        await fetchPlatformsByBrand(currentBrand.id);
        
        // Get fresh platforms after fetch
        const currentPlatforms = usePlatformStore.getState().platforms;
        if (currentPlatforms && currentPlatforms.length > 0) {
          // Select the first platform if none is selected
          if (!currentPlatform) {
            console.log(`Setting current platform to: ${currentPlatforms[0].id}`);
            setCurrentPlatform(currentPlatforms[0].id);
          }
        } else {
          console.log('No platforms available after fetch, clearing current platform');
          // Only update if needed to avoid state thrashing
          if (currentPlatform !== null) {
            setCurrentPlatform(null);
          }
        }
      } catch (error) {
        console.error('Error fetching platforms:', error);
      } finally {
        // Reset update counter after successful operation
        setTimeout(() => {
          updateCountRef.current = 0;
        }, 1000);
      }
    };

    fetchAndSelectPlatform();
    
    // Add all dependencies to prevent stale closures, but use our own checks above
    // to control when actual work happens
  }, [currentBrand, fetchPlatformsByBrand, setCurrentPlatform, currentPlatform]);

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
          <ErrorBoundary
            fallbackRender={({ error, resetErrorBoundary }) => (
              <div className="p-6 bg-red-50 border border-red-200 rounded-md">
                <h3 className="text-lg font-medium text-red-800">Error loading typography system</h3>
                <p className="mt-2 text-sm text-red-500">{error.message}</p>
                <Button 
                  variant="outline" 
                  className="mt-4" 
                  onClick={resetErrorBoundary}
                >
                  Try Again
                </Button>
              </div>
            )}
            onReset={() => {
              // Reset the store when error boundary resets
              if (currentBrand?.id) {
                fetchPlatformsByBrand(currentBrand.id);
              }
            }}
          >
            <TypeScalePreview />
          </ErrorBoundary>
        </div>
      </div>
    </div>
  )
}
