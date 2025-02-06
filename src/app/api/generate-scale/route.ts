import { NextResponse } from 'next/server'
import { generateTypeScale } from '@/lib/gemini'

export const runtime = 'edge' // Use edge runtime for better performance

// Increase timeout for Edge runtime
export const maxDuration = 60 // 60 seconds

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { deviceType, context, location, image, imageAnalysis } = body

    const result = await generateTypeScale({
      deviceType,
      context,
      location,
      image
    })

    return NextResponse.json({ content: [{ text: result }] })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Failed to generate scale' },
      { status: 500 }
    )
  }
} 