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

  // ... rest of the component
} 