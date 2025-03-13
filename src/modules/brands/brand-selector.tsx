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

  // Handle the case where currentBrand is a string (ID) or an object
  const currentBrandId = typeof currentBrand === 'string' ? currentBrand : currentBrand?.id || ''
  const currentBrandName = typeof currentBrand === 'string' 
    ? brands.find(b => b.id === currentBrand)?.name 
    : currentBrand?.name

  return (
    <Select
      value={currentBrandId}
      onValueChange={setCurrentBrand}
    >
      <SelectTrigger className="w-[200px]">
        <span className="truncate">
          {currentBrandName || "Select brand"}
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