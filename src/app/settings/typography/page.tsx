'use client'

import { useFontStore } from "@/store/font-store"
import { useEffect } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { FontUploader } from "@/modules/settings/font-uploader"

export default function TypographySettings() {
  const { fonts, loadFonts } = useFontStore()

  useEffect(() => {
    console.log('Loading fonts...');
    loadFonts()
  }, [loadFonts])

  return (
    <ProtectedRoute>
      <div className="container mx-auto py-10">
        <FontUploader />
      </div>
    </ProtectedRoute>
  )
} 