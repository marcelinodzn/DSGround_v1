'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useBrandStore } from '@/store/brand-store'
import { Button } from "@/components/ui/button"

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { currentBrand, brands, fetchBrands } = useBrandStore()
  const router = useRouter()

  useEffect(() => {
    fetchBrands()
  }, [fetchBrands])

  if (!currentBrand && brands.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)]">
        <h2 className="text-2xl font-bold mb-4">No Brands Found</h2>
        <p className="text-muted-foreground mb-4">Create a brand to get started</p>
        <Button onClick={() => router.push('/brands/new')}>
          Create Brand
        </Button>
      </div>
    )
  }

  return children
} 