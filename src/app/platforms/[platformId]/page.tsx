'use client'

import { useEffect, useState } from 'react'
import { useLayout } from "@/contexts/layout-context"
import { Button } from "@/components/ui/button"
import { Maximize2, Minimize2, Pencil } from 'lucide-react'
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { usePlatformStore, Platform } from "@/store/platform-store"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { toast } from 'sonner'
import { Icon } from '@iconify/react'
import { IconSelector } from "@/components/platform/icon-selector"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const UNIT_OPTIONS = {
  typography: [
    { value: 'rem', label: 'rem - Root EM' },
    { value: 'em', label: 'em - EM' },
    { value: 'ch', label: 'ch - Character Width' },
    { value: 'ex', label: 'ex - x-Height' },
    { value: 'vw', label: 'vw - Viewport Width' },
    { value: 'vh', label: 'vh - Viewport Height' },
    { value: '%', label: '% - Percentage' },
    { value: 'px', label: 'px - Pixels' },
    { value: 'pt', label: 'pt - Points (Print)' },
    { value: 'pc', label: 'pc - Picas (Print)' }
  ] as const,
  spacing: [
    { value: 'rem', label: 'rem - Root EM' },
    { value: 'em', label: 'em - EM' },
    { value: 'vw', label: 'vw - Viewport Width' },
    { value: 'vh', label: 'vh - Viewport Height' },
    { value: '%', label: '% - Percentage' },
    { value: 'px', label: 'px - Pixels' }
  ] as const,
  dimensions: [
    { value: 'px', label: 'px - Pixels' },
    { value: '%', label: '% - Percentage' },
    { value: 'vw', label: 'vw - Viewport Width' },
    { value: 'vh', label: 'vh - Viewport Height' },
    { value: 'cm', label: 'cm - Centimeters' },
    { value: 'mm', label: 'mm - Millimeters' },
    { value: 'in', label: 'in - Inches' },
    { value: 'm', label: 'm - Meters' }
  ] as const
}

export default function PlatformPage({ params }: { params: { platformId: string } }) {
  const router = useRouter()
  const { currentPlatform: platform, getPlatform, updatePlatform } = usePlatformStore()
  const [isEditingName, setIsEditingName] = useState(false)
  const [newName, setNewName] = useState("")
  const { toggleMaximized, isMaximized } = useLayout()

  useEffect(() => {
    if (params.platformId) {
      getPlatform(params.platformId)
    }
  }, [params.platformId, getPlatform])

  useEffect(() => {
    if (platform) {
      setNewName(platform.name)
    }
  }, [platform])

  const handleNameUpdate = async () => {
    if (!platform || newName === platform.name) return
    try {
      await updatePlatform(platform.id, { name: newName })
      setIsEditingName(false)
      toast.success('Platform name updated')
    } catch (error) {
      console.error('Failed to update platform name:', error)
      toast.error('Failed to update platform name')
    }
  }

  if (!platform) return null

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 group">
          {isEditingName ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleNameUpdate()
                  if (e.key === 'Escape') setIsEditingName(false)
                }}
                className="text-2xl font-semibold bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded px-2"
                autoFocus
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditingName(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleNameUpdate}
              >
                Save
              </Button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3">
                {platform.layout?.icon ? (
                  <Icon 
                    icon={platform.layout.icon}
                    width={24}
                    height={24}
                    className="text-foreground"
                  />
                ) : (
                  <div className="w-6 h-6 rounded border" />
                )}
                <h1 className="text-2xl font-semibold">{platform.name}</h1>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => setIsEditingName(true)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleMaximized}
        >
          {isMaximized ? (
            <Minimize2 className="h-4 w-4" />
          ) : (
            <Maximize2 className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Content */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left Column - Platform Settings */}
        <Card className="col-span-4 p-6">
          <div className="space-y-6">
            {/* Icon Selection */}
            <div>
              <Label className="font-bold mb-1.5 block">Platform Icon</Label>
              <IconSelector
                value={platform.layout?.icon}
                onChange={async (icon) => {
                  try {
                    await updatePlatform(platform.id, {
                      layout: {
                        ...platform.layout,
                        icon
                      }
                    })
                    toast.success('Platform icon updated')
                  } catch (error) {
                    console.error('Failed to update platform icon:', error)
                    toast.error('Failed to update platform icon')
                  }
                }}
              />
            </div>

            {/* Units */}
            <div>
              <Label className="font-bold mb-1.5 block">Units</Label>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-0">Type</TableHead>
                    <TableHead>Unit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="pl-0">Typography</TableCell>
                    <TableCell className="w-full">
                      <Select
                        value={platform.units.typography}
                        onValueChange={(value) => {
                          updatePlatform(platform.id, {
                            units: { ...platform.units, typography: value }
                          })
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {UNIT_OPTIONS.typography.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="pl-0">Spacing</TableCell>
                    <TableCell className="w-full">
                      <Select
                        value={platform.units.spacing}
                        onValueChange={(value) => {
                          updatePlatform(platform.id, {
                            units: { ...platform.units, spacing: value }
                          })
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {UNIT_OPTIONS.spacing.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            {/* Layout Settings */}
            <div>
              <Label className="font-bold mb-1.5 block">Layout</Label>
              <div className="space-y-4 mt-2">
                <div>
                  <Label>Grid Columns</Label>
                  <Input
                    type="number"
                    value={platform.layout.gridColumns}
                    onChange={(e) => {
                      updatePlatform(platform.id, {
                        layout: {
                          ...platform.layout,
                          gridColumns: parseInt(e.target.value)
                        }
                      })
                    }}
                  />
                </div>
                <div>
                  <Label>Grid Gutter (px)</Label>
                  <Input
                    type="number"
                    value={platform.layout.gridGutter}
                    onChange={(e) => {
                      updatePlatform(platform.id, {
                        layout: {
                          ...platform.layout,
                          gridGutter: parseInt(e.target.value)
                        }
                      })
                    }}
                  />
                </div>
                <div>
                  <Label>Container Padding (px)</Label>
                  <Input
                    type="number"
                    value={platform.layout.containerPadding}
                    onChange={(e) => {
                      updatePlatform(platform.id, {
                        layout: {
                          ...platform.layout,
                          containerPadding: parseInt(e.target.value)
                        }
                      })
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Right Column - Platform Content */}
        <div className="col-span-8">
          {/* Add your platform content here */}
        </div>
      </div>
    </div>
  )
}