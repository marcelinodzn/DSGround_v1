import '../styles/globals.css'
import { Inter } from 'next/font/google'
import { RootLayoutClient } from '@/components/root-layout-client'
import { LayoutProvider } from '@/contexts/layout-context'
import { SupabaseSyncManager } from '@/components/supabase-sync-manager'
import { TypographyInitializer } from '@/components/typography-initializer'
import { TypographySyncInitializer } from '@/components/typography-sync-initializer'
import { TypescriptInitializer } from '@/components/typescript-initializer'
import { Toaster } from 'sonner'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Design System Ground',
  description: 'Design System Generator',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Toaster position="top-right" richColors />
        <LayoutProvider>
          <RootLayoutClient>
            {/* Data loading and sync management components */}
            <SupabaseSyncManager />
            <TypographyInitializer />
            <TypographySyncInitializer />
            <TypescriptInitializer />
            {children}
          </RootLayoutClient>
        </LayoutProvider>
      </body>
    </html>
  )
}
