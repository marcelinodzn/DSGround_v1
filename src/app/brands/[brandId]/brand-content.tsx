'use client'

import { useBrandStore } from "@/store/brand-store"
import { Brand } from "@/store/brand-store"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { AnimatedTabs, Tab } from "@/components/ui/animated-tabs"
import { useLayout } from "@/contexts/layout-context"
import { useTypographyStore } from "@/store/typography"
import { Platform } from "@/store/platform-store"
import { usePlatformStore } from "@/store/platform-store"
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
  const [brand, setBrand] = useState<Brand | null>(null)
  const [isEditingName, setIsEditingName] = useState(false)
  const [isEditingDescription, setIsEditingDescription] = useState(false)
  const { platforms, currentPlatform, fetchPlatformsByBrand, setCurrentPlatform } = usePlatformStore()

  useEffect(() => {
    const fetchBrand = async () => {
      try {
        const { data, error } = await supabase
          .from('brands')
          .select('*')
          .eq('id', brandId)
          .single()

        if (error) throw error
        setBrand(data as Brand)
      } catch (error) {
        console.error('Error fetching brand:', error)
      }
    }

    fetchBrand()
  }, [brandId])

  useEffect(() => {
    if (brand?.id) {
      fetchPlatformsByBrand(brand.id)
    }
  }, [brand?.id, fetchPlatformsByBrand])

  useEffect(() => {
    if (platforms.length > 0 && !currentPlatform) {
      setCurrentPlatform(platforms[0].id)
    }
  }, [platforms, currentPlatform, setCurrentPlatform])

  if (!brand) {
    return <div>Loading...</div>
  }

  const tabs: Tab[] = [
    {
      id: 'typography',
      title: 'Typography',
      content: 'Typography'
    },
    {
      id: 'colors',
      title: 'Colors',
      content: 'Colors'
    },
    {
      id: 'components',
      title: 'Components',
      content: 'Components'
    },
    {
      id: 'tokens',
      title: 'Tokens',
      content: 'Tokens'
    }
  ]

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
          defaultValue="typography"
          tabs={tabs}
        />
      </div>
    </div>
  )
}
