'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { usePlatformStore } from "@/store/platform-store"
import { useBrandStore } from "@/store/brand-store"
import { IconSelector } from "@/components/platform/icon-selector"

export default function NewPlatformPage() {
  const router = useRouter()
  const { currentBrand } = useBrandStore()
  const { addPlatform } = usePlatformStore()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [icon, setIcon] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentBrand) return

    setIsSubmitting(true)
    try {
      const platform = await addPlatform(currentBrand.id, {
        name,
        description,
        icon,
        units: {
          typography: 'rem',
          spacing: 'rem',
          borderWidth: 'px',
          borderRadius: 'px'
        },
        layout: {
          gridColumns: 12,
          gridGutter: 16,
          containerPadding: 16
        }
      })
      router.push(`/platforms/${platform.id}`)
    } catch (error) {
      console.error('Failed to create platform:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-[30px] font-bold mb-8">Create New Platform</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
        <div className="space-y-2">
          <label htmlFor="icon" className="text-sm font-medium">
            Platform Icon
          </label>
          <IconSelector
            value={icon}
            onChange={setIcon}
          />
          <p className="text-sm text-muted-foreground mt-1">
            Choose an icon to represent your platform
          </p>
        </div>

        <div className="space-y-2">
          <label htmlFor="name" className="text-sm font-medium">
            Platform Name
          </label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter platform name"
            required
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="description" className="text-sm font-medium">
            Description
          </label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter platform description"
            rows={4}
          />
        </div>

        <div className="flex items-center gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || !name.trim()}
          >
            Create Platform
          </Button>
        </div>
      </form>
    </div>
  )
}