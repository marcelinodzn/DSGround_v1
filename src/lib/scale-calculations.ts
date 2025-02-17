import { Platform, ScaleValue, TypeStyle } from '@/types/typography'

export function calculateDistanceBasedSize(
  distance: number,
  visualAcuity: number,
  meanLengthRatio: number,
  textType: 'continuous' | 'isolated',
  lighting: 'good' | 'moderate' | 'poor',
  ppi: number
): number {
  // Constants from leserlich.info calculation
  const MIN_VISUAL_ANGLE = 0.21 // Minimum visual angle in degrees
  const LIGHTING_FACTORS = {
    good: 1,
    moderate: 1.25,
    poor: 1.5
  }
  const TEXT_TYPE_FACTORS = {
    continuous: 1,
    isolated: 1.5
  }

  // Convert distance from cm to mm
  const distanceInMm = distance * 10

  // Calculate base size using visual angle formula
  const visualAngleRad = (MIN_VISUAL_ANGLE * Math.PI) / 180
  let baseSize = 2 * distanceInMm * Math.tan(visualAngleRad / 2)

  // Apply visual acuity adjustment
  baseSize = baseSize / visualAcuity

  // Apply mean length ratio
  baseSize = baseSize * meanLengthRatio

  // Apply lighting and text type factors
  baseSize = baseSize * LIGHTING_FACTORS[lighting] * TEXT_TYPE_FACTORS[textType]

  // Convert mm to pixels using PPI
  const pixelSize = (baseSize * ppi) / 25.4 // 25.4 mm per inch

  return Math.round(pixelSize)
}

export function calculateScale(
  baseSize: number,
  ratio: number,
  steps: number,
  method: 'modular' | 'linear' | 'custom'
): ScaleValue[] {
  const scale: ScaleValue[] = []
  const totalSteps = steps * 2 + 1 // Include negative steps, base, and positive steps

  for (let i = -steps; i <= steps; i++) {
    let size: number
    let factor: number

    switch (method) {
      case 'modular':
        factor = Math.pow(ratio, i)
        size = baseSize * factor
        break
      case 'linear':
        factor = 1 + (ratio * i)
        size = baseSize * factor
        break
      case 'custom':
        // For custom scales, you might want to store/retrieve custom values
        factor = Math.pow(ratio, i) // Fallback to modular for now
        size = baseSize * factor
        break
    }

    scale.push({
      step: i,
      px: Math.round(size * 100) / 100, // Round to 2 decimal places
      rem: Math.round((size / 16) * 1000) / 1000, // Convert to rem and round to 3 decimal places
      factor: Math.round(factor * 1000) / 1000,
      platforms: {
        web: [],
        ios: [],
        android: []
      }
    })
  }

  return scale
} 