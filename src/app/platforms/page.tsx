'use client'

import { useEffect, useState } from 'react'
import { useLayout } from "@/contexts/layout-context"
import { Button } from "@/components/ui/button"
import { Maximize2, Minimize2, Plus } from 'lucide-react'
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { CardMenu } from "@/components/ui/card-menu"
import { usePlatformStore } from "@/store/platform-store"
import { useBrandStore } from "@/store/brand-store"
import { toast } from 'sonner'
import { Icon } from '@iconify/react'

interface Platform {
  id: string
  brand_id: string
  name: string
  description: string | null
  units: {
    typography: string
    spacing: string
    dimensions: string
    borderWidth: string
    borderRadius: string
  }
  layout: {
    gridColumns: number
    gridGutter: number
    containerPadding: number
    icon?: string
  }
  created_at: string
  updated_at: string
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
    fetchPlatformsByBrand,
    deletePlatform, 
    addPlatform,
    updatePlatform 
  } = usePlatformStore()
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  useEffect(() => {
    const loadPlatforms = async () => {
      if (currentBrand?.id) {
        console.log('Loading platforms for brand:', currentBrand.id);
        await fetchPlatformsByBrand(currentBrand.id)
      } else {
        console.log('No current brand with valid ID, skipping platform fetch');
      }
    }
    
    loadPlatforms()
  }, [currentBrand, fetchPlatformsByBrand])

  const handleCreatePlatform = async (name: string, description: string = '') => {
    if (!currentBrand) return
    
    try {
      const platform = await addPlatform(currentBrand.id, {
        name,
        description,
        units: {
          typography: 'rem',
          spacing: 'rem',
          dimensions: 'px',
          borderWidth: 'px',
          borderRadius: 'px'
        },
        layout: {
          gridColumns: 12,
          gridGutter: 16,
          containerPadding: 16
        }
      })
      
      // Navigate to the new platform
      router.push(`/platforms/${platform.id}`)
    } catch (error) {
      console.error('Create platform error:', error)
    }
  }

  const handleDeletePlatform = async (platformId: string) => {
    try {
      await deletePlatform(platformId)
      toast.success('Platform deleted successfully')
      // Refresh platforms list
      if (currentBrand) {
        await fetchPlatformsByBrand(currentBrand.id)
      }
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('Failed to delete platform')
    }
  }

  const handleDuplicatePlatform = async (platform: Platform) => {
    if (!currentBrand) return

    try {
      await addPlatform(currentBrand.id, {
        name: `${platform.name} (Copy)`,
        description: platform.description,
        units: {
          typography: platform.units.typography,
          spacing: platform.units.spacing,
          dimensions: platform.units.dimensions || 'px',
          borderWidth: platform.units.borderWidth,
          borderRadius: platform.units.borderRadius
        },
        layout: platform.layout
      })
      toast.success('Platform duplicated successfully')
      // Refresh platforms list
      await fetchPlatformsByBrand(currentBrand.id)
    } catch (error) {
      console.error('Duplicate error:', error)
      toast.error('Failed to duplicate platform')
    }
  }

  const handleEditPlatform = async (id: string, updates: { name: string }) => {
    try {
      await updatePlatform(id, updates)
      toast.success('Platform updated successfully')
      // Refresh platforms list
      if (currentBrand) {
        await fetchPlatformsByBrand(currentBrand.id)
      }
    } catch (error) {
      console.error('Edit error:', error)
      toast.error('Failed to update platform')
    }
  }

  const handleViewPlatform = (platformId: string) => {
    router.push(`/platforms/${platformId}`)
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
          <div className="flex items-center gap-2">
            <div className="bg-muted rounded-full p-1 flex items-center">
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-8 w-8 p-0 rounded-full",
                  viewMode === 'grid' && "bg-background shadow-sm"
                )}
                onClick={() => setViewMode('grid')}
              >
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2 2H6.5V6.5H2V2ZM8.5 2H13V6.5H8.5V2ZM2 8.5H6.5V13H2V8.5ZM8.5 8.5H13V13H8.5V8.5Z" stroke="currentColor"/>
                </svg>
                <span className="sr-only">Grid view</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-8 w-8 p-0 rounded-full",
                  viewMode === 'list' && "bg-background shadow-sm"
                )}
                onClick={() => setViewMode('list')}
              >
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2 4H13M2 7.5H13M2 11H13" stroke="currentColor"/>
                </svg>
                <span className="sr-only">List view</span>
              </Button>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsFullscreen(!isFullscreen)}
            >
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        <div className="py-8 px-6 max-w-full overflow-x-hidden">
          <div className={cn(
            viewMode === 'grid' 
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
              : "flex flex-col gap-4"
          )}>
            {/* Add Platform card */}
            <div key="add-platform-button" className="relative group">
              <Button 
                variant="outline" 
                className={cn(
                  "relative border rounded-lg hover:bg-accent w-full p-0 overflow-hidden",
                  viewMode === 'grid'
                    ? "h-[116px]"
                    : "h-14"
                )}
                onClick={() => router.push('/platforms/new')}
              >
                {viewMode === 'grid' ? (
                  <div className="h-full w-full flex flex-col justify-between p-6">
                    <div className="text-left">
                      <h3 className="font-semibold">Add New Platform</h3>
                    </div>
                    <div className="flex items-center">
                      <Plus className="h-4 w-4" />
                    </div>
                  </div>
                ) : (
                  <div className="h-full w-full flex items-center gap-2 px-4">
                    <Plus className="h-4 w-4" />
                    <span className="font-semibold">Add New Platform</span>
                  </div>
                )}
              </Button>
            </div>

            {/* Platform cards */}
            {platforms.map((platform) => (
              <div key={platform.id} className="relative group">
                <Button
                  variant="outline"
                  className={cn(
                    "relative w-full border rounded-lg hover:bg-accent",
                    viewMode === 'grid'
                      ? "h-[116px] p-6"
                      : "h-14 p-4"
                  )}
                  onClick={() => handleViewPlatform(platform.id)}
                >
                  {viewMode === 'grid' ? (
                    <div className="h-full w-full flex flex-col justify-between">
                      <div className="text-left">
                        <h3 className="font-semibold">{platform.name}</h3>
                      </div>
                      <div className="flex items-center">
                        {platform.layout?.icon ? (
                          <Icon 
                            icon={platform.layout.icon}
                            width={16}
                            height={16}
                            className="text-foreground"
                          />
                        ) : (
                          <div className="w-4 h-4 rounded border" />
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="w-full flex items-center gap-3">
                      {platform.layout?.icon ? (
                        <Icon 
                          icon={platform.layout.icon}
                          width={16}
                          height={16}
                          className="text-foreground"
                        />
                      ) : (
                        <div className="w-4 h-4 rounded border" />
                      )}
                      <h3 className="font-semibold">{platform.name}</h3>
                    </div>
                  )}
                </Button>
                <CardMenu
                  onEdit={() => {
                    const newName = window.prompt('Enter new name:', platform.name)
                    if (newName && newName !== platform.name) {
                      handleEditPlatform(platform.id, { name: newName })
                    }
                  }}
                  onDelete={() => {
                    if (window.confirm('Are you sure you want to delete this platform? This action cannot be undone.')) {
                      handleDeletePlatform(platform.id)
                    }
                  }}
                  onDuplicate={() => handleDuplicatePlatform(platform)}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
} 