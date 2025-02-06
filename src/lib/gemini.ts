import { GoogleGenerativeAI } from "@google/generative-ai";

interface ScaleAnalysisInput {
  deviceType?: string
  context?: string
  location?: string
  image?: string
}

interface AIRecommendation {
  baseSize: number
  ratio: number
  stepsUp: number
  stepsDown: number
}

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '');

// Get the model
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

export async function generateTypeScale(input: ScaleAnalysisInput | string) {
  try {
    console.log('Starting Gemini type scale generation...')
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

    // Prepare the prompt
    const prompt = `As a typography expert, analyze the following for ${input.deviceType || 'this platform'}:

${analysisText}

Provide a concise type scale recommendation in this format:

Scale Parameters:
Base size: [number]
Ratio: [number]
Steps up: [number]
Steps down: [number]

Reasoning:
[Provide a brief, focused explanation considering the platform type and context]`

    // If there's an image, handle it
    if (typeof input === 'object' && input.image) {
      // Convert base64 to Uint8Array for Gemini
      const imageData = atob(input.image.split(',')[1])
      const arrayBuffer = new ArrayBuffer(imageData.length)
      const uint8Array = new Uint8Array(arrayBuffer)
      for (let i = 0; i < imageData.length; i++) {
        uint8Array[i] = imageData.charCodeAt(i)
      }

      // Create image part for Gemini
      const imagePart = {
        inlineData: {
          data: input.image.split(',')[1],
          mimeType: 'image/jpeg'
        }
      }

      // Generate content with image
      const result = await model.generateContent([prompt, imagePart])
      const response = await result.response
      return response.text()
    } else {
      // Text-only generation
      const result = await model.generateContent(prompt)
      const response = await result.response
      return response.text()
    }

  } catch (error) {
    console.error('Error generating scale with Gemini:', error)
    throw error
  }
}

export function parseAIRecommendation(content: string): AIRecommendation {
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