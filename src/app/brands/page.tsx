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
  description: string | null
  type: 'master' | 'sub'
  created_at: string
  updated_at: string
}

export default function BrandsPage() {
  const { isFullscreen, setIsFullscreen } = useLayout()
  const router = useRouter()
  const { brands, fetchBrands, deleteBrand, createBrand, updateBrand } = useBrandStore()
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  useEffect(() => {
    const fetchOnce = async () => {
      const state = useBrandStore.getState()
      // Only fetch if we don't have brands already
      if (state.brands.length === 0 && !state.isLoading) {
        await fetchBrands()
      }
    }
    fetchOnce()
  }, [fetchBrands])

  const handleAddBrand = () => {
    router.push('/brands/new')
  }

  const handleViewBrand = (brandId: string) => {
    router.push(`/brands/${brandId}`)
  }

  const handleDeleteBrand = async (id: string) => {
    try {
      await deleteBrand(id)
      toast.success('Brand deleted successfully')
    } catch (error) {
      toast.error('Failed to delete brand')
    }
  }

  const handleDuplicateBrand = async (brand: Brand) => {
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

  const handleEditBrand = async (id: string, newName: string) => {
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
            <div key="add-brand-button" className="relative group">
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
            </div>
            
            {/* Brand cards */}
            {viewMode === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {brands.map((brand) => (
                  <Button
                    key={brand.id}
                    variant="outline"
                    className="h-auto p-6 flex flex-col items-start gap-2 text-left hover:bg-secondary/50 hover:border-primary/20 transition-colors"
                    onClick={() => handleViewBrand(brand.id)}
                  >
                    <h3 className="text-lg font-semibold text-primary">
                      {brand.name || `Brand ${brand.id.substring(0, 6)}`}
                    </h3>
                    <p className="text-muted-foreground text-sm line-clamp-2">
                      {brand.description || "No description available"}
                    </p>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-xs text-muted-foreground">
                        {brand.type || "master"}
                      </span>
                      <CardMenu 
                        onEdit={() => handleEditBrand(brand.id, prompt('Enter new name:', brand.name) || '')}
                        onDelete={() => handleDeleteBrand(brand.id)} 
                        onDuplicate={() => handleDuplicateBrand(brand)}
                        onShare={() => {/* Implement sharing functionality */}}
                      />
                    </div>
                  </Button>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {brands.map((brand) => (
                  <div key={brand.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors">
                    <div className="flex-1">
                      <h3 className="font-medium">{brand.name || `Brand ${brand.id.substring(0, 6)}`}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {brand.description || "No description available"}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button 
                        key={`view-${brand.id}`}
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleViewBrand(brand.id)}
                      >
                        View
                      </Button>
                      <Button 
                        key={`edit-${brand.id}`}
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleEditBrand(brand.id, prompt('Enter new name:', brand.name) || '')}
                      >
                        Edit
                      </Button>
                      <Button 
                        key={`delete-${brand.id}`}
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDeleteBrand(brand.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
