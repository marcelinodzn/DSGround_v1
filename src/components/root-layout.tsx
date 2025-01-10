'use client'

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

function getBreadcrumbItems(pathname: string) {
  const segments = pathname.split('/').filter(Boolean)
  const items = segments.map((segment, index) => {
    const href = `/${segments.slice(0, index + 1).join('/')}`
    const label = segment.charAt(0).toUpperCase() + segment.slice(1)
    return { href, label }
  })
  return items
}

export function RootLayoutClient({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const breadcrumbItems = getBreadcrumbItems(pathname)

  return (
    <div className="flex h-screen">
      {/* Left Sidebar */}
      <aside className="w-64 bg-card border-r">
        <nav className="p-4">
          <h2 className="text-xl font-bold mb-6">Design System</h2>
          <div className="space-y-6">
            <div className="space-y-2">
              <Link 
                href="/" 
                className="block px-4 py-2 text-xs hover:bg-accent rounded-md"
              >
                Overview
              </Link>
              <Link 
                href="/brands" 
                className="block px-4 py-2 text-xs hover:bg-accent rounded-md"
              >
                Brands
              </Link>
            </div>

            <div>
              <Separator className="-mx-4 w-[calc(100%+32px)]" />
              <h3 className="px-4 mt-4 text-sm font-medium text-muted-foreground mb-2">Foundations</h3>
              <div className="space-y-1">
                <Link 
                  href="/foundations/typography" 
                  className="block px-4 py-2 text-xs hover:bg-accent rounded-md"
                >
                  Typography
                </Link>
                <Link 
                  href="/foundations/colors" 
                  className="block px-4 py-2 text-xs hover:bg-accent rounded-md"
                >
                  Colors
                </Link>
                <Link 
                  href="/foundations/spacing" 
                  className="block px-4 py-2 text-xs hover:bg-accent rounded-md"
                >
                  Spacing
                </Link>
                <Link 
                  href="/foundations/surfaces" 
                  className="block px-4 py-2 text-xs hover:bg-accent rounded-md"
                >
                  Surfaces
                </Link>
              </div>
            </div>

            <div>
              <Separator className="-mx-4 w-[calc(100%+32px)]" />
              <h3 className="px-4 mt-4 text-sm font-medium text-muted-foreground mb-2">Settings</h3>
              <Link 
                href="/sync" 
                className="block px-4 py-2 text-xs hover:bg-accent rounded-md"
              >
                Sync Settings
              </Link>
            </div>
          </div>
        </nav>
      </aside>

      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-16 bg-card border-b flex items-center justify-between px-6">
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
            <Button variant="outline" size="sm">Documentation</Button>
            <Button size="sm">New Brand</Button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 pl-6 bg-background overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
