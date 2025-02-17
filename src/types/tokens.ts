export interface Platform {
  id: string
  name: string
  description?: string
}

export interface TokenBase {
  id: string
  name: string
  type: 'color' | 'typography' | 'spacing' | 'shadow' | 'motion'
  description?: string
  platform?: string
}

export interface TypographyToken extends TokenBase {
  type: 'typography'
  value: {
    fontFamily?: string
    fontSize: string
    lineHeight: string
    fontWeight: number
    letterSpacing: string
    scaleStep?: string
    platform: string
  }
  reference?: string // For style-dictionary references like "{typography.h1}"
  category?: 'heading' | 'body' | 'display' | 'code' | 'other'
}

export interface TypographyScale {
  baseSize: number
  ratio: number
  stepsUp: number
  stepsDown: number
  platform: string
}

export interface TypographyTokenCollection {
  scale: TypographyScale
  styles: TypographyToken[]
  platform: Platform
} 