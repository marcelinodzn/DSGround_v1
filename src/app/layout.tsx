import { Inter } from "next/font/google"
import { ThemeProvider } from "next-themes"
import { Toaster } from "sonner"
import { LayoutProvider } from "@/contexts/layout-context"
import { TypeScaleProvider } from "@/contexts/type-scale-context"
import { StoreProvider } from "@/providers/store-provider"
import { RootLayoutClient } from "@/components/root-layout-client"
import { SupabaseSyncManager } from "@/components/supabase-sync-manager"
import { TypographySyncInitializer } from "@/components/typography-sync-initializer"
import { cn } from "@/lib/utils"
import { Providers } from '@/components/providers'

import "@/styles/globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Design System Ground",
  description: "A design system management platform",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn("min-h-screen bg-background font-sans antialiased", inter.className)}>
        <Providers
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TypeScaleProvider>
            <StoreProvider>
              <LayoutProvider>
                <RootLayoutClient>
                  {children}
                </RootLayoutClient>
                <SupabaseSyncManager />
                <TypographySyncInitializer />
              </LayoutProvider>
            </StoreProvider>
          </TypeScaleProvider>
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}
