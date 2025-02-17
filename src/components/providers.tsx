'use client'

import * as React from 'react'
import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { type ThemeProviderProps } from 'next-themes/dist/types'
import { AuthProvider } from '@/providers/auth-provider'

interface ProvidersProps extends ThemeProviderProps {
  children: React.ReactNode
}

export function Providers({ children, ...props }: ProvidersProps) {
  return (
    <AuthProvider>
      <NextThemesProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        {...props}
      >
        {children}
      </NextThemesProvider>
    </AuthProvider>
  )
}
