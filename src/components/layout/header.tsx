'use client'

import { Button } from "@/components/ui/button"
import { usePathname, useRouter } from "next/navigation"
import { FileText } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useBrandStore } from "@/store/brand-store"

export function Header({ 
  onDocumentationClick 
}: { 
  onDocumentationClick?: () => void 
}) {
  const pathname = usePathname()
  const router = useRouter()
  const isTypographyPage = pathname === "/foundations/typography"
  const { brands, isLoading, currentBrand, setCurrentBrand } = useBrandStore()

  const handleBrandChange = async (brandId: string) => {
    try {
      await setCurrentBrand(brandId)
      if (pathname.includes('/brands/')) {
        const newPath = pathname.replace(/\/brands\/[^\/]+/, `/brands/${brandId}`)
        router.push(newPath)
      }
    } catch (error) {
      console.error('Error changing brand:', error)
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="flex items-center space-x-4 flex-1">
          <a className="flex items-center space-x-2" href="/">
            <span className="font-bold sm:inline-block">
              Design System
            </span>
          </a>
          {!isLoading && brands.length > 0 && (
            <Select
              value={currentBrand?.id}
              onValueChange={handleBrandChange}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select brand" />
              </SelectTrigger>
              <SelectContent>
                {brands.map((brand) => (
                  <SelectItem key={brand.id} value={brand.id}>
                    {brand.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        <div className="flex items-center justify-end space-x-2">
          {isTypographyPage && onDocumentationClick && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDocumentationClick}
            >
              <FileText className="mr-2 h-4 w-4" />
              Documentation
            </Button>
          )}
        </div>
      </div>
    </header>
  )
} 