'use client'

import { useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useBrandStore } from "@/store/brand-store"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function Header() {
  const pathname = usePathname()
  const { currentBrand, brands, fetchBrands, setCurrentBrand } = useBrandStore()
  
  useEffect(() => {
    fetchBrands()
  }, [fetchBrands])
  
  const handleBrandChange = (brandId: string) => {
    const brand = brands.find(b => b.id === brandId)
    if (brand) {
      setCurrentBrand(brand)
    }
  }
  
  // Skip brand selector on certain pages
  const shouldShowBrandSelector = !pathname.includes('/login') && 
                                 !pathname.includes('/register') &&
                                 !pathname.includes('/brands/new')
  
  return (
    <header className="border-b">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-semibold text-lg">
            Design System
          </Link>
          
          <nav className="hidden md:flex items-center gap-6">
            <Link 
              href="/brands" 
              className={`text-sm ${pathname.includes('/brands') ? 'font-medium' : ''}`}
            >
              Brands
            </Link>
            <Link 
              href="/platforms" 
              className={`text-sm ${pathname.includes('/platforms') ? 'font-medium' : ''}`}
            >
              Platforms
            </Link>
            <Link 
              href="/foundations/typography" 
              className={`text-sm ${pathname.includes('/foundations/typography') ? 'font-medium' : ''}`}
            >
              Typography
            </Link>
            <Link 
              href="/foundations/colors" 
              className={`text-sm ${pathname.includes('/foundations/colors') ? 'font-medium' : ''}`}
            >
              Colors
            </Link>
          </nav>
        </div>
        
        {shouldShowBrandSelector && (
          <div className="flex items-center gap-4">
            <div className="w-48">
              {brands.length > 0 ? (
                <Select 
                  value={currentBrand?.id || ""} 
                  onValueChange={handleBrandChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a brand" />
                  </SelectTrigger>
                  <SelectContent>
                    {brands.map(brand => (
                      <SelectItem key={brand.id} value={brand.id}>
                        {brand.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Link 
                  href="/brands/new"
                  className="text-sm text-primary hover:underline"
                >
                  Create a brand
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  )
} 