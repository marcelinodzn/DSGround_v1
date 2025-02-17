'use client'

import { useState, useMemo, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { Logo } from '@/components/shared/logo'
import { 
  LayoutGrid,
  Type,
  Palette,
  Ruler,
  Layers,
  Settings,
  Home,
  Maximize2,
  Minimize2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLayout } from "@/contexts/layout-context"
import { DocumentationModal } from '@/components/shared/documentation-modal'
import { BrandSelector } from "@/modules/brands/brand-selector"
import { usePlatformStore, type Platform } from "@/store/platform-store"
import { useBrandStore } from "@/store/brand-store"

export function RootLayoutClient({
  children,
}: {
  children: React.ReactNode
}) {
  const { isFullscreen } = useLayout()
  const { platforms } = usePlatformStore()
  const { brands, fetchBrands } = useBrandStore()
  const pathname = usePathname()

  // Fetch brands when component mounts
  useEffect(() => {
    fetchBrands()
  }, [fetchBrands])
  
  const breadcrumbItems = useMemo(() => {
    const segments = pathname.split('/').filter(Boolean)
    return segments.map((segment, index) => {
      const href = `/${segments.slice(0, index + 1).join('/')}`
      
      // Special handling for brands route
      if (segments[0] === 'brands' && index === 1) {
        const brand = brands.find(b => b.id === segment)
        if (brand) {
          return { href, label: brand.name }
        }
      }
      
      // Handle other routes
      if (segment.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        const platform = platforms.find(p => p.id === segment)
        if (platform) {
          return { href, label: platform.name }
        }
      }
      
      // Default case: capitalize the segment
      return { 
        href, 
        label: segment.charAt(0).toUpperCase() + segment.slice(1) 
      }
    })
  }, [pathname, platforms, brands])

  const [isDocumentationOpen, setIsDocumentationOpen] = useState(false)
  const showDocumentation = pathname === '/foundations/typography'

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
          <div className="mb-4">
            <BrandSelector />
          </div>
          <div className="space-y-6">
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
          "h-16 bg-card border-b flex items-center justify-between px-6 fixed top-0 z-10 transition-all",
          isFullscreen ? "left-0" : "left-64",
          "right-0"
        )}>
          <Breadcrumb>
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
          <div className="flex items-center space-x-4">
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
