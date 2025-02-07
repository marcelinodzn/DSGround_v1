'use client'

import { useEffect, useState } from 'react'
import { useLayout } from "@/contexts/layout-context"
import { Button } from "@/components/ui/button"
import { Maximize2, Minimize2 } from 'lucide-react'
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { usePlatformStore } from "@/store/platform-store"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { toast } from 'sonner'

export default function PlatformPage({ params }: { params: { platformId: string } }) {
  const { isFullscreen, setIsFullscreen } = useLayout()
  const router = useRouter()
  const { platforms, updatePlatform } = usePlatformStore()
  const [platform, setPlatform] = useState<Platform | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    units: {
      typography: 'rem' as const,
      spacing: 'px' as const,
      dimensions: 'px' as const
    },
    layout: {
      baseSize: 16,
      gridColumns: 12,
      gridGutter: 24,
      containerPadding: 16
    }
  })

  useEffect(() => {
    const currentPlatform = platforms.find(p => p.id === params.platformId)
    if (currentPlatform) {
      setPlatform(currentPlatform)
      setEditForm({
        name: currentPlatform.name,
        description: currentPlatform.description || '',
        units: currentPlatform.units,
        layout: currentPlatform.layout
      })
    }
  }, [params.platformId, platforms])

  const handleSave = async () => {
    if (!platform) return

    try {
      await updatePlatform(platform.id, {
        name: editForm.name.trim(),
        description: editForm.description.trim() || null,
        units: editForm.units,
        layout: editForm.layout
      })
      setIsEditing(false)
      toast.success('Platform updated successfully')
    } catch (error) {
      console.error('Update platform error:', error)
      toast.error('Failed to update platform')
    }
  }

  if (!platform) {
    return <div>Loading...</div>
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
            <h1 className="text-[30px] font-bold">
              {isEditing ? 'Edit Platform' : platform.name}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            {isEditing ? (
              <>
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave}>
                  Save Changes
                </Button>
              </>
            ) : (
              <Button onClick={() => setIsEditing(true)}>
                Edit Platform
              </Button>
            )}
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

        <div className="py-8 px-6 max-w-3xl">
          <Card className="p-6 space-y-6">
            {isEditing ? (
              <>
                <div className="space-y-2">
                  <Label>Platform Name</Label>
                  <Input
                    value={editForm.name}
                    onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input
                    value={editForm.description}
                    onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>
                {/* Add more form fields for units and layout if needed */}
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>Platform Name</Label>
                  <p className="text-sm">{platform.name}</p>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <p className="text-sm">{platform.description}</p>
                </div>
                <div className="space-y-2">
                  <Label>Units</Label>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium">Typography</p>
                      <p>{platform.units.typography}</p>
                    </div>
                    <div>
                      <p className="font-medium">Spacing</p>
                      <p>{platform.units.spacing}</p>
                    </div>
                    <div>
                      <p className="font-medium">Dimensions</p>
                      <p>{platform.units.dimensions}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Layout</Label>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium">Base Size</p>
                      <p>{platform.layout.baseSize}px</p>
                    </div>
                    <div>
                      <p className="font-medium">Grid Columns</p>
                      <p>{platform.layout.gridColumns}</p>
                    </div>
                    <div>
                      <p className="font-medium">Grid Gutter</p>
                      <p>{platform.layout.gridGutter}px</p>
                    </div>
                    <div>
                      <p className="font-medium">Container Padding</p>
                      <p>{platform.layout.containerPadding}px</p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
} 