'use client'

import { useBrandStore } from "@/store/brand-store"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { AnimatedTabs } from "@/components/ui/animated-tabs"
import { useLayout } from "@/store/layout-store"
import { useTypographyStore } from "@/store/typography-store"
import { supabase } from "@/lib/supabase"

interface BrandContentProps {
  params: {
    brandId: string
  }
  searchParams?: { [key: string]: string | string[] | undefined }
}

export function BrandContent({ params, searchParams }: BrandContentProps) {
  const { brandId } = params
  const { isFullscreen, setIsFullscreen } = useLayout()
  const [brand, setBrand] = useState<any>(null)
  const [isEditingName, setIsEditingName] = useState(false)
  const [isEditingDescription, setIsEditingDescription] = useState(false)
  const [currentPlatform, setCurrentPlatform] = useState<string>('')
  const [platforms, setPlatforms] = useState<any[]>([])

  useEffect(() => {
    const fetchBrand = async () => {
      try {
        const { data, error } = await supabase
          .from('brands')
          .select('*')
          .eq('id', brandId)
          .single()

        if (error) throw error
        setBrand(data)
      } catch (error) {
        console.error('Error fetching brand:', error)
      }
    }

    fetchBrand()
  }, [brandId])

  if (!brand) {
    return <div>Loading...</div>
  }

  return (
    <div className="container py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{brand.name}</h1>
          <p className="text-muted-foreground">
            {brand.description}
          </p>
        </div>
        <Button>Export Brand</Button>
      </div>

      <div className="mt-6">
        <AnimatedTabs
          value="overview"
          onValueChange={() => {}}
          tabs={[
            { value: 'overview', label: 'Overview' },
            { value: 'tokens', label: 'Design Tokens' },
            { value: 'components', label: 'Components' },
            { value: 'settings', label: 'Settings' },
          ]}
        />
      </div>
    </div>
  )
}
