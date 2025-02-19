import { useBrandStore } from '../../store/brand-store'
import { useFontStore } from '../../store/font-store'
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useEffect } from 'react'
import { Label } from '@/components/ui/label'

export function TypographyProperties() {
  const { currentBrand } = useBrandStore()
  const { brandTypography, fonts, loadFonts, saveBrandTypography, loadBrandTypography } = useFontStore()
  const currentTypography = currentBrand?.id ? brandTypography[currentBrand.id] : null

  useEffect(() => {
    loadFonts()
    if (currentBrand?.id) {
      loadBrandTypography(currentBrand.id)
    }
  }, [loadFonts, currentBrand?.id, loadBrandTypography])

  const handleFontRoleChange = async (value: string, role: 'primary' | 'secondary' | 'tertiary') => {
    if (!currentBrand?.id) return
    
    try {
      await saveBrandTypography(currentBrand.id, {
        brand_id: currentBrand.id,
        [`${role}_font_id`]: value || null
      })
    } catch (error) {
      console.error('Error updating font role:', error)
    }
  }

  const getFontInfo = (role: 'primary' | 'secondary' | 'tertiary') => {
    const fontId = currentTypography?.[`${role}_font_id`]
    const font = fonts.find(f => f.id === fontId)
    return {
      font,
      scale: currentTypography?.[`${role}_font_scale`],
      styles: currentTypography?.[`${role}_font_styles`]
    }
  }

  const getRoleDescription = (role: 'primary' | 'secondary' | 'tertiary') => {
    switch (role) {
      case 'primary':
        return 'Used for headlines and important text'
      case 'secondary':
        return 'Used for body text and supporting content'
      case 'tertiary':
        return 'Used sparingly for special purposes'
    }
  }

  return (
    <div className="space-y-6">
      {/* Font Roles Section */}
      <div className="space-y-4">
        {(['primary', 'secondary', 'tertiary'] as const).map((role) => {
          const fontInfo = getFontInfo(role)
          return (
            <div key={role} className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium capitalize">{role} Font</Label>
                <Select 
                  value={currentTypography?.[`${role}_font_id`] || ''} 
                  onValueChange={(value) => handleFontRoleChange(value, role)}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select font" />
                  </SelectTrigger>
                  <SelectContent>
                    {fonts.map((font) => (
                      <SelectItem key={font.id} value={font.id}>
                        {font.family}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {fontInfo.font && (
                <div className="rounded-md border p-4 space-y-2">
                  <div className="text-sm text-muted-foreground">
                    {getRoleDescription(role)}
                  </div>
                  <div className="font-preview" style={{
                    fontFamily: `"${fontInfo.font.family}", ${fontInfo.font.category}`,
                    fontSize: '18px',
                    fontWeight: fontInfo.font.is_variable ? undefined : fontInfo.font.weight,
                    fontVariationSettings: fontInfo.font.is_variable ? `'wght' ${fontInfo.font.weight}` : undefined,
                  }}>
                    The quick brown fox jumps over the lazy dog
                  </div>
                  <div className="text-sm space-y-1">
                    <div>Weight: {fontInfo.font.is_variable ? 'Variable (1-1000)' : fontInfo.font.weight}</div>
                    <div>Style: {fontInfo.font.style || 'Normal'}</div>
                    <div>Format: {fontInfo.font.format.toUpperCase()}</div>
                  </div>
                </div>
              )}
              <Separator className="my-4" />
            </div>
          )
        })}
      </div>
    </div>
  )
} 