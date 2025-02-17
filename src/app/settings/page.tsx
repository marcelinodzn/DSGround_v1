'use client'

import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { useLayout } from '@/contexts/layout-context'
import { AnimatedTabs } from '@/components/ui/animated-tabs'
import { FontManagement } from '@/modules/settings/font-management'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Moon, Sun, Laptop, Maximize2, Minimize2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const { isFullscreen, setIsFullscreen } = useLayout()
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState('global')

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <div className={cn(
      "h-full flex transition-all duration-300 ease-in-out",
      isFullscreen && "fixed inset-0 bg-background z-50 overflow-y-auto p-6 max-w-[100vw]"
    )}>
      <div className="flex-1 min-w-0 max-w-full">
        <div className={cn(
          "flex items-center justify-between mb-6",
          isFullscreen ? "" : "pt-6 px-6"
        )}>
          <div>
            <h1 className="text-[30px] font-bold">Settings</h1>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="ml-2"
          >
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </Button>
        </div>

        <div className="py-8 px-6 max-w-full overflow-x-hidden">
          <div className="space-y-6">
            <AnimatedTabs
              tabs={[
                { id: 'global', label: 'Global Settings' },
                { id: 'typography', label: 'Typography' },
              ]}
              defaultTab="global"
              onChange={setActiveTab}
              layoutId="settings-tabs"
            />
            
            <div className="space-y-10">
              {activeTab === 'global' ? (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold">Appearance</h3>
                    <p className="text-sm text-muted-foreground">
                      Customize how the application looks on your device.
                    </p>
                  </div>
                  <div className="grid gap-6">
                    <div className="grid gap-2">
                      <Label>Theme</Label>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        <Button
                          variant="outline"
                          className={cn(
                            "justify-start",
                            theme === 'light' && "bg-primary text-primary-foreground"
                          )}
                          onClick={() => setTheme('light')}
                        >
                          <Sun className="h-4 w-4 mr-2" />
                          Light
                        </Button>
                        <Button
                          variant="outline"
                          className={cn(
                            "justify-start",
                            theme === 'dark' && "bg-primary text-primary-foreground"
                          )}
                          onClick={() => setTheme('dark')}
                        >
                          <Moon className="h-4 w-4 mr-2" />
                          Dark
                        </Button>
                        <Button
                          variant="outline"
                          className={cn(
                            "justify-start",
                            theme === 'system' && "bg-primary text-primary-foreground"
                          )}
                          onClick={() => setTheme('system')}
                        >
                          <Laptop className="h-4 w-4 mr-2" />
                          System
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <FontManagement />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
