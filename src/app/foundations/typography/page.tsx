'use client'

import { TypeScalePreview } from "@/components/typography/type-scale-preview"
import { PropertiesPanel } from "@/components/typography/properties-panel"

export default function TypographyPage() {
  return (
    <div className="h-full flex">
      <div className="flex-1">
        <div className="flex items-center pt-6 mb-6">
          <div>
            <h1 className="text-xl font-bold">Typography Scale</h1>
            <p className="text-muted-foreground mt-2 text-sm">Configure your type scale and platform-specific settings</p>
          </div>
        </div>

        <div className="py-8 pr-24">
          <TypeScalePreview />
        </div>
      </div>

      {/* Right Properties Panel */}
      <div className="w-96 border-l fixed top-16 right-0 bottom-0 bg-card overflow-y-auto">
        <PropertiesPanel />
      </div>
    </div>
  )
}
