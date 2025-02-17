'use client'

import React from 'react'
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

interface BrandTypographyProps {
  fonts: any[]
}

export function BrandTypography({ fonts }: BrandTypographyProps) {
  const [primaryFont, setPrimaryFont] = React.useState<string>("")
  const [secondaryFont, setSecondaryFont] = React.useState<string>("")
  const [tertiaryFont, setTertiaryFont] = React.useState<string>("")

  const handleFontChange = (value: string, type: 'primary' | 'secondary' | 'tertiary') => {
    switch (type) {
      case 'primary':
        setPrimaryFont(value)
        break
      case 'secondary':
        setSecondaryFont(value)
        break
      case 'tertiary':
        setTertiaryFont(value)
        break
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
              <Select value={primaryFont} onValueChange={(value) => handleFontChange(value, 'primary')}>
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
              {primaryFont && <FontPreview font={getSelectedFont(primaryFont)} />}
            </TableCell>
            <TableCell className="align-middle">
              {primaryFont && (
                <div className="space-y-1">
                  <div>Weight: {getSelectedFont(primaryFont)?.is_variable ? '1-1000' : getSelectedFont(primaryFont)?.weight}</div>
                  <div>Style: {getSelectedFont(primaryFont)?.style}</div>
                </div>
              )}
            </TableCell>
            <TableCell className="align-middle">
              {primaryFont && (
                <div className="flex gap-2">
                  <Badge variant="outline">{getSelectedFont(primaryFont)?.format.toUpperCase()}</Badge>
                  <VariableTag 
                    isVariable={getSelectedFont(primaryFont)?.is_variable} 
                    variableMode={getSelectedFont(primaryFont)?.variable_mode}
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
              <Select value={secondaryFont} onValueChange={(value) => handleFontChange(value, 'secondary')}>
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
              {secondaryFont && <FontPreview font={getSelectedFont(secondaryFont)} />}
            </TableCell>
            <TableCell className="align-middle">
              {secondaryFont && (
                <div className="space-y-1">
                  <div>Weight: {getSelectedFont(secondaryFont)?.is_variable ? '1-1000' : getSelectedFont(secondaryFont)?.weight}</div>
                  <div>Style: {getSelectedFont(secondaryFont)?.style}</div>
                </div>
              )}
            </TableCell>
            <TableCell className="align-middle">
              {secondaryFont && (
                <div className="flex gap-2">
                  <Badge variant="outline">{getSelectedFont(secondaryFont)?.format.toUpperCase()}</Badge>
                  <VariableTag 
                    isVariable={getSelectedFont(secondaryFont)?.is_variable} 
                    variableMode={getSelectedFont(secondaryFont)?.variable_mode}
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
              <Select value={tertiaryFont} onValueChange={(value) => handleFontChange(value, 'tertiary')}>
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
              {tertiaryFont && <FontPreview font={getSelectedFont(tertiaryFont)} />}
            </TableCell>
            <TableCell className="align-middle">
              {tertiaryFont && (
                <div className="space-y-1">
                  <div>Weight: {getSelectedFont(tertiaryFont)?.is_variable ? '1-1000' : getSelectedFont(tertiaryFont)?.weight}</div>
                  <div>Style: {getSelectedFont(tertiaryFont)?.style}</div>
                </div>
              )}
            </TableCell>
            <TableCell className="align-middle">
              {tertiaryFont && (
                <div className="flex gap-2">
                  <Badge variant="outline">{getSelectedFont(tertiaryFont)?.format.toUpperCase()}</Badge>
                  <VariableTag 
                    isVariable={getSelectedFont(tertiaryFont)?.is_variable} 
                    variableMode={getSelectedFont(tertiaryFont)?.variable_mode}
                  />
                </div>
              )}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>

      {tertiaryFont && (
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