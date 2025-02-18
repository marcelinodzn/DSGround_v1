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
      <div className="container mx-auto py-10">
        <BrandTypography fonts={fonts} />
      </div>
    </ProtectedRoute>
  )
} 