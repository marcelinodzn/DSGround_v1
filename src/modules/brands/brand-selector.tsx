'use client'

import { useEffect } from 'react'
import { useBrandStore } from "@/store/brand-store"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"

export function BrandSelector() {
  const { brands, currentBrand, fetchBrands, setCurrentBrand, isLoading } = useBrandStore()

  useEffect(() => {
    fetchBrands()
  }, [fetchBrands])

  if (isLoading) {
    return <Skeleton className="h-9 w-[200px]" />
  }

  return (
    <Select
      value={typeof currentBrand === 'string' ? currentBrand : ''}
      onValueChange={setCurrentBrand}
    >
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="Select brand">
          {currentBrand ? brands.find(b => b.id === (typeof currentBrand === 'string' ? currentBrand : ''))?.name : 'Select brand'}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {brands.map((brand) => (
          <SelectItem key={brand.id} value={brand.id}>
            {brand.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
} 