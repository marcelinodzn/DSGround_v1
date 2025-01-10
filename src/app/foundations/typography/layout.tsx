'use client'

import { PropertiesPanel } from "@/components/typography/properties-panel"

export default function TypographyLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-full">
      <div className="flex-1">
        {children}
      </div>
      <aside className="w-80 border-l bg-card">
        <PropertiesPanel />
      </aside>
    </div>
  )
}
