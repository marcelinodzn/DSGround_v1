'use client'

import { useLayout } from "@/contexts/layout-context"
import { Button } from "@/components/ui/button"
import { Maximize2, Minimize2, Plus } from 'lucide-react'
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { CardMenu } from "@/components/ui/card-menu"
import { useBrandStore } from "@/store/brand-store"
import { toast } from 'sonner'

interface Brand {
  id: string
  name: string
  description: string
  type: 'master' | 'sub'
  createdAt: string
}

export default function BrandsPage() {
  const { isFullscreen, setIsFullscreen } = useLayout()
  const router = useRouter()
  const { brands, fetchBrands, deleteBrand, createBrand, updateBrand } = useBrandStore()
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  useEffect(() => {
    fetchBrands()
  }, [fetchBrands])

  const handleAddBrand = () => {
    router.push('/brands/new')
  }

  const handleViewBrand = (brandId: string) => {
    router.push(`/brands/${brandId}`)
  }

  const handleDeleteBrand = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await deleteBrand(id)
      toast.success('Brand deleted successfully')
    } catch (error) {
      toast.error('Failed to delete brand')
    }
  }

  const handleDuplicateBrand = async (brand: Brand, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const newBrand = {
        name: `${brand.name} (Copy)`,
        description: brand.description || '',
        type: brand.type
      }
      await createBrand(newBrand)
      toast.success('Brand duplicated successfully')
    } catch (error) {
      toast.error('Failed to duplicate brand')
    }
  }

  const handleEditBrand = async (id: string, newName: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await updateBrand(id, { name: newName })
      toast.success('Brand updated successfully')
    } catch (error) {
      toast.error('Failed to update brand')
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
            <h1 className="text-[30px] font-bold">Brands</h1>
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
              : "space-y-4"
          )}>
            {/* Add Brand card */}
            <Button 
              variant="outline" 
              className={cn(
                "relative border rounded-lg hover:bg-accent w-full p-0 overflow-hidden",
                viewMode === 'grid'
                  ? "h-[116px]"
                  : "h-14"
              )}
              onClick={handleAddBrand}
            >
              {viewMode === 'grid' ? (
                <div className="h-full w-full flex flex-col justify-between p-6">
                  <div className="text-left">
                    <h3 className="font-semibold">Add New Brand</h3>
                  </div>
                  <div className="flex items-center">
                    <Plus className="h-4 w-4" />
                  </div>
                </div>
              ) : (
                <div className="h-full w-full flex items-center gap-2 px-4">
                  <Plus className="h-4 w-4" />
                  <span className="font-semibold">Add New Brand</span>
                </div>
              )}
            </Button>
            
            {/* Brand cards */}
            {brands.map((brand) => (
              <div key={brand.id} className="relative group">
                <Button
                  variant="outline"
                  className={cn(
                    "relative border rounded-lg hover:bg-accent w-full p-0 overflow-hidden",
                    viewMode === 'grid'
                      ? "h-[116px]"
                      : "h-14"
                  )}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleViewBrand(brand.id)
                  }}
                >
                  {viewMode === 'grid' ? (
                    <div className="h-full w-full flex flex-col justify-between p-6">
                      <div className="text-left">
                        <h3 className="font-semibold">{brand.name}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {brand.description}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="h-full w-full flex items-center justify-between px-4">
                      <div className="flex items-center gap-3">
                        <span className="font-semibold">{brand.name}</span>
                        {brand.description && (
                          <span className="text-sm text-muted-foreground">
                            {brand.description}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </Button>
                <CardMenu
                  onEdit={(e) => {
                    const newName = prompt('Enter new name:', brand.name)
                    if (newName) handleEditBrand(brand.id, newName, e)
                  }}
                  onDelete={(e) => handleDeleteBrand(brand.id, e)}
                  onDuplicate={(e) => handleDuplicateBrand(brand, e)}
                  onShare={() => {/* Implement sharing functionality */}}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
