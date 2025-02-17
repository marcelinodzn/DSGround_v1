'use client'

import React, { createContext, useContext, useState } from 'react'
import { Platform, TypeStyle } from '@/types/typography'

type ScaleMethod = 'modular' | 'linear' | 'custom'

interface TypeScaleContextType {
  baseSize: number
  setBaseSize: (size: number) => void
  ratio: number
  setRatio: (ratio: number) => void
  steps: number
  setSteps: (steps: number) => void
  scaleMethod: ScaleMethod
  setScaleMethod: (method: ScaleMethod) => void
  typeStyles: {
    [key in Platform]: TypeStyle[]
  }
  setTypeStyles: (platform: Platform, styles: TypeStyle[]) => void
}

const TypeScaleContext = createContext<TypeScaleContextType | undefined>(undefined)

export function TypeScaleProvider({ children }: { children: React.ReactNode }) {
  const [baseSize, setBaseSize] = useState(16)
  const [ratio, setRatio] = useState(1.25)
  const [steps, setSteps] = useState(6)
  const [scaleMethod, setScaleMethod] = useState<ScaleMethod>('modular')
  const [typeStyles, setTypeStylesState] = useState<{[key in Platform]: TypeStyle[]}>({
    web: [],
    ios: [],
    android: []
  })

  const setTypeStyles = (platform: Platform, styles: TypeStyle[]) => {
    setTypeStylesState(prev => ({
      ...prev,
      [platform]: styles
    }))
  }

  return (
    <TypeScaleContext.Provider
      value={{
        baseSize,
        setBaseSize,
        ratio,
        setRatio,
        steps,
        setSteps,
        scaleMethod,
        setScaleMethod,
        typeStyles,
        setTypeStyles,
      }}
    >
      {children}
    </TypeScaleContext.Provider>
  )
}

export function useTypeScale() {
  const context = useContext(TypeScaleContext)
  if (context === undefined) {
    throw new Error('useTypeScale must be used within a TypeScaleProvider')
  }
  return context
} 