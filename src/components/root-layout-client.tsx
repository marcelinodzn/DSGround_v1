'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { Logo } from '@/components/logo'
import { 
  LayoutGrid,
  Type,
  Palette,
  Ruler,
  Layers,
  Settings,
  Home,
  ArrowUpDown
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLayout } from "@/contexts/layout-context"
import { DocumentationModal } from '@/components/documentation-modal'
import { BrandSelector } from '@/components/brand-selector'
import { usePlatformStore, type Platform } from "@/store/platform-store"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useBrandStore } from "@/store/brand-store"
import * as SelectPrimitive from "@radix-ui/react-select"

function getBreadcrumbItems(pathname: string, platforms: Platform[]) {
  const segments = pathname.split('/').filter(Boolean)
  const items = segments.map((segment, index) => {
    const href = `/${segments.slice(0, index + 1).join('/')}`
    let label = segment.charAt(0).toUpperCase() + segment.slice(1)
    
    if (segment.length === 36) {
      const platform = platforms.find(p => p.id === segment)
      if (platform) {
        label = platform.name
      }
    }
    
    return { href, label }
  })
  return items
}

const BrandDropdown = () => {
  const { brands, currentBrand, setCurrentBrand, fetchBrands } = useBrandStore()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    fetchBrands()
  }, [fetchBrands])

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
    <Select
      value={currentBrand?.id}
      onValueChange={handleBrandChange}
    >
      <SelectTrigger 
        className="w-auto min-w-[160px] border-0 shadow-none focus:ring-0 hover:bg-accent transition-colors rounded-md px-4 py-2 focus:outline-none bg-white"
      >
        <SelectValue 
          className="text-sm font-medium m-0 p-0"
          placeholder="Select brand" 
        />
      </SelectTrigger>
      <SelectContent className="border-0 shadow-md">
        <div className="p-2 space-y-1">
          {brands?.map((brand) => (
            <SelectItem 
              key={brand.id} 
              value={brand.id}
              className="rounded-md cursor-pointer hover:bg-accent focus:bg-accent focus:text-accent-foreground"
            >
              {brand.name}
            </SelectItem>
          ))}
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full justify-start text-left mt-2"
            onClick={() => router.push('/brands/new')}
          >
            + Add new brand
          </Button>
        </div>
      </SelectContent>
    </Select>
  )
}

export function RootLayoutClient({
  children,
}: {
  children: React.ReactNode
}) {
  const { isFullscreen } = useLayout()
  const { platforms } = usePlatformStore()
  const pathname = usePathname()
  const breadcrumbItems = getBreadcrumbItems(pathname, platforms)
  const [isDocumentationOpen, setIsDocumentationOpen] = useState(false)
  const showDocumentation = pathname === '/foundations/typography'
  const isAuthPage = ['/sign-in', '/sign-up', '/forgot-password'].includes(pathname)
  const showBrandSelector = !pathname.startsWith('/brands') && 
    !pathname.startsWith('/settings') && 
    pathname !== '/' // Hide on overview page
  const router = useRouter()

  if (isAuthPage) {
    return <>{children}</>
  }

  if (isFullscreen) {
    return children
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Left Sidebar */}
      <aside className={cn(
        "w-64 bg-card border-r fixed top-0 left-0 h-full overflow-y-auto transition-transform",
        isFullscreen && "-translate-x-full"
      )}>
        <nav className="p-4">
          <div className="mb-6">
            <Logo />
          </div>
          <div className="space-y-4">
            <div className="space-y-1">
              <Link 
                href="/" 
                className="flex items-center px-4 py-2 text-xs hover:bg-accent rounded-md"
              >
                <Home className="w-4 h-4 mr-2" />
                Overview
              </Link>
              <Link 
                href="/brands" 
                className="flex items-center px-4 py-2 text-xs hover:bg-accent rounded-md"
              >
                <LayoutGrid className="w-4 h-4 mr-2" />
                Brands
              </Link>
            </div>

            <div>
              <Separator className="-mx-4 w-[calc(100%+32px)]" />
              <h3 className="px-4 mt-4 text-sm font-medium text-muted-foreground mb-2">Foundations</h3>
              <div className="space-y-1">
                <Link 
                  href="/foundations/typography" 
                  className="flex items-center px-4 py-2 text-xs hover:bg-accent rounded-md"
                >
                  <Type className="w-4 h-4 mr-2" />
                  Typography
                </Link>
                <Link 
                  href="/foundations/colors" 
                  className="flex items-center px-4 py-2 text-xs hover:bg-accent rounded-md"
                >
                  <Palette className="w-4 h-4 mr-2" />
                  Colors
                </Link>
                <Link 
                  href="/foundations/spacing" 
                  className="flex items-center px-4 py-2 text-xs hover:bg-accent rounded-md"
                >
                  <Ruler className="w-4 h-4 mr-2" />
                  Spacing
                </Link>
                <Link 
                  href="/foundations/surfaces" 
                  className="flex items-center px-4 py-2 text-xs hover:bg-accent rounded-md"
                >
                  <Layers className="w-4 h-4 mr-2" />
                  Surfaces
                </Link>
              </div>
            </div>

            <div>
              <Separator className="-mx-4 w-[calc(100%+32px)]" />
              <h3 className="px-4 mt-4 text-sm font-medium text-muted-foreground mb-2">Settings</h3>
              <Link 
                href="/settings" 
                className="flex items-center px-4 py-2 text-xs hover:bg-accent rounded-md"
              >
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Link>
              <Link 
                href="/platforms" 
                className="flex items-center px-4 py-2 text-xs hover:bg-accent rounded-md"
              >
                <Layers className="w-4 h-4 mr-2" />
                Platforms
              </Link>
            </div>
          </div>
        </nav>
      </aside>

      <div className={cn(
        "flex-1 flex flex-col transition-all",
        isFullscreen ? "ml-0" : "ml-64"
      )}>
        {/* Header */}
        <header className={cn(
          "h-16 bg-card border-b flex items-center justify-between px-4 fixed top-0 z-10 transition-all",
          isFullscreen ? "left-0" : "left-64",
          "right-0"
        )}>
          <div className="flex items-center space-x-6">
            {showBrandSelector && <BrandDropdown />}
            <Breadcrumb className="pl-[4px]">
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/">Design System Ground</BreadcrumbLink>
                </BreadcrumbItem>
                {breadcrumbItems.map((item, index) => (
                  <BreadcrumbItem key={item.href}>
                    <BreadcrumbSeparator />
                    {index === breadcrumbItems.length - 1 ? (
                      <BreadcrumbPage>{item.label}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink href={item.href}>{item.label}</BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          <div className="flex items-center">
            {showDocumentation && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsDocumentationOpen(true)}
              >
                Documentation
              </Button>
            )}
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 bg-background overflow-y-auto pt-16">
          {children}
        </main>

        <DocumentationModal 
          isOpen={isDocumentationOpen}
          onClose={() => setIsDocumentationOpen(false)}
        />
      </div>
    </div>
  )
}
