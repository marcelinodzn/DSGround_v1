import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: { 'x-my-custom-header': 'my-app-name' }
  }
})

// Type definitions
export interface Brand {
  id: string
  name: string
  description?: string
  created_at: string
}

export interface Platform {
  id: string
  brand_id: string
  name: string
  description?: string
  units: {
    typography: string
    spacing: string
    dimensions: string
  }
  layout: {
    baseSize: number
    gridColumns: number
    gridGutter: number
    containerPadding: number
  }
}

export interface TypographySettings {
  id: string
  platform_id: string
  scale_method: 'modular' | 'distance' | 'ai'
  scale_config: {
    baseSize: number
    ratio: number
    stepsUp: number
    stepsDown: number
  }
  distance_scale?: {
    viewingDistance: number
    visualAcuity: number
    meanLengthRatio: number
    textType: 'continuous' | 'isolated'
    lighting: 'good' | 'moderate' | 'poor'
    ppi: number
  }
  ai_settings?: {
    deviceType?: string
    context?: string
    location?: string
    recommendation?: {
      baseSize: number
      ratio: number
      stepsUp: number
      stepsDown: number
    }
  }
}

export interface TypeStyle {
  id: string
  platform_id: string
  name: string
  scale_step: string
  font_weight: number
  line_height: number
  letter_spacing: number
  optical_size?: number
} 