'use client'

import * as React from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'

// Popular icon sets with their base URLs
const ICON_SETS = [
  {
    id: 'material-symbols',
    name: 'Material Symbols',
    icons: [
      'home', 'settings', 'person', 'search', 'notifications', 'mail', 'calendar',
      'bookmark', 'favorite', 'shopping_cart', 'dashboard', 'analytics', 'build',
      'code', 'cloud', 'security', 'phone', 'message', 'menu', 'close', 'add',
      'remove', 'edit', 'delete', 'share', 'download', 'upload', 'refresh',
      'play_arrow', 'pause', 'stop', 'skip_next', 'skip_previous', 'volume_up',
      'volume_down', 'brightness_high', 'brightness_low', 'wifi', 'bluetooth'
    ]
  },
  {
    id: 'lucide',
    name: 'Lucide Icons',
    icons: [
      'home', 'settings', 'user', 'search', 'bell', 'mail', 'calendar',
      'bookmark', 'heart', 'shopping-cart', 'layout', 'bar-chart', 'tool',
      'code', 'cloud', 'shield', 'phone', 'message-circle', 'menu', 'x', 'plus',
      'minus', 'edit', 'trash', 'share', 'download', 'upload', 'refresh-cw',
      'play', 'pause', 'square', 'skip-forward', 'skip-back', 'volume-2',
      'volume-1', 'sun', 'moon', 'wifi', 'bluetooth'
    ]
  }
]

interface IconPickerProps {
  value?: string
  onChange?: (value: string) => void
}

export function IconPicker({ value, onChange }: IconPickerProps) {
  const [open, setOpen] = React.useState(false)
  const [selectedSet, setSelectedSet] = React.useState(ICON_SETS[0])
  const [searchQuery, setSearchQuery] = React.useState('')

  const filteredIcons = React.useMemo(() => {
    const query = searchQuery.toLowerCase()
    return selectedSet.icons.filter(icon => 
      icon.toLowerCase().includes(query)
    )
  }, [selectedSet, searchQuery])

  const getIconUrl = (icon: string) => {
    return `https://api.iconify.design/${selectedSet.id}/${icon}.svg`
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {value ? (
            <div className="flex items-center gap-2">
              <img 
                src={value} 
                alt="" 
                className="w-4 h-4"
              />
              <span>{value.split('/').pop()?.replace('.svg', '')}</span>
            </div>
          ) : (
            <span>Select icon...</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput 
            placeholder="Search icons..." 
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandEmpty>No icons found.</CommandEmpty>
          <CommandGroup>
            <div className="p-1">
              <select
                value={selectedSet.id}
                onChange={(e) => {
                  const set = ICON_SETS.find(s => s.id === e.target.value)
                  if (set) setSelectedSet(set)
                }}
                className="w-full p-2 rounded-md border mb-2"
              >
                {ICON_SETS.map((set) => (
                  <option key={set.id} value={set.id}>
                    {set.name}
                  </option>
                ))}
              </select>
            </div>
          </CommandGroup>
          <CommandGroup>
            <ScrollArea className="h-[300px]">
              <div className="grid grid-cols-6 gap-1 p-1">
                {filteredIcons.map((icon) => {
                  const iconUrl = getIconUrl(icon)
                  return (
                    <CommandItem
                      key={icon}
                      value={icon}
                      onSelect={() => {
                        onChange?.(iconUrl)
                        setOpen(false)
                      }}
                      className="px-2 py-2 cursor-pointer"
                    >
                      <img 
                        src={iconUrl} 
                        alt={icon} 
                        className="w-5 h-5"
                      />
                    </CommandItem>
                  )
                })}
              </div>
            </ScrollArea>
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
