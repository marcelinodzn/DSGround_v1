'use client'

import { useEffect, useState } from 'react'
import { useLayout } from "@/contexts/layout-context"
import { Button } from "@/components/ui/button"
import { Maximize2, Minimize2 } from 'lucide-react'
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { usePlatformStore, Platform } from "@/store/platform-store"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { toast } from 'sonner'
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
  const { isFullscreen, setIsFullscreen } = useLayout()
  const router = useRouter()
  const { platforms, updatePlatform } = usePlatformStore()
  const [platform, setPlatform] = useState<Platform | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    units: {
      typography: 'rem' as const,
      spacing: 'px' as const,
      dimensions: 'px' as const
    },
    layout: {
      baseSize: 16,
      gridColumns: 12,
      gridGutter: 24,
      containerPadding: 16
    }
  })

  useEffect(() => {
    const currentPlatform = platforms.find(p => p.id === params.platformId)
    if (currentPlatform) {
      setPlatform(currentPlatform)
      setEditForm({
        name: currentPlatform.name,
        description: currentPlatform.description || '',
        units: currentPlatform.units,
        layout: currentPlatform.layout
      })
    }
  }, [params.platformId, platforms])

  const handleSave = async () => {
    if (!platform) return

    try {
      await updatePlatform(platform.id, {
        name: editForm.name.trim(),
        description: editForm.description.trim() || null,
        units: editForm.units,
        layout: editForm.layout
      })
      setIsEditing(false)
      toast.success('Platform updated successfully')
    } catch (error) {
      console.error('Update platform error:', error)
      toast.error('Failed to update platform')
    }
  }

  if (!platform) {
    return <div>Loading...</div>
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
            <div className="flex flex-col gap-2">
              <h1 className="text-[30px] font-bold">
                {platform.name}
              </h1>
              {isEditing ? (
                <Input
                  value={editForm.description}
                  onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Add description"
                  className="max-w-md"
                />
              ) : (
                <p className="text-sm text-muted-foreground max-w-md">
                  {platform.description || 'No description'}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
            {isEditing ? (
              <>
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave}>
                  Save Changes
                </Button>
              </>
            ) : (
              <Button onClick={() => setIsEditing(true)}>
                Edit Platform
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsFullscreen(!isFullscreen)}
            >
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        <div className="py-8 px-6">
          <Card className="p-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Setting</TableHead>
                  <TableHead>Value</TableHead>
                  {isEditing && <TableHead>Edit</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Units Section */}
                <TableRow>
                  <TableCell className="font-medium">Typography Units</TableCell>
                  <TableCell>{platform.units.typography}</TableCell>
                  {isEditing && (
                    <TableCell>
                      <Select
                        value={editForm.units.typography}
                        onValueChange={(value: Platform['units']['typography']) => 
                          setEditForm(prev => ({
                            ...prev,
                            units: { ...prev.units, typography: value }
                          }))
                        }
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Select unit" />
                        </SelectTrigger>
                        <SelectContent>
                          {UNIT_OPTIONS.typography.map(({ value, label }) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  )}
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Spacing Units</TableCell>
                  <TableCell>{platform.units.spacing}</TableCell>
                  {isEditing && (
                    <TableCell>
                      <Select
                        value={editForm.units.spacing}
                        onValueChange={(value: Platform['units']['spacing']) => 
                          setEditForm(prev => ({
                            ...prev,
                            units: { ...prev.units, spacing: value }
                          }))
                        }
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Select unit" />
                        </SelectTrigger>
                        <SelectContent>
                          {UNIT_OPTIONS.spacing.map(({ value, label }) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  )}
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Dimension Units</TableCell>
                  <TableCell>{platform.units.dimensions}</TableCell>
                  {isEditing && (
                    <TableCell>
                      <Select
                        value={editForm.units.dimensions}
                        onValueChange={(value: Platform['units']['dimensions']) => 
                          setEditForm(prev => ({
                            ...prev,
                            units: { ...prev.units, dimensions: value }
                          }))
                        }
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Select unit" />
                        </SelectTrigger>
                        <SelectContent>
                          {UNIT_OPTIONS.dimensions.map(({ value, label }) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  )}
                </TableRow>

                {/* Layout Section */}
                <TableRow>
                  <TableCell className="font-medium">Base Size</TableCell>
                  <TableCell>{platform.layout.baseSize}px</TableCell>
                  {isEditing && (
                    <TableCell>
                      <Input
                        type="number"
                        value={editForm.layout.baseSize}
                        onChange={(e) => setEditForm(prev => ({
                          ...prev,
                          layout: { ...prev.layout, baseSize: parseInt(e.target.value) }
                        }))}
                        className="w-[180px]"
                      />
                    </TableCell>
                  )}
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Grid Columns</TableCell>
                  <TableCell>{platform.layout.gridColumns}</TableCell>
                  {isEditing && (
                    <TableCell>
                      <Input
                        type="number"
                        value={editForm.layout.gridColumns}
                        onChange={(e) => setEditForm(prev => ({
                          ...prev,
                          layout: { ...prev.layout, gridColumns: parseInt(e.target.value) }
                        }))}
                        className="w-[180px]"
                      />
                    </TableCell>
                  )}
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Grid Gutter</TableCell>
                  <TableCell>{platform.layout.gridGutter}px</TableCell>
                  {isEditing && (
                    <TableCell>
                      <Input
                        type="number"
                        value={editForm.layout.gridGutter}
                        onChange={(e) => setEditForm(prev => ({
                          ...prev,
                          layout: { ...prev.layout, gridGutter: parseInt(e.target.value) }
                        }))}
                        className="w-[180px]"
                      />
                    </TableCell>
                  )}
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Container Padding</TableCell>
                  <TableCell>{platform.layout.containerPadding}px</TableCell>
                  {isEditing && (
                    <TableCell>
                      <Input
                        type="number"
                        value={editForm.layout.containerPadding}
                        onChange={(e) => setEditForm(prev => ({
                          ...prev,
                          layout: { ...prev.layout, containerPadding: parseInt(e.target.value) }
                        }))}
                        className="w-[180px]"
                      />
                    </TableCell>
                  )}
                </TableRow>
              </TableBody>
            </Table>
          </Card>
        </div>
      </div>
    </div>
  )
} 