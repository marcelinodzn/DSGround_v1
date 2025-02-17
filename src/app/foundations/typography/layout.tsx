'use client'

import { PropertiesPanel } from "@/modules/typography/properties-panel"
import { useLayout } from "@/contexts/layout-context"
import { cn } from "@/lib/utils"
import { usePlatformStore } from "@/store/platform-store"

export default function TypographyLayout({
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
    <div className="grid h-full" style={{ gridTemplateColumns: 'minmax(0, 1fr)' + (platforms.length > 0 ? ' 320px' : '') }}>
      <div className="min-w-0 overflow-y-auto">
        {children}
      </div>
      {platforms.length > 0 && (
        <aside className="border-l bg-card overflow-y-auto">
          <PropertiesPanel />
        </aside>
      )}
    </div>
  )
}
