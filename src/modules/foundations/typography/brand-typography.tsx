'use client'

import React, { useEffect } from 'react'
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
import { Badge } from "@/components/ui/badge"
import { VariableTag } from "@/components/ui/variable-tag"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"
import { useBrandStore } from "@/stores/brand"
import { useFontStore } from "@/stores/font"

interface BrandTypographyProps {
  fonts: any[]
}

export function BrandTypography({ fonts }: BrandTypographyProps) {
  const { currentBrand } = useBrandStore()
  const { 
    brandTypography, 
    saveBrandTypography, 
    loadBrandTypography 
  } = useFontStore()

  // Get current typography settings for the brand
  const currentTypography = currentBrand?.id ? brandTypography[currentBrand.id] : null

  // Load brand typography when component mounts or brand changes
  useEffect(() => {
    if (currentBrand?.id) {
      loadBrandTypography(currentBrand.id)
    }
  }, [currentBrand?.id, loadBrandTypography])

  const handleFontChange = async (value: string, role: 'primary' | 'secondary' | 'tertiary') => {
    if (!currentBrand?.id) return

    try {
      await saveBrandTypography(currentBrand.id, {
        brand_id: currentBrand.id,
        [`${role}_font_id`]: value || null
      })
    } catch (error) {
      console.error('Error updating font:', error)
    }
  }

  const getSelectedFont = (fontId: string) => {
    return fonts.find(font => font.id === fontId)
  }

  return (
    <div className="space-y-6">
      <p className="text-muted-foreground">
        Select the typefaces that will be used across your brand. For optimal consistency,
        we recommend using no more than two typefaces.
      </p>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[140px]">Role</TableHead>
            <TableHead className="w-[200px]">Typeface</TableHead>
            <TableHead>Preview</TableHead>
            <TableHead className="w-[140px]">Properties</TableHead>
            <TableHead className="w-[140px]">Format</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell className="align-middle">
              <div className="font-medium">Primary</div>
              <div className="text-sm text-muted-foreground">Main brand typeface</div>
            </TableCell>
            <TableCell className="align-middle">
              <Select 
                value={currentTypography?.primary_font_id || ''} 
                onValueChange={(value) => handleFontChange(value, 'primary')}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select typeface" />
                </SelectTrigger>
                <SelectContent>
                  {fonts.map((font) => (
                    <SelectItem key={font.id} value={font.id}>
                      {font.family}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </TableCell>
            <TableCell className="align-middle">
              {currentTypography?.primary_font_id && <FontPreview font={getSelectedFont(currentTypography.primary_font_id)} />}
            </TableCell>
            <TableCell className="align-middle">
              {currentTypography?.primary_font_id && (
                <div className="space-y-1">
                  <div>Weight: {getSelectedFont(currentTypography.primary_font_id)?.is_variable ? '1-1000' : getSelectedFont(currentTypography.primary_font_id)?.weight}</div>
                  <div>Style: {getSelectedFont(currentTypography.primary_font_id)?.style}</div>
                </div>
              )}
            </TableCell>
            <TableCell className="align-middle">
              {currentTypography?.primary_font_id && (
                <div className="flex gap-2">
                  <Badge variant="outline">{getSelectedFont(currentTypography.primary_font_id)?.format.toUpperCase()}</Badge>
                  <VariableTag 
                    isVariable={getSelectedFont(currentTypography.primary_font_id)?.is_variable} 
                    variableMode={getSelectedFont(currentTypography.primary_font_id)?.variable_mode}
                  />
                </div>
              )}
            </TableCell>
          </TableRow>

          <TableRow>
            <TableCell className="align-middle">
              <div className="font-medium">Secondary</div>
              <div className="text-sm text-muted-foreground">Supporting typeface</div>
            </TableCell>
            <TableCell className="align-middle">
              <Select 
                value={currentTypography?.secondary_font_id || ''} 
                onValueChange={(value) => handleFontChange(value, 'secondary')}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select typeface" />
                </SelectTrigger>
                <SelectContent>
                  {fonts.map((font) => (
                    <SelectItem key={font.id} value={font.id}>
                      {font.family}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </TableCell>
            <TableCell className="align-middle">
              {currentTypography?.secondary_font_id && <FontPreview font={getSelectedFont(currentTypography.secondary_font_id)} />}
            </TableCell>
            <TableCell className="align-middle">
              {currentTypography?.secondary_font_id && (
                <div className="space-y-1">
                  <div>Weight: {getSelectedFont(currentTypography.secondary_font_id)?.is_variable ? '1-1000' : getSelectedFont(currentTypography.secondary_font_id)?.weight}</div>
                  <div>Style: {getSelectedFont(currentTypography.secondary_font_id)?.style}</div>
                </div>
              )}
            </TableCell>
            <TableCell className="align-middle">
              {currentTypography?.secondary_font_id && (
                <div className="flex gap-2">
                  <Badge variant="outline">{getSelectedFont(currentTypography.secondary_font_id)?.format.toUpperCase()}</Badge>
                  <VariableTag 
                    isVariable={getSelectedFont(currentTypography.secondary_font_id)?.is_variable} 
                    variableMode={getSelectedFont(currentTypography.secondary_font_id)?.variable_mode}
                  />
                </div>
              )}
            </TableCell>
          </TableRow>

          <TableRow>
            <TableCell className="align-middle">
              <div className="font-medium">Tertiary</div>
              <div className="text-sm text-muted-foreground">Additional typeface</div>
            </TableCell>
            <TableCell className="align-middle">
              <Select 
                value={currentTypography?.tertiary_font_id || ''} 
                onValueChange={(value) => handleFontChange(value, 'tertiary')}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select typeface" />
                </SelectTrigger>
                <SelectContent>
                  {fonts.map((font) => (
                    <SelectItem key={font.id} value={font.id}>
                      {font.family}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </TableCell>
            <TableCell className="align-middle">
              {currentTypography?.tertiary_font_id && <FontPreview font={getSelectedFont(currentTypography.tertiary_font_id)} />}
            </TableCell>
            <TableCell className="align-middle">
              {currentTypography?.tertiary_font_id && (
                <div className="space-y-1">
                  <div>Weight: {getSelectedFont(currentTypography.tertiary_font_id)?.is_variable ? '1-1000' : getSelectedFont(currentTypography.tertiary_font_id)?.weight}</div>
                  <div>Style: {getSelectedFont(currentTypography.tertiary_font_id)?.style}</div>
                </div>
              )}
            </TableCell>
            <TableCell className="align-middle">
              {currentTypography?.tertiary_font_id && (
                <div className="flex gap-2">
                  <Badge variant="outline">{getSelectedFont(currentTypography.tertiary_font_id)?.format.toUpperCase()}</Badge>
                  <VariableTag 
                    isVariable={getSelectedFont(currentTypography.tertiary_font_id)?.is_variable} 
                    variableMode={getSelectedFont(currentTypography.tertiary_font_id)?.variable_mode}
                  />
                </div>
              )}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>

      {currentTypography?.tertiary_font_id && (
        <Alert variant="warning" className="mt-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Using a tertiary typeface is not recommended. Consider using only primary and secondary typefaces for better brand consistency.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}

function FontPreview({ font }: { font: any }) {
  if (!font) return null;

  return (
    <div 
      style={{ 
        fontFamily: `"${font.family}", ${font.category}`,
        fontSize: '24px',
        fontWeight: font.is_variable ? undefined : font.weight,
        fontVariationSettings: font.is_variable ? `'wght' ${font.weight}` : undefined,
        lineHeight: '130%'
      }}
      className="break-words"
    >
      The quick brown fox jumps over the lazy dog
    </div>
  )
} 