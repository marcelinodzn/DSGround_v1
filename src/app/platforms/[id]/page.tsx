'use client'

import { useEffect, useState } from 'react'
import { Button } from "@/components/ui/button"
import { Pencil } from 'lucide-react'
import { usePlatformStore } from "@/store/platform-store"
import { useParams } from "next/navigation"
import { IconSelector } from "@/components/platform/icon-selector"
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
    <div className="p-6 space-y-8">
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
              {platform.icon && (
                <img 
                  src={platform.icon} 
                  alt=""
                  className="w-8 h-8 object-contain"
                />
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

      <Separator />

      {/* Platform Settings */}
      <div className="space-y-6 max-w-2xl">
        <div>
          <h2 className="text-lg font-semibold mb-4">Platform Icon</h2>
          <IconSelector
            value={platform.icon || undefined}
            onChange={async (icon) => {
              try {
                await updatePlatform(platform.id, { icon })
              } catch (error) {
                console.error('Failed to update platform icon:', error)
              }
            }}
          />
          <p className="text-sm text-muted-foreground mt-2">
            Choose an icon to represent your platform
          </p>
        </div>
      </div>
    </div>
  )
}
