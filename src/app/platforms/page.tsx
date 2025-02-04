'use client'

import { useLayout } from "@/contexts/layout-context"
import { Button } from "@/components/ui/button"
import { Maximize2, Minimize2 } from 'lucide-react'
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { CardMenu } from "@/components/ui/card-menu"

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

export default function PlatformsPage() {
  const { isFullscreen, setIsFullscreen } = useLayout()
  const router = useRouter()
  const [platforms, setPlatforms] = useState<Platform[]>(() => {
    // Load platforms from localStorage
    const savedPlatforms = JSON.parse(localStorage.getItem('platforms') || '[]')
    return savedPlatforms.length > 0 ? savedPlatforms : [{
      id: 'web',
      name: 'Web Platform',
      description: 'Default web platform configuration',
      createdAt: new Date().toISOString(),
      units: {
        distance: 'rem',
        typography: 'rem'
      },
      layout: {
        baseSize: 16,
        gridColumns: 12,
        gridGutter: 24,
        containerPadding: 16
      }
    }]
  })

  const handleAddPlatform = () => {
    router.push('/platforms/new')
  }

  const handleViewPlatform = (id: string) => {
    router.push(`/platforms/${id}`)
  }

  const handleDeletePlatform = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const updatedPlatforms = platforms.filter(p => p.id !== id)
    localStorage.setItem('platforms', JSON.stringify(updatedPlatforms))
    setPlatforms(updatedPlatforms)
  }

  const handleDuplicatePlatform = (platform: Platform, e: React.MouseEvent) => {
    e.stopPropagation()
    const newPlatform = {
      ...platform,
      id: crypto.randomUUID(),
      name: `${platform.name} (Copy)`,
      createdAt: new Date().toISOString()
    }
    const updatedPlatforms = [...platforms, newPlatform]
    localStorage.setItem('platforms', JSON.stringify(updatedPlatforms))
    setPlatforms(updatedPlatforms)
  }

  const handleEditPlatform = (id: string, newName: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const updatedPlatforms = platforms.map(p => 
      p.id === id ? { ...p, name: newName } : p
    )
    localStorage.setItem('platforms', JSON.stringify(updatedPlatforms))
    setPlatforms(updatedPlatforms)
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
                  onEdit={(e) => {
                    const newName = prompt('Enter new name:', platform.name)
                    if (newName) handleEditPlatform(platform.id, newName, e)
                  }}
                  onDelete={(e) => handleDeletePlatform(platform.id, e)}
                  onDuplicate={(e) => handleDuplicatePlatform(platform, e)}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
} 