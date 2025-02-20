'use client'

import { useEffect, useState } from 'react'
import { Button } from "@/components/ui/button"
import { Pencil } from 'lucide-react'
import { usePlatformStore } from "@/store/platform-store"
import { useParams } from "next/navigation"
import { IconSelector } from "@/components/platform/icon-selector"
import { Icon } from "@/components/ui/icon"
import { Separator } from "@/components/ui/separator"

export default function PlatformDetailPage() {
  const params = useParams()
  const { platform, fetchPlatform, updatePlatform } = usePlatformStore()
  const [isEditingName, setIsEditingName] = useState(false)
  const [newName, setNewName] = useState("")

  useEffect(() => {
    if (params.id) {
      fetchPlatform(params.id as string)
    }
  }, [params.id, fetchPlatform])

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
    } catch (error) {
      console.error('Failed to update platform name:', error)
    }
  }

  if (!platform) return null

  return (
    <div className="p-6">
      {/* Platform Header */}
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
              className="text-[30px] font-bold bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded px-2"
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
                  width={32}
                  height={32}
                  className="text-foreground"
                />
              ) : (
                <div className="w-8 h-8 rounded border" />
              )}
              <h1 className="text-[30px] font-bold">{platform.name}</h1>
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

      <Separator className="my-6" />

      {/* Platform Settings */}
      <div className="space-y-6 max-w-2xl">
        <div>
          <h2 className="text-lg font-semibold mb-4">Platform Icon</h2>
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
              } catch (error) {
                console.error('Failed to update platform icon:', error)
              }
            }}
          />
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-4">Units</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Typography</label>
                <select
                  value={platform.units.typography}
                  onChange={(e) => updatePlatform(platform.id, {
                    units: { ...platform.units, typography: e.target.value }
                  })}
                  className="w-full mt-1"
                >
                  <option value="rem">rem</option>
                  <option value="em">em</option>
                  <option value="px">px</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Spacing</label>
                <select
                  value={platform.units.spacing}
                  onChange={(e) => updatePlatform(platform.id, {
                    units: { ...platform.units, spacing: e.target.value }
                  })}
                  className="w-full mt-1"
                >
                  <option value="rem">rem</option>
                  <option value="em">em</option>
                  <option value="px">px</option>
                </select>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Border Width</label>
                <select
                  value={platform.units.borderWidth}
                  onChange={(e) => updatePlatform(platform.id, {
                    units: { ...platform.units, borderWidth: e.target.value }
                  })}
                  className="w-full mt-1"
                >
                  <option value="px">px</option>
                  <option value="rem">rem</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Border Radius</label>
                <select
                  value={platform.units.borderRadius}
                  onChange={(e) => updatePlatform(platform.id, {
                    units: { ...platform.units, borderRadius: e.target.value }
                  })}
                  className="w-full mt-1"
                >
                  <option value="px">px</option>
                  <option value="rem">rem</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-4">Layout</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Grid Columns</label>
              <input
                type="number"
                value={platform.layout.gridColumns}
                onChange={(e) => updatePlatform(platform.id, {
                  layout: { ...platform.layout, gridColumns: parseInt(e.target.value) }
                })}
                className="w-full mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Grid Gutter (px)</label>
              <input
                type="number"
                value={platform.layout.gridGutter}
                onChange={(e) => updatePlatform(platform.id, {
                  layout: { ...platform.layout, gridGutter: parseInt(e.target.value) }
                })}
                className="w-full mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Container Padding (px)</label>
              <input
                type="number"
                value={platform.layout.containerPadding}
                onChange={(e) => updatePlatform(platform.id, {
                  layout: { ...platform.layout, containerPadding: parseInt(e.target.value) }
                })}
                className="w-full mt-1"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
