'use client'

import { createContext, useContext, useState } from 'react'

interface LayoutContextType {
  isFullscreen: boolean
  setIsFullscreen: (value: boolean) => void
  isMaximized: boolean
  toggleMaximized: () => void
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined)

export function LayoutProvider({ children }: { children: React.ReactNode }) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isMaximized, setIsMaximized] = useState(false)

  const toggleMaximized = () => {
    setIsMaximized(prev => !prev)
  }

  return (
    <LayoutContext.Provider value={{ 
      isFullscreen, 
      setIsFullscreen, 
      isMaximized, 
      toggleMaximized 
    }}>
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