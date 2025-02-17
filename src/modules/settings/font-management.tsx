'use client'

import React, { useCallback, useEffect } from 'react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Plus, MoreVertical, ChevronDown } from 'lucide-react'
import { FontUploader } from './font-uploader'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { useFontStore } from '@/store/font-store'
import { useToast } from '@/components/ui/use-toast'
import { VariableTag } from "@/components/ui/variable-tag"

interface Font {
  id: string
  family: string
  category: string
  weight: number
  style: string
  is_variable: boolean
  variable_mode?: 'variable' | 'fixed'
  format: string
  tags: string[]
  file_url: string
}

const presetTexts = [
  { label: 'Headline', text: 'The quick brown fox jumps over the lazy dog' },
  { label: 'Numbers', text: '0123456789' },
  { label: 'Paragraph', text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.' },
  { label: 'Symbols', text: '!@#$%^&*()_+-=[]{}|;:,.<>?' },
  { label: 'Uppercase', text: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' },
  { label: 'Lowercase', text: 'abcdefghijklmnopqrstuvwxyz' },
]

const commonWeights = [
  { value: 100, label: 'Thin' },
  { value: 200, label: 'Extra Light' },
  { value: 300, label: 'Light' },
  { value: 400, label: 'Regular' },
  { value: 500, label: 'Medium' },
  { value: 600, label: 'Semi Bold' },
  { value: 700, label: 'Bold' },
  { value: 800, label: 'Extra Bold' },
  { value: 900, label: 'Black' },
]

const FONT_WEIGHTS = [100, 200, 300, 400, 500, 600, 700, 800, 900]

export function FontManagement() {
  const { fonts, loadFonts, deleteFont, updateFont } = useFontStore()
  const { toast } = useToast()
  const [previewText, setPreviewText] = useState(presetTexts[0].text)
  const [selectedPreset, setSelectedPreset] = useState(presetTexts[0].label)
  const [previewSize, setPreviewSize] = useState(32)
  const [showVariableControls, setShowVariableControls] = useState(false)

  // Load fonts when component mounts
  useEffect(() => {
    loadFonts()

    // Load font faces for all fonts
    fonts.forEach(async (font) => {
      try {
        if (!font.file_url) return

        // Create and load the font face
        const fontFace = new FontFace(
          font.family,
          `url(${font.file_url})`,
          {
            weight: font.is_variable ? '1 1000' : font.weight.toString(),
            style: font.style || 'normal',
            display: 'block',
          }
        )

        const loadedFont = await fontFace.load()
        document.fonts.add(loadedFont)

        // Check if font is variable using OpenType.js
        const response = await fetch(font.file_url)
        const buffer = await response.arrayBuffer()
        
        try {
          if (window.opentype) {
            const fontData = await window.opentype.parse(buffer)
            const isVariable = fontData?.tables?.fvar !== undefined
            
            if (isVariable !== font.is_variable) {
              updateFont?.(font.id, { 
                is_variable: isVariable,
                variable_mode: isVariable ? 'variable' : undefined
              })
            }
          }
        } catch (error) {
          // Silently fail - no need to spam console
        }
      } catch (error) {
        console.error('Error loading font:', error)
        toast({
          title: 'Error',
          description: `Failed to load font: ${font.family}`,
          variant: 'destructive'
        })
      }
    })
  }, [loadFonts, fonts, updateFont, toast])

  const handlePresetChange = useCallback((preset: typeof presetTexts[0]) => {
    setPreviewText(preset.text)
    setSelectedPreset(preset.label)
  }, [])

  const handleDeleteFont = useCallback(async (fontId: string) => {
    try {
      await deleteFont(fontId)
      toast("Font deleted successfully")
    } catch (error) {
      toast("Failed to delete font", {
        variant: "destructive"
      })
    }
  }, [deleteFont, toast])

  const handleSetAsBrandFont = useCallback((fontId: string, type: 'primary' | 'secondary') => {
    // TODO: Implement brand font assignment
    console.log(`Set font ${fontId} as ${type} brand font`)
  }, [])

  const handleWeightChange = useCallback((fontId: string, weight: number) => {
    updateFont?.(fontId, { weight })
  }, [updateFont])

  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setPreviewText(e.target.value)
    setSelectedPreset('Custom')
  }, [])

  const handleSizeChange = useCallback((size: number) => {
    setPreviewSize(size)
  }, [])

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">System Fonts</h3>

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          <Input
            value={previewText}
            onChange={handleTextChange}
            className="max-w-md border-0 bg-muted"
            placeholder="Type custom preview text..."
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="bg-muted border-0 min-w-[120px]">
                {selectedPreset}
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {presetTexts.map((preset) => (
                <DropdownMenuItem
                  key={preset.label}
                  onClick={() => handlePresetChange(preset)}
                >
                  {preset.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Input
            type="number"
            value={previewSize}
            onChange={(e) => handleSizeChange(Number(e.target.value))}
            className="w-24 border-0 bg-muted"
            min={8}
            max={120}
          />
          <span className="text-sm text-muted-foreground">px</span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch
              checked={showVariableControls}
              onCheckedChange={setShowVariableControls}
              className="data-[state=checked]:bg-primary"
            />
            <span className="text-sm">Variable Controls</span>
          </div>

          <Sheet>
            <SheetTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Font
              </Button>
            </SheetTrigger>
            <SheetContent 
              side="right"
              size="full"
              className="h-screen p-0 overflow-y-auto"
            >
              <div className="sticky top-0 z-10 bg-background">
                <div className="px-8 py-6 rounded-lg bg-card text-card-foreground">
                  <SheetHeader>
                    <SheetTitle>Add New Font</SheetTitle>
                    <SheetDescription>
                      Upload font files and configure their properties. Variable fonts will be detected and can be used with full range or fixed weights.
                    </SheetDescription>
                  </SheetHeader>
                </div>
              </div>
              <div className="p-8">
                <FontUploader />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <div className="rounded-md border">
        <Table className="[&_tr:hover]:bg-transparent [&_td]:border-x-0 [&_th]:border-x-0 [&_td]:px-6 [&_th]:px-6">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60%]">Font Family</TableHead>
              <TableHead className="w-[15%]">Format</TableHead>
              <TableHead className="w-[20%]">Properties</TableHead>
              <TableHead className="w-[5%]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fonts.map((font) => (
              <React.Fragment key={font.id}>
                <TableRow>
                  <TableCell className="align-top py-6">
                    <div className="space-y-4">
                      <div className="text-lg font-bold">{font.family}</div>
                      <div 
                        data-font-id={font.id}
                        style={{ 
                          fontFamily: `"${font.family}", ${font.category}`,
                          fontSize: `${previewSize}px`,
                          fontWeight: font.is_variable ? undefined : font.weight,
                          fontVariationSettings: font.is_variable ? `'wght' ${font.weight}` : undefined,
                          lineHeight: 1.2,
                          minHeight: '80px',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                        className="break-words transition-all duration-100 ease-out"
                      >
                        {previewText}
                      </div>
                      <div className="preview-container">
                        {font.is_variable && showVariableControls && (
                          <div className="mt-4 space-y-4">
                            <div className="flex-1">
                              <Slider
                                showValue
                                min={1}
                                max={1000}
                                step={1}
                                defaultValue={[font.weight || 400]}
                                onValueChange={([value]) => {
                                  // Update the preview immediately for smooth interaction
                                  const previewElement = document.querySelector(`[data-font-id="${font.id}"]`);
                                  if (previewElement) {
                                    (previewElement as HTMLElement).style.fontVariationSettings = `'wght' ${value}`;
                                  }
                                  
                                  // Update the store with the current value
                                  handleWeightChange(font.id, value);
                                }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="align-top py-6">
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">{font.category}</Badge>
                      <Badge variant="outline">{font.format.toUpperCase()}</Badge>
                      <VariableTag 
                        isVariable={font.is_variable} 
                        variableMode={font.variable_mode}
                      />
                    </div>
                  </TableCell>
                  <TableCell className="align-top py-6">
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div>Weight: {font.is_variable ? '1-1000' : font.weight}</div>
                      <div>Style: {font.style}</div>
                      {font.tags.length > 0 && (
                        <div>Tags: {font.tags.join(', ')}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="align-top py-6">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleSetAsBrandFont(font.id, 'primary')}>
                          Set as Primary Brand Font
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleSetAsBrandFont(font.id, 'secondary')}>
                          Set as Secondary Brand Font
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDeleteFont(font.id)}
                          className="text-red-600"
                        >
                          Delete Font
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
