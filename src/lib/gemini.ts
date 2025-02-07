import { GoogleGenerativeAI } from "@google/generative-ai";

interface ScaleAnalysisInput {
  deviceType?: string
  context?: string
  location?: string
  image?: string
  device?: string
  customRequirements?: string
}

interface AIRecommendation {
  baseSize: number
  ratio: number
  stepsUp: number
  stepsDown: number
}

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '');

// Use Gemini 2.0 Flash model
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-001" });

export async function generateTypeScale(input: ScaleAnalysisInput) {
  try {
    console.log('Starting Gemini type scale generation...')
    let analysisText = [
      input.device && `Device type: ${input.device}`,
      input.context && `Context: ${input.context}`,
      input.location && `Location: ${input.location}`,
      input.customRequirements && `Requirements: ${input.customRequirements}`
    ].filter(Boolean).join('\n')

    const prompt = `As a typography expert, analyze the following context:

${analysisText}

Please provide a typography recommendation in the following format:

RECOMMENDATIONS
Base Size: [number]px
Scale Factor: [number]
Steps Up: [number]
Steps Down: [number]

REASONING
[Brief explanation of why these values are recommended for this context, considering the device and requirements]`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse the structured response
    const recommendations = text.match(/RECOMMENDATIONS\n([\s\S]*?)\n\nREASONING/)?.[1];
    const reasoning = text.match(/REASONING\n([\s\S]*?)$/)?.[1];

    return {
      recommendation: recommendations?.trim() || '',
      reasoning: reasoning?.trim() || '',
      rawResponse: text // Keep the full response for debugging
    };

  } catch (error) {
    console.error('Error generating scale with Gemini:', error)
    throw error
  }
}

export function parseAIRecommendation(response: string): number {
  try {
    // Look for "Recommended base size: XXpx" format
    const match = response.match(/Recommended base size:\s*(\d+(?:\.\d+)?)\s*px/i);
    if (match) {
      return parseFloat(match[1]);
    }

    // Fallback: look for any number followed by px
    const pxMatch = response.match(/(\d+(?:\.\d+)?)\s*px/);
    if (pxMatch) {
      return parseFloat(pxMatch[1]);
    }

    // Last resort: look for any number
    const numberMatch = response.match(/(\d+(?:\.\d+)?)/);
    if (numberMatch) {
      return parseFloat(numberMatch[1]);
    }

    return 16; // Default if no number found
  } catch (error) {
    console.error('Error parsing AI recommendation:', error);
    return 16;
  }
} 