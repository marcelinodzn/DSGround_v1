'use client'

import { useFontStore } from "@/store/font-store"
import { useEffect } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { BrandTypography } from "@/modules/foundations/typography/brand-typography"

export default function BrandTypographyPage() {
  const { fonts, loadFonts } = useFontStore()

  useEffect(() => {
    loadFonts()
  }, [loadFonts])

  return (
    <ProtectedRoute>
      <div className="h-full flex transition-all duration-300 ease-in-out">
        <div className="flex-1 min-w-0 max-w-full">
          <div className="pt-6 px-6">
            <h1 className="text-[30px] font-bold mb-6">Brand Typography</h1>
          </div>
          <div className="py-8 px-6">
            <BrandTypography fonts={fonts} />
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
} 