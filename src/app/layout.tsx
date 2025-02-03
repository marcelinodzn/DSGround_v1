import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { RootLayoutClient } from '@/components/root-layout'
import { cn } from '@/lib/utils'
import { LayoutProvider } from '@/contexts/layout-context'
import { TypeScaleProvider } from '@/contexts/type-scale-context'
import { Toaster } from 'sonner'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Design System Ground',
  description: 'Headless Design System Management Platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn("min-h-screen bg-background font-sans antialiased", inter.className)}>
        <TypeScaleProvider>
          <LayoutProvider>
            <RootLayoutClient>
              <main className="h-[calc(100vh-4rem)] overflow-y-auto">
                {children}
              </main>
            </RootLayoutClient>
          </LayoutProvider>
        </TypeScaleProvider>
        <Toaster />
      </body>
    </html>
  )
}
