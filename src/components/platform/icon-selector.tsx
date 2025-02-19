'use client'

import * as React from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

// Icon sets with their icons
const ICON_SETS = {
  "Material": [
    "home", "settings", "person", "search", "notifications", "mail", "calendar",
    "bookmark", "favorite", "shopping_cart", "dashboard", "analytics", "build",
    "code", "cloud", "security", "phone", "message", "menu", "close", "add",
    "remove", "edit", "delete", "share", "download", "upload", "refresh"
  ],
  "Lucide": [
    "home", "settings", "user", "search", "bell", "mail", "calendar",
    "bookmark", "heart", "shopping-cart", "layout", "bar-chart", "tool",
    "code", "cloud", "shield", "phone", "message-circle", "menu", "x", "plus",
    "minus", "edit", "trash", "share", "download", "upload", "refresh-cw"
  ]
}

interface IconSelectorProps {
  value?: string
  onChange?: (value: string) => void
}

export function IconSelector({ value, onChange }: IconSelectorProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState('')
  const [selectedSet, setSelectedSet] = React.useState<keyof typeof ICON_SETS>("Material")

  const filteredIcons = React.useMemo(() => {
    const query = search.toLowerCase()
    return ICON_SETS[selectedSet].filter(icon => 
      icon.toLowerCase().includes(query)
    )
  }, [selectedSet, search])

  const getIconUrl = (icon: string) => {
    const prefix = selectedSet === "Material" ? "material-symbols" : "lucide"
    return `https://api.iconify.design/${prefix}/${icon}.svg`
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="w-[240px] justify-start text-left font-normal"
        >
          <div className="flex items-center gap-2">
            {value ? (
              <img src={value} alt="" className="w-4 h-4" />
            ) : (
              <div className="w-4 h-4 rounded border" />
            )}
            <span>
              {value ? value.split('/').pop()?.replace('.svg', '') : 'Select icon'}
            </span>
          </div>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Select Icon</DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          <Tabs defaultValue="Material" onValueChange={(v) => setSelectedSet(v as keyof typeof ICON_SETS)}>
            <div className="flex items-center space-x-4 mb-4">
              <TabsList>
                <TabsTrigger value="Material">Material</TabsTrigger>
                <TabsTrigger value="Lucide">Lucide</TabsTrigger>
              </TabsList>
              <Input
                placeholder="Search icons..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1"
              />
            </div>
            <TabsContent value="Material" className="mt-0">
              <ScrollArea className="h-[400px] rounded-md border p-4">
                <div className="grid grid-cols-8 gap-2">
                  {filteredIcons.map((icon) => {
                    const iconUrl = getIconUrl(icon)
                    return (
                      <Button
                        key={icon}
                        variant="outline"
                        className={cn(
                          "h-10 w-10 p-0",
                          value === iconUrl && "border-primary"
                        )}
                        onClick={() => {
                          onChange?.(iconUrl)
                          setOpen(false)
                        }}
                      >
                        <img 
                          src={iconUrl}
                          alt={icon}
                          className="w-5 h-5"
                        />
                      </Button>
                    )}
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
            <TabsContent value="Lucide" className="mt-0">
              <ScrollArea className="h-[400px] rounded-md border p-4">
                <div className="grid grid-cols-8 gap-2">
                  {filteredIcons.map((icon) => {
                    const iconUrl = getIconUrl(icon)
                    return (
                      <Button
                        key={icon}
                        variant="outline"
                        className={cn(
                          "h-10 w-10 p-0",
                          value === iconUrl && "border-primary"
                        )}
                        onClick={() => {
                          onChange?.(iconUrl)
                          setOpen(false)
                        }}
                      >
                        <img 
                          src={iconUrl}
                          alt={icon}
                          className="w-5 h-5"
                        />
                      </Button>
                    )}
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}
