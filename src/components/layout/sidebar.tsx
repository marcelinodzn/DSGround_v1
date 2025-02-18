import { Type } from 'lucide-react'
import { useBrandStore } from '@/store/brand-store'
import { useMemo } from 'react'

export function Sidebar() {
  const { currentBrand } = useBrandStore()
  
  const brandRoutes = useMemo(() => {
    if (!currentBrand?.id) return []
    
    return [
      {
        title: "Foundations",
        items: [
          {
            title: "Typography",
            href: `/brands/${currentBrand.id}/foundations/typography`,
            icon: Type
          },
          // ... other foundation items
        ]
      }
      // ... other sections
    ]
  }, [currentBrand?.id])

  return (
    <div className="pb-12">
      <div className="space-y-4 py-4">
        {brandRoutes.map((section) => (
          <div key={section.title} className="px-3 py-2">
            <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
              {section.title}
            </h2>
            <div className="space-y-1">
              {section.items.map((item) => (
                <a
                  key={item.title}
                  href={item.href}
                  className="flex items-center rounded-lg px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
                >
                  {item.icon && <item.icon className="mr-2 h-4 w-4" />}
                  {item.title}
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 