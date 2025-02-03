'use client'

import { createContext, useContext, useState } from 'react'

interface LayoutContextType {
  isFullscreen: boolean
  setIsFullscreen: (value: boolean) => void
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined)

export function LayoutProvider({ children }: { children: React.ReactNode }) {
  const [isFullscreen, setIsFullscreen] = useState(false)

  return (
    <LayoutContext.Provider value={{ isFullscreen, setIsFullscreen }}>
      {children}
    </LayoutContext.Provider>
  )
}

export function useLayout() {
  const context = useContext(LayoutContext)
  if (context === undefined) {
    throw new Error('useLayout must be used within a LayoutProvider')
  }
  return context
} 