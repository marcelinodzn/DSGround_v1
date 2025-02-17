import { Inter } from "next/font/google"
import { ThemeProvider } from "next-themes"
import { Toaster } from "sonner"
import { LayoutProvider } from "@/contexts/layout-context"
import { TypeScaleProvider } from "@/contexts/type-scale-context"
import { StoreProvider } from "@/providers/store-provider"
import { RootLayoutClient } from "@/components/root-layout-client"
import { cn } from "@/lib/utils"

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
        <ThemeProvider
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
              </LayoutProvider>
            </StoreProvider>
          </TypeScaleProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
