interface AIRecommendation {
  baseSize: number
  ratio: number
  stepsUp: number
  stepsDown: number
}

export async function generateTypeScale(params: {
  deviceType: string
  context: string
  location?: string
  image?: string
}) {
  const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.NEXT_PUBLIC_DEEPSEEK_API_KEY}`
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [
        {
          role: "system",
          content: "You are a typography expert that helps generate optimal type scales based on context and environmental factors."
        },
        {
          role: "user",
          content: `Generate a typography scale recommendation for:
            Device: ${params.deviceType}
            Context: ${params.context}
            ${params.location ? `Location: ${params.location}` : ''}
            ${params.image ? `Based on uploaded environment image` : ''}
            
            Provide:
            1. Recommended base size
            2. Scale ratio
            3. Recommended steps up/down
            4. Reasoning for recommendations`
        }
      ],
      temperature: 0.7
    })
  })

  if (!response.ok) {
    throw new Error(`DeepSeek API error: ${response.statusText}`)
  }

  const data = await response.json()
  return data.choices[0].message.content
}

export function parseAIRecommendation(content: string): AIRecommendation {
  // Default values in case parsing fails
  const defaults = {
    baseSize: 16,
    ratio: 1.25,
    stepsUp: 3,
    stepsDown: 2
  }

  try {
    // Extract numbers from the AI response using regex
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