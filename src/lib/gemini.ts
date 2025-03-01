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

export async function generateTypeScale({
  deviceType = '',
  context = '',
  location = '',
  image = '',
  device = '',
  customRequirements = ''
}: ScaleAnalysisInput): Promise<string> {
  console.log('Starting Gemini type scale generation...')
  
  try {
    // Configure the model
    const model = genAI.getGenerativeModel({ model: 'gemini-pro-vision' })

    // Create the prompt
    let prompt = `You are a typography expert. Analyze this UI design and determine the recommended base font size, ratio, and number of steps for a modular scale.
    
    Device Type: ${deviceType || 'Not specified'}
    Context: ${context || 'Not specified'}
    Location: ${location || 'Not specified'}
    ${device ? `Device: ${device}` : ''}
    ${customRequirements ? `Custom Requirements: ${customRequirements}` : ''}
    
    Please provide your recommendation in the following format:
    
    Recommended base size: XXpx
    Ratio: X.XX
    Steps up: X
    Steps down: X
    
    Then, provide a brief explanation of your recommendation.`

    let result
    if (image) {
      // Convert base64 string to a GoogleGenerativeAI.Part
      const imageData = image.split(',')[1] // Remove the data:image/jpeg;base64, part
      const imagePart = {
        inlineData: {
          data: imageData,
          mimeType: 'image/jpeg',
        },
      }

      // Generate content with image
      const result = await model.generateContent([prompt, imagePart])
      const response = await result.response
      const text = response.text()
      
      console.log('Gemini response received')
      return text // Return the text response, not an object
    } else {
      // Text-only request to gemini-pro
      const textModel = genAI.getGenerativeModel({ model: 'gemini-pro' })
      const result = await textModel.generateContent(prompt)
      const response = await result.response
      return response.text() // Return the text response, not an object
    }
  } catch (error) {
    console.error('Error in Gemini AI generation:', error)
    throw error
  }
}

export function parseAIRecommendation(response: string | any): AIRecommendation {
  try {
    // Check if response is not a string (could be undefined or an object)
    if (typeof response !== 'string') {
      console.error('Invalid response type:', typeof response);
      return {
        baseSize: 16,
        ratio: 1.2,
        stepsUp: 3,
        stepsDown: 2
      };
    }
    
    console.log("Parsing AI recommendation text:", response);
    
    // Look for "Recommended base size: XXpx" format with more flexible regex
    // Now handles various formats like:
    // - "base size: 16px"
    // - "Base size is 16px"
    // - "I recommend a base size of 16px"
    const baseMatch = response.match(/(?:recommended|base)\s+size(?:\s+is|\s+of)?:\s*(\d+(?:\.\d+)?)\s*px/i) || 
                     response.match(/base\s+size\s+of\s*(\d+(?:\.\d+)?)\s*px/i);
    const baseSize = baseMatch ? parseFloat(baseMatch[1]) : 16;
    
    // Look for ratio pattern with more flexibility
    const ratioMatch = response.match(/(?:recommended\s+)?ratio(?:\s+is|\s+of)?:\s*(\d+(?:\.\d+)?)/i) || 
                       response.match(/(?:scale\s+)?ratio\s+of\s*(\d+(?:\.\d+)?)/i) ||
                       response.match(/(?:use\s+a\s+)?ratio\s+of\s*(\d+(?:\.\d+)?)/i);
    const ratio = ratioMatch ? parseFloat(ratioMatch[1]) : 1.2;
    
    // Look for steps patterns with more flexibility
    const stepsUpMatch = response.match(/steps\s+up(?:\s+is|\s+of)?:\s*(\d+)/i) || 
                         response.match(/(\d+)\s+steps?\s+up/i);
    const stepsUp = stepsUpMatch ? parseInt(stepsUpMatch[1]) : 3;
    
    const stepsDownMatch = response.match(/steps\s+down(?:\s+is|\s+of)?:\s*(\d+)/i) || 
                           response.match(/(\d+)\s+steps?\s+down/i);
    const stepsDown = stepsDownMatch ? parseInt(stepsDownMatch[1]) : 2;
    
    console.log("Parsed values:", { baseSize, ratio, stepsUp, stepsDown });
    
    return {
      baseSize,
      ratio,
      stepsUp,
      stepsDown
    };
  } catch (error) {
    console.error('Error parsing AI recommendation:', error);
    return {
      baseSize: 16,
      ratio: 1.2,
      stepsUp: 3,
      stepsDown: 2
    };
  }
} 