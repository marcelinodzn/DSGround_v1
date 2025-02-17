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
  
  // Fallback: if value is empty and there is at least one platform, use the first platform's id
  const effectiveValue = value || (platforms.length > 0 ? platforms[0].id : "");

  // Find platform by ID to display current name
  const currentPlatform = platforms.find(p => p.id === effectiveValue);

  return (
    <div className={className}>
      {label && <Label className="mb-2">{label}</Label>}
      <Select 
        value={effectiveValue} 
        onValueChange={(newValue) => onValueChange(newValue)}
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