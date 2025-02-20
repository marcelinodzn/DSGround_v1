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
import { Icon } from '@iconify/react'

// Icon sets with their icons
const ICON_SETS = {
  "Material": [
    // Platforms & Devices
    "mdi:devices", "mdi:laptop", "mdi:desktop-windows", "mdi:monitor",
    "mdi:cellphone-android", "mdi:cellphone-iphone", "mdi:cellphone",
    "mdi:tablet-android", "mdi:tablet", "mdi:tablet-ipad",
    "mdi:television", "mdi:cast", "mdi:cast-connected",
    "mdi:virtual-reality", "mdi:rotate-3d", "mdi:augmented-reality",
    "mdi:watch", "mdi:watch-variant", "mdi:devices",
    "mdi:phone-settings", "mdi:phone-sync", "mdi:tablet-dashboard",
    // Print & Media
    "mdi:book", "mdi:book-open", "mdi:book-multiple",
    "mdi:newspaper", "mdi:newspaper-variant", "mdi:file-document",
    "mdi:printer", "mdi:printer-outline", "mdi:printer-pos",
    "mdi:image", "mdi:image-multiple", "mdi:folder-image",
    "mdi:video", "mdi:movie", "mdi:movie-open",
    // Store & Commerce
    "mdi:store", "mdi:storefront", "mdi:cart",
    "mdi:cash-register", "mdi:receipt", "mdi:credit-card",
    "mdi:qrcode", "mdi:barcode", "mdi:barcode-scan",
    // UI & Navigation
    "mdi:view-dashboard", "mdi:view-grid", "mdi:view-dashboard-variant",
    "mdi:view-grid-plus", "mdi:view-compact", "mdi:view-sidebar",
    "mdi:menu", "mdi:apps", "mdi:widgets", "mdi:puzzle",
    // Content & Tools
    "mdi:palette", "mdi:brush", "mdi:pencil",
    "mdi:pencil-ruler", "mdi:ruler-square", "mdi:tools",
    "mdi:format-paint", "mdi:palette-swatch", "mdi:brush-variant"
  ],
  "Lucide": [
    // Platforms & Devices
    "computer", "laptop", "monitor",
    "smartphone", "tablet", "phone",
    "tv", "tv-2", "cast",
    "glasses", "gamepad", "gamepad-2",
    "watch", "devices", "device-mobile",
    // Print & Media
    "book", "book-open", "book-copy",
    "newspaper", "scroll-text", "file-text",
    "printer", "print", "scanner",
    "image", "images", "gallery",
    "video", "film", "clapperboard",
    // Store & Commerce
    "store", "shopping-bag", "shopping-cart",
    "qr-code", "barcode", "scan-line",
    "credit-card", "wallet", "receipt",
    // UI & Navigation
    "layout-dashboard", "layout-grid",
    "layout-list", "layout-template", "layers",
    "grid", "table", "kanban", "sidebar",
    // Content & Tools
    "palette", "paintbrush", "paintbrush-2",
    "pen-tool", "pencil", "brush",
    "wand-2", "settings", "wrench"
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

  const getIconSet = (icon: string) => {
    // For Material icons, they already include the mdi: prefix
    if (selectedSet === "Material") {
      return icon
    }
    // For Lucide icons, add the lucide: prefix
    return `lucide:${icon}`
  }

  // Function to display the icon name without the prefix
  const getDisplayName = (icon: string) => {
    return icon.split(':').pop() || icon
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-start text-left font-normal"
        >
          <div className="flex items-center gap-2">
            {value ? (
              <Icon 
                icon={value} 
                width={16}
                height={16}
                className="text-foreground"
              />
            ) : (
              <div className="w-4 h-4 rounded border" />
            )}
            <span>
              {value ? getDisplayName(value) : 'Select icon'}
            </span>
          </div>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[600px] p-6">
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
                  {filteredIcons.map((icon, index) => {
                    const iconKey = getIconSet(icon)
                    return (
                      <Button
                        key={`${selectedSet}-${icon}-${index}`}
                        variant="outline"
                        className={cn(
                          "h-10 w-10 p-0",
                          value === iconKey && "border-primary"
                        )}
                        onClick={() => {
                          onChange?.(iconKey)
                          setOpen(false)
                        }}
                      >
                        <Icon 
                          icon={iconKey}
                          width={20}
                          height={20}
                          className="text-foreground"
                        />
                      </Button>
                    )
                  })}
                </div>
              </ScrollArea>
            </TabsContent>
            <TabsContent value="Lucide" className="mt-0">
              <ScrollArea className="h-[400px] rounded-md border p-4">
                <div className="grid grid-cols-8 gap-2">
                  {filteredIcons.map((icon, index) => {
                    const iconKey = getIconSet(icon)
                    return (
                      <Button
                        key={`${selectedSet}-${icon}-${index}`}
                        variant="outline"
                        className={cn(
                          "h-10 w-10 p-0",
                          value === iconKey && "border-primary"
                        )}
                        onClick={() => {
                          onChange?.(iconKey)
                          setOpen(false)
                        }}
                      >
                        <Icon 
                          icon={iconKey}
                          width={20}
                          height={20}
                          className="text-foreground"
                        />
                      </Button>
                    )
                  })}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}
