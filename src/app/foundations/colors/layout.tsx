'use client'

import { ColorPropertiesPanel } from "@/modules/colors/color-properties-panel"
import { useLayout } from "@/contexts/layout-context"
import { cn } from "@/lib/utils"
import { usePlatformStore } from "@/store/platform-store"

export default function ColorsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isFullscreen } = useLayout()
  const { platforms } = usePlatformStore()

  if (isFullscreen) {
    return children
  }

  return (
    <div className="grid h-full" style={{ gridTemplateColumns: 'minmax(0, 1fr) 320px' }}>
      <div className="min-w-0 overflow-y-auto">
        {children}
      </div>
      <aside className="border-l bg-card overflow-y-auto">
        <ColorPropertiesPanel />
      </aside>
    </div>
  )
}
