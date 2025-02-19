'use client'

import { useState, useEffect } from 'react'
import { Command } from 'cmdk'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Icons } from 'lucide-react'
import { cn } from '@/lib/utils'

// Popular icon sets from Iconify
const ICON_SETS = [
  { id: 'material-symbols', name: 'Material Symbols' },
  { id: 'ph', name: 'Phosphor' },
  { id: 'carbon', name: 'Carbon' },
  { id: 'ri', name: 'Remix Icons' },
  { id: 'bi', name: 'Bootstrap Icons' }
]

interface IconPickerProps {
  value?: string
  onChange?: (value: string) => void
}

export function IconPicker({ value, onChange }: IconPickerProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [icons, setIcons] = useState<{ name: string; svg: string }[]>([])
  const [selectedSet, setSelectedSet] = useState(ICON_SETS[0])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchIcons = async () => {
      if (!open) return
      setLoading(true)
      try {
        const response = await fetch(
          `https://api.iconify.design/${selectedSet.id}?query=${search}`
        )
        const data = await response.json()
        setIcons(
          Object.keys(data.icons).map((name) => ({
            name,
            svg: `https://api.iconify.design/${selectedSet.id}/${name}.svg`
          }))
        )
      } catch (error) {
        console.error('Failed to fetch icons:', error)
      }
      setLoading(false)
    }

    const debounce = setTimeout(fetchIcons, 300)
    return () => clearTimeout(debounce)
  }, [search, selectedSet.id, open])

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
      <DialogContent className="max-w-[640px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Select Icon</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex gap-2">
            <Input
              placeholder="Search icons..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1"
            />
            <select
              value={selectedSet.id}
              onChange={(e) => {
                const set = ICON_SETS.find((s) => s.id === e.target.value)
                if (set) setSelectedSet(set)
              }}
              className="px-3 py-2 rounded-md border"
            >
              {ICON_SETS.map((set) => (
                <option key={set.id} value={set.id}>
                  {set.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="border rounded-lg">
            <Command>
              <div className="grid grid-cols-8 gap-2 p-4 max-h-[400px] overflow-auto">
                {loading ? (
                  <div className="col-span-8 py-6 text-center text-muted-foreground">
                    Loading icons...
                  </div>
                ) : icons.length === 0 ? (
                  <div className="col-span-8 py-6 text-center text-muted-foreground">
                    No icons found
                  </div>
                ) : (
                  icons.map((icon) => (
                    <Button
                      key={icon.name}
                      variant="ghost"
                      className={cn(
                        "h-12 w-12 p-0",
                        value === icon.svg && "bg-accent"
                      )}
                      onClick={() => {
                        onChange?.(icon.svg)
                        setOpen(false)
                      }}
                    >
                      <img
                        src={icon.svg}
                        alt={icon.name}
                        className="w-5 h-5"
                      />
                    </Button>
                  ))
                )}
              </div>
            </Command>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
