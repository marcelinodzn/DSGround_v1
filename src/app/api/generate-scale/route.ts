import { NextResponse } from 'next/server'
import { CLAUDE_API_KEY } from '@/config/env'

export const runtime = 'edge' // Use edge runtime for better performance

// Increase timeout for Edge runtime
export const maxDuration = 60 // 60 seconds

export async function POST(request: Request) {
  try {
    console.log('API route started')
    const body = await request.json()
    console.log('Request body:', body) // Log full request body

    if (!CLAUDE_API_KEY) {
      console.error('Claude API key is missing')
      throw new Error('Claude API key is not configured')
    }

    console.log('Using Claude API key:', CLAUDE_API_KEY.substring(0, 10) + '...')

    // Build a more detailed prompt
    let prompt = 'As a typography expert, analyze the following context and provide a typography scale recommendation.\n\n'
    
    if (body.deviceType) {
      prompt += `Device Type: ${body.deviceType}\n`
    }
    if (body.context) {
      prompt += `Usage Context: ${body.context}\n`
    }
    if (body.location) {
      prompt += `Environment: ${body.location}\n`
    }
    if (body.image) {
      prompt += `Visual Reference: Image provided\n`
    }

    prompt += '\nProvide recommendations in this exact format:\n'
    prompt += 'base size: [number]px\n'
    prompt += 'ratio: [number]\n'
    prompt += 'steps up: [number]\n'
    prompt += 'steps down: [number]\n\n'
    prompt += 'Reasoning: [Explain your recommendations based on the provided context]'

    const claudeRequest = {
      model: 'claude-3-sonnet-20240229',
      max_tokens: 1024,
      temperature: 0.7,
      messages: [{
        role: 'user',
        content: prompt
      }]
    }

    console.log('Making Claude API request:', {
      url: 'https://api.anthropic.com/v1/messages',
      headers: {
        'anthropic-version': '2024-02-15-preview'
      },
      body: claudeRequest
    })

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'anthropic-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2024-02-15-preview'
      },
      body: JSON.stringify(claudeRequest)
    })

    console.log('Claude API response status:', response.status)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('Claude API error response:', errorText)
      try {
        const errorData = JSON.parse(errorText)
        throw new Error(`Claude API error: ${errorData.error?.message || response.statusText}`)
      } catch {
        throw new Error(`Claude API error: ${response.statusText} (${response.status})`)
      }
    }

    const data = await response.json()
    console.log('Claude API response data:', data)

    if (!data.content?.[0]?.text) {
      throw new Error('Invalid response from Claude API')
    }

    return NextResponse.json({
      content: [{
        text: data.content[0].text
      }]
    })

  } catch (error) {
    console.error('API route error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error occurred' },
      { status: 500 }
    )
  }
} 