'use client'

import { useLayout } from "@/contexts/layout-context"
import { Button } from "@/components/ui/button"
import { Maximize2, Minimize2 } from 'lucide-react'
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

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
  const [brands, setBrands] = useState<Brand[]>([])

  useEffect(() => {
    // Load brands from localStorage
    const savedBrands = JSON.parse(localStorage.getItem('brands') || '[]')
    setBrands(savedBrands)
  }, [])

  const handleAddBrand = () => {
    router.push('/brands/new')
  }

  const handleViewBrand = (brandId: string) => {
    router.push(`/brands/${brandId}`)
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
              <Button
                key={brand.id}
                variant="outline"
                className="h-[116px] p-6 flex flex-col items-start justify-between border rounded-lg hover:bg-accent"
                onClick={() => handleViewBrand(brand.id)}
              >
                <h3 className="font-semibold">{brand.name}</h3>
                <p className="text-sm text-muted-foreground text-left line-clamp-2">{brand.description}</p>
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
