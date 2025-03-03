'use client'

import { useState } from 'react'
import { useAIAnalysisStore, AnalysisType } from '@/store/ai-analysis-store'
import { usePlatformStore } from '@/store/platform-store'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, SendIcon } from 'lucide-react'

// Mock function for AI processing - replace with your actual API call
async function processAIPrompt(data: {
  prompt: string
  type: AnalysisType
  platformId?: string
  brandId?: string
}): Promise<any> {
  // In a real implementation, this would call your AI API
  // For now, we'll just return a mock response
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        result: `AI analysis for "${data.prompt}" of type ${data.type}. This is a mock response that would normally come from your AI service. In a real implementation, you would get detailed analysis based on the input prompt and type.`,
        metadata: {
          model: 'gpt-4',
          processingTime: '2.5s',
        }
      })
    }, 1500) // Simulate API delay
  })
}

interface PromptInputProps {
  defaultType?: AnalysisType
  platformId?: string
  brandId?: string
  className?: string
  onResultGenerated?: (result: any) => void
}

export function PromptInput({
  defaultType = 'general',
  platformId,
  brandId,
  className = '',
  onResultGenerated
}: PromptInputProps) {
  const [prompt, setPrompt] = useState('')
  const [analysisType, setAnalysisType] = useState<AnalysisType>(defaultType)
  const [isProcessing, setIsProcessing] = useState(false)
  
  const { saveResult } = useAIAnalysisStore()
  const { currentPlatform } = usePlatformStore()
  
  // If platformId is not provided, use the current platform
  const effectivePlatformId = platformId || currentPlatform?.id

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!prompt.trim()) return
    
    setIsProcessing(true)
    
    try {
      // Process the prompt using AI
      const aiResponse = await processAIPrompt({
        prompt,
        type: analysisType,
        platformId: effectivePlatformId,
        brandId,
      })
      
      // Save the result to Supabase
      const savedResult = await saveResult({
        platform_id: effectivePlatformId,
        brand_id: brandId,
        analysis_type: analysisType,
        prompt,
        result: aiResponse.result,
        metadata: aiResponse.metadata,
      })
      
      // Call the callback if provided
      if (onResultGenerated) {
        onResultGenerated(savedResult)
      }
      
      // Clear the prompt input
      setPrompt('')
    } catch (error) {
      console.error('Error processing AI prompt:', error)
    } finally {
      setIsProcessing(false)
    }
  }
  
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>AI Analysis</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Select
              value={analysisType}
              onValueChange={(value) => setAnalysisType(value as AnalysisType)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select analysis type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="image">Image Analysis</SelectItem>
                <SelectItem value="platform">Platform Analysis</SelectItem>
                <SelectItem value="typography">Typography Analysis</SelectItem>
                <SelectItem value="color">Color Analysis</SelectItem>
                <SelectItem value="general">General</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Textarea
            placeholder={`Enter your prompt for ${analysisType} analysis...`}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="min-h-[100px]"
          />
        </CardContent>
        
        <CardFooter>
          <Button 
            type="submit" 
            className="w-full"
            disabled={isProcessing || !prompt.trim()}
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <SendIcon className="mr-2 h-4 w-4" />
                Generate Analysis
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
