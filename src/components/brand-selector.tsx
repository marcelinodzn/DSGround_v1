'use client'

import { useEffect, useRef } from 'react'
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
  const hasFetchedRef = useRef(false)

  useEffect(() => {
    if (!hasFetchedRef.current) {
      fetchBrands()
      hasFetchedRef.current = true
    }
  }, [fetchBrands])

  if (isLoading) {
    return <Skeleton className="h-9 w-[200px]" />
  }

  return (
    <Select
      value={currentBrand?.id || ''}
      onValueChange={(value: string) => {
        console.log('Brand selected:', value);
        console.log('Brands available:', brands);
        setCurrentBrand(value);
      }}
    >
      <SelectTrigger className="w-[200px]">
        <span className="truncate">
          {currentBrand?.name || 'Select brand'}
        </span>
        <SelectValue className="hidden" />
      </SelectTrigger>
      <SelectContent>
        {brands.map((brand) => (
          <SelectItem key={brand.id} value={brand.id}>
            <span className="text-sm">{brand.name}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}