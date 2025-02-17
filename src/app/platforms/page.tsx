'use client'

import { useEffect } from 'react'
import { useLayout } from "@/contexts/layout-context"
import { Button } from "@/components/ui/button"
import { Maximize2, Minimize2 } from 'lucide-react'
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { CardMenu } from "@/components/ui/card-menu"
import { usePlatformStore } from "@/store/platform-store"
import { useBrandStore } from "@/store/brand-store"
import { toast } from 'sonner'

interface Platform {
  id: string
  name: string
  description: string
  createdAt: string
  units: {
    distance: 'px' | 'rem' | 'pt'
    typography: 'px' | 'rem' | 'pt'
  }
  layout: {
    baseSize: number
    gridColumns: number
    gridGutter: number
    containerPadding: number
  }
}

// Add slugify function
const slugify = (text: string) => {
  return text
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
}

export default function PlatformsPage() {
  const { isFullscreen, setIsFullscreen } = useLayout()
  const router = useRouter()
  const { currentBrand } = useBrandStore()
  const { 
    platforms, 
    isLoading,
    error,
    fetchPlatforms,
    deletePlatform, 
    addPlatform 
  } = usePlatformStore()

  useEffect(() => {
    if (currentBrand) {
      fetchPlatforms(currentBrand)
    }
  }, [currentBrand, fetchPlatforms])

  const handleAddPlatform = () => {
    if (!currentBrand) {
      toast.error('Please select a brand first')
      return
    }
    router.push('/platforms/new')
  }

  const handleViewPlatform = (platformId: string) => {
    router.push(`/platforms/${platformId}`)
  }

  const handleDeletePlatform = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await deletePlatform(id)
      toast.success('Platform deleted successfully')
    } catch (error) {
      toast.error('Failed to delete platform')
    }
  }

  if (!currentBrand) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)]">
        <h2 className="text-2xl font-bold mb-4">No Brand Selected</h2>
        <p className="text-muted-foreground">Please select a brand to view platforms</p>
      </div>
    )
  }

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (error) {
    return <div>Error: {error}</div>
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
            <h1 className="text-[30px] font-bold">Platforms</h1>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Add Platform card */}
            <Button 
              variant="outline" 
              className="h-[116px] p-6 flex flex-col items-start justify-between border rounded-lg hover:bg-accent"
              onClick={handleAddPlatform}
            >
              <h3 className="font-semibold">Add New Platform</h3>
            </Button>
            
            {/* Platform cards */}
            {platforms.map((platform) => (
              <div key={platform.id} className="relative group">
                <Button
                  variant="outline"
                  className="h-[116px] p-6 flex flex-col items-start justify-between border rounded-lg hover:bg-accent w-full"
                  onClick={() => handleViewPlatform(platform.id)}
                >
                  <h3 className="font-semibold">{platform.name}</h3>
                  <p className="text-sm text-muted-foreground text-left line-clamp-2">
                    {platform.description}
                  </p>
                </Button>
                <CardMenu
                  onDelete={(e) => handleDeletePlatform(platform.id, e)}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
} 