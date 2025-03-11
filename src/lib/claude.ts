import { CLAUDE_API_KEY } from '@/config/env'
import { convertUnits } from '@/lib/utils'
import { Platform } from '@/store/platform-store'

interface AIRecommendation {
  baseSize: number
  ratio: number
  stepsUp: number
  stepsDown: number
}

// Add rate limiting
let lastRequestTime = 0
const MIN_REQUEST_INTERVAL = 2000 // 2 seconds between requests

interface ScaleAnalysisInput {
  deviceType?: string
  context?: string
  location?: string
  image?: string
}

const API_TIMEOUT = 120000 // Increase to 120 seconds

// AI-based scale generation
export async function generateTypeScale(input: ScaleAnalysisInput | string) {
  try {
    console.log('Starting generateTypeScale...')
    let analysisText: string

    if (typeof input === 'string') {
      analysisText = input
    } else if (typeof input === 'object' && input !== null) {
      const parts = []
      if (input.deviceType) parts.push(`Device type: ${input.deviceType}`)
      if (input.context) parts.push(`Context: ${input.context}`)
      if (input.location) parts.push(`Location: ${input.location}`)
      if (input.image) parts.push(`Image provided`)
      analysisText = parts.filter(Boolean).join('\n')
    } else {
      throw new Error('Invalid input format')
    }

    console.log('Making API request with analysis:', analysisText)
    
    const response = await fetch('/api/generate-scale', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        deviceType: typeof input === 'object' ? input.deviceType : undefined,
        context: typeof input === 'object' ? input.context : undefined,
        location: typeof input === 'object' ? input.location : undefined,
        image: typeof input === 'object' ? input.image : undefined,
        imageAnalysis: analysisText
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('API error response:', errorText)
      try {
        const errorData = JSON.parse(errorText)
        throw new Error(errorData.error || `API request failed with status ${response.status}`)
      } catch {
        throw new Error(`API request failed with status ${response.status}`)
      }
    }

    const data = await response.json()
    console.log('API response data:', data)
    
    if (!data.content?.[0]?.text) {
      throw new Error('Invalid response format from API')
    }

    return data.content[0].text

  } catch (error) {
    console.error('Error generating scale:', error)
    throw error
  }
}

export function parseAIRecommendation(content: string): AIRecommendation {
  // Keep existing parsing logic
  const defaults = {
    baseSize: 16,
    ratio: 1.25,
    stepsUp: 3,
    stepsDown: 2
  }

  try {
    const baseSize = content.match(/base size[:\s]+(\d+)/i)?.[1]
    const ratio = content.match(/ratio[:\s]+([\d.]+)/i)?.[1]
    const stepsUp = content.match(/steps up[:\s]+(\d+)/i)?.[1]
    const stepsDown = content.match(/steps down[:\s]+(\d+)/i)?.[1]

    return {
      baseSize: baseSize ? parseInt(baseSize) : defaults.baseSize,
      ratio: ratio ? parseFloat(ratio) : defaults.ratio,
      stepsUp: stepsUp ? parseInt(stepsUp) : defaults.stepsUp,
      stepsDown: stepsDown ? parseInt(stepsDown) : defaults.stepsDown
    }
  } catch (error) {
    console.error('Error parsing AI recommendation:', error)
    return defaults
  }
}

// Mathematical scale calculation
export const calculateTypeScale = (
  baseSize: number,
  ratio: number,
  stepsUp: number,
  stepsDown: number,
  unit: string,
  platform: Platform
): Array<{ label: string; size: number }> => {
  const scale: Array<{ label: string; size: number }> = [];
  
  // Generate steps down
  for (let i = stepsDown; i > 0; i--) {
    const size = baseSize / Math.pow(ratio, i);
    const convertedSize = convertUnits(
      size,
      'px',
      unit,
      16 // Default base size
    );
    scale.push({ label: `f-${i}`, size: convertedSize });
  }
  
  // Add base size
  const convertedBaseSize = convertUnits(
    baseSize,
    'px', 
    unit,
    16 // Default base size
  );
  scale.push({ label: 'f0', size: convertedBaseSize });
  
  // Generate steps up
  for (let i = 1; i <= stepsUp; i++) {
    const size = baseSize * Math.pow(ratio, i);
    const convertedSize = convertUnits(
      size,
      'px',
      unit,
      16 // Default base size
    );
    scale.push({ label: `f${i}`, size: convertedSize });
  }
  
  return scale;
}; 