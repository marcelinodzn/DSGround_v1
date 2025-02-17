'use client'

import { useEffect, useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'

interface FontPreviewProps {
  file: File
  name: string
  weight: number
  style: string
  isVariable: boolean
  variableMode?: 'variable' | 'fixed'
  size?: number
}

export function FontPreview({ file, name, weight, style, isVariable, variableMode = 'variable', size = 16 }: FontPreviewProps) {
  const previewRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!file || !previewRef.current) return

    // Create a FontFace object with variable font settings if applicable
    const fontUrl = URL.createObjectURL(file)
    const fontFace = new FontFace(name, `url(${fontUrl})`, {
      weight: isVariable && variableMode === 'variable' ? '1 1000' : weight.toString(),
      style,
      display: 'swap',
      variationSettings: isVariable && variableMode === 'variable' ? "'wght' 1" : undefined
    })

    // Load the font
    fontFace.load().then((loadedFace) => {
      // Add the font to the document
      document.fonts.add(loadedFace)
      
      // Apply the font to the preview element
      if (previewRef.current) {
        previewRef.current.style.fontFamily = name
        if (isVariable && variableMode === 'variable') {
          // Set font-variation-settings for variable fonts in variable mode
          previewRef.current.style.fontVariationSettings = `'wght' ${weight}`
        }
      }
    }).catch((error) => {
      console.error('Error loading font:', error)
    })

    // Cleanup
    return () => {
      URL.revokeObjectURL(fontUrl)
    }
  }, [file, name, weight, style, isVariable, variableMode])

  return (
    <Card className="p-4 space-y-4">
      <div className="space-y-2">
        <Label>Preview</Label>
        <div 
          ref={previewRef}
          className="min-h-[120px] p-4 rounded-lg bg-muted"
          style={{ 
            fontWeight: weight,
            fontStyle: style,
            fontSize: `${size}px`,
            fontVariationSettings: isVariable && variableMode === 'variable' ? `'wght' ${weight}` : undefined
          }}
        >
          <div className="text-4xl mb-4" style={{ 
            fontSize: `${size * 2}px`,
            fontVariationSettings: isVariable && variableMode === 'variable' ? `'wght' ${weight}` : undefined
          }}>
            The quick brown fox jumps over the lazy dog
          </div>
          <div className="text-base" style={{ 
            fontSize: `${size}px`,
            fontVariationSettings: isVariable && variableMode === 'variable' ? `'wght' ${weight}` : undefined
          }}>
            ABCDEFGHIJKLMNOPQRSTUVWXYZ<br />
            abcdefghijklmnopqrstuvwxyz<br />
            1234567890!@#$%^&*()
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <Label className="text-muted-foreground">Weight</Label>
          <div>
            {weight} 
            {isVariable && (
              variableMode === 'variable' ? ' (Variable)' : ' (Fixed)'
            )}
          </div>
        </div>
        <div>
          <Label className="text-muted-foreground">Style</Label>
          <div className="capitalize">{style}</div>
        </div>
        {size && (
          <div>
            <Label className="text-muted-foreground">Size</Label>
            <div>{size}px</div>
          </div>
        )}
        {isVariable && (
          <div className={size ? "col-span-1" : "col-span-2"}>
            <Label className="text-muted-foreground">Variable Font</Label>
            <div>
              {variableMode === 'variable' 
                ? 'Supports variable weight (1-1000)' 
                : 'Fixed weight mode'}
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
