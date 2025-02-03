'use client'

import { PropertiesPanel } from "@/components/typography/properties-panel"
import { useLayout } from "@/contexts/layout-context"
import { cn } from "@/lib/utils"

export default function TypographyLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isFullscreen } = useLayout()

  if (isFullscreen) {
    return children
  }

  return (
    <div className="grid h-full" style={{ gridTemplateColumns: 'minmax(0, 1fr) 320px' }}>
      <div className="min-w-0 overflow-y-auto">
        {children}
      </div>
      <aside className="border-l bg-card overflow-y-auto">
        <PropertiesPanel />
      </aside>
    </div>
  )
}
