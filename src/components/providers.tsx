'use client'

import * as React from 'react'
import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { AuthProvider } from '@/providers/auth-provider'

interface ProvidersProps {
  children: React.ReactNode
  attribute?: string
  defaultTheme?: string
  enableSystem?: boolean
  disableTransitionOnChange?: boolean
}

export function Providers({ children, ...props }: ProvidersProps) {
  return (
    <AuthProvider>
      <NextThemesProvider {...props}>
        {children}
      </NextThemesProvider>
    </AuthProvider>
  )
}
