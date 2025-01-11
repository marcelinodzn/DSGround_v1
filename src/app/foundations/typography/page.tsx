'use client'

import { TypeScalePreview } from "@/components/typography/type-scale-preview"

export default function TypographyPage() {
  return (
    <div className="h-full">
      <div className="flex items-center pt-6 mb-6">
        <div>
          <h1 className="text-xl font-bold">Typography Scale</h1>
          <p className="text-muted-foreground mt-2">Configure your type scale and platform-specific settings</p>
        </div>
      </div>

      <div className="py-8 pr-8">
        <TypeScalePreview />
      </div>
    </div>
  )
}
