import { useEffect } from 'react'
import { useFontStore } from '@/store/font-store'
import { useBrandStore } from '@/store/brand-store'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'

export function BrandTypographySettings() {
  const { toast } = useToast()
  const { currentBrand } = useBrandStore()
  const { 
    fonts, 
    brandTypography, 
    saveBrandTypography, 
    loadBrandTypography,
    loadFonts 
  } = useFontStore()

  // Load fonts and brand typography when component mounts
  useEffect(() => {
    loadFonts()
  }, [loadFonts])

  useEffect(() => {
    if (currentBrand?.id) {
      loadBrandTypography(currentBrand.id)
    }
  }, [currentBrand?.id, loadBrandTypography])

  const handleFontRoleChange = async (fontId: string, role: 'primary' | 'secondary' | 'tertiary') => {
    if (!currentBrand?.id) return

    try {
      const updatedTypography = {
        brand_id: currentBrand.id,
        [`${role}_font_id`]: fontId,
      }

      await saveBrandTypography(currentBrand.id, updatedTypography)
      toast({
        title: 'Success',
        description: `${role.charAt(0).toUpperCase() + role.slice(1)} font updated successfully`
      })
    } catch (error) {
      console.error('Error updating font role:', error)
      toast({
        title: 'Error',
        description: 'Failed to update font role',
        variant: 'destructive'
      })
    }
  }

  if (!currentBrand) return null

  const currentTypography = brandTypography[currentBrand.id]
  const currentFontRole = currentTypography?.primary_font_id ? 'primary' : currentTypography?.secondary_font_id ? 'secondary' : currentTypography?.tertiary_font_id ? 'tertiary' : null

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Brand Typography</h3>
        <p className="text-sm text-muted-foreground">
          Select the fonts for your brand
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Font Role</label>
          <Select
            value={currentFontRole}
            onValueChange={handleFontRoleChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select font role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="primary">Primary Font</SelectItem>
              <SelectItem value="secondary">Secondary Font</SelectItem>
              <SelectItem value="tertiary">Tertiary Font</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Primary Font</label>
          <Select
            value={currentTypography?.primary_font_id || ''}
            onValueChange={(value) => handleFontRoleChange(value || '', 'primary')}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a font" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">None</SelectItem>
              {fonts.map((font) => (
                <SelectItem key={font.id} value={font.id}>
                  {font.family}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Secondary Font</label>
          <Select
            value={currentTypography?.secondary_font_id || ''}
            onValueChange={(value) => handleFontRoleChange(value || '', 'secondary')}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a font" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">None</SelectItem>
              {fonts.map((font) => (
                <SelectItem key={font.id} value={font.id}>
                  {font.family}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Tertiary Font</label>
          <Select
            value={currentTypography?.tertiary_font_id || ''}
            onValueChange={(value) => handleFontRoleChange(value || '', 'tertiary')}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a font" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">None</SelectItem>
              {fonts.map((font) => (
                <SelectItem key={font.id} value={font.id}>
                  {font.family}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
} 