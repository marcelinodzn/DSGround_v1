'use client'

import { useLayout } from "@/contexts/layout-context"
import { Button } from "@/components/ui/button"
import { Maximize2, Minimize2 } from 'lucide-react'
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
            {/* Add Brand card */}
            <Button 
              variant="outline" 
              className="h-[116px] p-6 flex flex-col items-start justify-between border rounded-lg hover:bg-accent"
              onClick={handleAddBrand}
            >
              <h3 className="font-semibold">Add New Brand</h3>
            </Button>
            
            {/* Brand cards */}
            {brands.map((brand) => (
              <div key={brand.id} className="relative group">
                <Button
                  variant="outline"
                  className="h-[116px] p-6 flex flex-col items-start justify-between border rounded-lg hover:bg-accent w-full"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleViewBrand(brand.id)
                  }}
                >
                  <h3 className="font-semibold">{brand.name}</h3>
                  <p className="text-sm text-muted-foreground text-left line-clamp-2">{brand.description}</p>
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
