export type Platform = 'web' | 'ios' | 'android'

export type TypeStyle = {
  platform: Platform
  name: string
  size: number
  lineHeight: number
  letterSpacing: number
  fontWeight: number
  fontFamily: string
  usage: string
}

export type ScaleValue = {
  step: number
  px: number
  rem: number
  factor: number
  platforms: {
    [key in Platform]: TypeStyle[]
  }
} 