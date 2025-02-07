'use client'

import { useLayout } from "@/contexts/layout-context"
import { Button } from "@/components/ui/button"
import { Maximize2, Minimize2 } from 'lucide-react'
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { usePlatformStore } from "@/store/platform-store"
import { useBrandStore } from "@/store/brand-store"
import { toast } from 'sonner'

interface PlatformForm {
  name: string
  description: string
  units: {
    distance: 'px' | 'rem' | 'pt'
    typography: 'px' | 'rem' | 'pt'
    spacing: 'rem' | 'em' | 'vw' | 'vh' | '%' | 'px'
    dimensions: '%' | 'vw' | 'vh' | 'px' | 'cm' | 'mm' | 'in' | 'm'
  }
  layout: {
    baseSize: number
    gridColumns: number
    gridGutter: number
    containerPadding: number
  }
}

export default function NewPlatformPage() {
  const { isFullscreen, setIsFullscreen } = useLayout()
  const router = useRouter()
  const { currentBrand } = useBrandStore()
  const { addPlatform } = usePlatformStore()

  const [formData, setFormData] = useState<PlatformForm>({
    name: '',
    description: '',
    units: {
      distance: 'px',
      typography: 'rem',
      spacing: 'px',
      dimensions: 'px'
    },
    layout: {
      baseSize: 16,
      gridColumns: 12,
      gridGutter: 24,
      containerPadding: 16
    }
  })

  const handleCreate = async () => {
    if (!currentBrand) {
      toast.error('Please select a brand first')
      return
    }

    if (!formData.name.trim()) {
      toast.error('Please enter a platform name')
      return
    }

    try {
      await addPlatform(currentBrand, {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        units: formData.units,
        layout: formData.layout
      })
      toast.success('Platform created successfully')
      router.push('/platforms')
    } catch (error) {
      console.error('Create platform error:', error)
      toast.error('Failed to create platform')
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
            <h1 className="text-[30px] font-bold">New Platform</h1>
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

        <div className="py-8 px-6 max-w-3xl">
          <Card className="p-6 space-y-6">
            <div className="space-y-2">
              <Label>Platform Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter platform name"
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter platform description"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button onClick={handleCreate}>
                Create Platform
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
} 