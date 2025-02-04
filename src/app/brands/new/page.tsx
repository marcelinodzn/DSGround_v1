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

type BrandType = 'master' | 'sub'

interface BrandForm {
  name: string
  description: string
  type: BrandType
}

export default function NewBrandPage() {
  const { isFullscreen, setIsFullscreen } = useLayout()
  const router = useRouter()
  
  const [formData, setFormData] = useState<BrandForm>({
    name: '',
    description: '',
    type: 'master'
  })

  const handleCancel = () => {
    router.back()
  }

  const handleCreate = () => {
    // Validate form
    if (!formData.name.trim()) {
      alert('Please enter a brand name')
      return
    }

    // Here you would typically save to your backend
    console.log('Creating brand:', formData)

    // For now, we'll just store in localStorage as an example
    const brands = JSON.parse(localStorage.getItem('brands') || '[]')
    brands.push({
      id: crypto.randomUUID(),
      ...formData,
      createdAt: new Date().toISOString()
    })
    localStorage.setItem('brands', JSON.stringify(brands))

    router.push('/brands')
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
            <h1 className="text-[30px] font-bold">Create New Brand</h1>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={handleCancel}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleCreate}>
              Create Brand
            </Button>
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
        </div>

        <div className="py-8 px-6 max-w-full overflow-x-hidden">
          <div className="max-w-2xl space-y-6">
            <div className="space-y-2">
              <Label>Brand Name</Label>
              <Input 
                placeholder="Enter brand name" 
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea 
                placeholder="Enter brand description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="min-h-[100px]"
              />
            </div>

            <div className="space-y-2">
              <Label>Brand Type</Label>
              <div className="flex gap-4">
                <Button 
                  variant={formData.type === 'master' ? 'default' : 'outline'}
                  onClick={() => setFormData(prev => ({ ...prev, type: 'master' }))}
                >
                  Master Brand
                </Button>
                <Button 
                  variant={formData.type === 'sub' ? 'default' : 'outline'}
                  onClick={() => setFormData(prev => ({ ...prev, type: 'sub' }))}
                >
                  Sub Brand
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 