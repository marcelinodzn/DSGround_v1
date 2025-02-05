'use client'

import { usePlatformStore, Platform } from "@/store/platform-store"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"

interface PlatformSelectProps {
  value: string
  onValueChange: (value: string) => void
  label?: string
  className?: string
}

export function PlatformSelect({ value, onValueChange, label, className }: PlatformSelectProps) {
  const platforms = usePlatformStore((state) => state.platforms)
  
  // Find platform by ID to display current name
  const currentPlatform = platforms.find(p => p.id === value)

  return (
    <div className={className}>
      {label && <Label className="mb-2">{label}</Label>}
      <Select 
        value={value} 
        onValueChange={onValueChange}
      >
        <SelectTrigger>
          <SelectValue>
            {currentPlatform?.name || "Select platform"}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {platforms.map((platform) => (
            <SelectItem key={platform.id} value={platform.id}>
              {platform.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
} 