'use client'

import { Button } from "@/components/ui/button"
import { AnimatedTabs } from "@/components/ui/animated-tabs"
import { useState } from "react"

export default function TokensPage() {
  const [activeTab, setActiveTab] = useState('typography')
  
  const tokenTabs = [
    { id: 'typography', label: 'Typography' },
    { id: 'colors', label: 'Colors' },
    { id: 'spacing', label: 'Spacing' },
    { id: 'shadows', label: 'Shadows' }
  ]

  return (
    <div className="space-y-6 p-6">
      <AnimatedTabs 
        tabs={tokenTabs}
        defaultTab="typography"
        onChange={setActiveTab}
      />
      
      {/* Content sections */}
      <div className={activeTab === 'typography' ? 'block' : 'hidden'}>
        {/* Typography content */}
      </div>
      
      <div className={activeTab === 'colors' ? 'block' : 'hidden'}>
        {/* Colors content */}
      </div>
      
      {/* ... other tab contents ... */}
    </div>
  )
}
