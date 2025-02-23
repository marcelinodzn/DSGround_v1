'use client'

import { useBrandStore } from "@/store/brand-store"
import { Brand } from "@/store/brand-store"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { AnimatedTabs } from "@/components/ui/animated-tabs"
import { useLayout } from "@/store/layout-store"
import { useTypographyStore } from "@/store/typography-store"
import { Platform } from "@/store/typography"
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
        const { data: rawData, error } = await supabase
          .from('brands')
          .select('*')
          .eq('id', brandId)
          .single()

        if (error) throw error
        
        if (!rawData) throw new Error('Brand not found')

        // Type guard for raw brand data
        if (
          typeof rawData.id !== 'string' ||
          typeof rawData.name !== 'string' ||
          (rawData.description !== null && typeof rawData.description !== 'string') ||
          (rawData.type !== 'master' && rawData.type !== 'sub') ||
          typeof rawData.created_at !== 'string' ||
          typeof rawData.updated_at !== 'string'
        ) {
          throw new Error('Invalid brand data received from server')
        }

        // Now TypeScript knows the types are correct
        const brandData: Brand = {
          id: rawData.id,
          name: rawData.name,
          description: rawData.description,
          type: rawData.type,
          created_at: rawData.created_at,
          updated_at: rawData.updated_at,
        }
        
        setBrand(brandData)
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

  const tabs = [
    {
      id: 'typography',
      label: 'Typography',
      content: 'Typography'
    },
    {
      id: 'colors',
      label: 'Colors',
      content: 'Colors'
    },
    {
      id: 'components',
      label: 'Components',
      content: 'Components'
    },
    {
      id: 'tokens',
      label: 'Tokens',
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
          layoutId="brand-tabs"
          defaultTab="overview"
          onChange={() => {}}
          tabs={[
            { id: 'overview', label: 'Overview' },
            { id: 'tokens', label: 'Design Tokens' },
            { id: 'components', label: 'Components' },
            { id: 'settings', label: 'Settings' },
          ]}
        />
      </div>
    </div>
  )
}
