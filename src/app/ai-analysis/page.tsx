'use client'

import { useEffect, useState } from 'react'
import { usePlatformStore } from '@/store/platform-store'
import { useAIAnalysisStore, AnalysisType } from '@/store/ai-analysis-store'
import { PromptInput } from '@/components/ai/prompt-input'
import { AnalysisResults } from '@/components/ai/analysis-results'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export default function AIAnalysisPage() {
  const { platforms, fetchPlatformsByBrand, currentPlatform, setCurrentPlatform } = usePlatformStore()
  const [activeTab, setActiveTab] = useState<AnalysisType>('platform')
  const [initialized, setInitialized] = useState(false)
  
  // Replace with your actual brand ID
  const defaultBrandId = 'your-default-brand-id'

  // Initialize data loading
  useEffect(() => {
    if (!initialized) {
      // Fetch platforms for the brand
      fetchPlatformsByBrand(defaultBrandId)
      setInitialized(true)
    }
  }, [fetchPlatformsByBrand, defaultBrandId, initialized])

  // Handle platform change
  const handlePlatformChange = (platformId: string) => {
    setCurrentPlatform(platformId)
  }

  return (
    <div className="container max-w-7xl py-10 space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">AI Analysis</h1>
        <p className="text-muted-foreground">
          Generate and view AI analysis for your design system elements
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left sidebar */}
        <div className="md:col-span-3 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Platform</CardTitle>
              <CardDescription>
                Select the platform to analyze
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Select
                value={currentPlatform?.id || ''}
                onValueChange={handlePlatformChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select platform" />
                </SelectTrigger>
                <SelectContent>
                  {platforms.map((platform) => (
                    <SelectItem key={platform.id} value={platform.id}>
                      {platform.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
          
          <PromptInput 
            defaultType={activeTab}
            className="sticky top-6"
            onResultGenerated={() => {
              // Refresh the current view when a new result is generated
              // The store will handle updating the current results
            }}
          />
        </div>
        
        {/* Main content */}
        <div className="md:col-span-9 space-y-6">
          <Tabs 
            defaultValue="platform" 
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as AnalysisType)}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="platform">Platform</TabsTrigger>
              <TabsTrigger value="image">Image</TabsTrigger>
              <TabsTrigger value="typography">Typography</TabsTrigger>
              <TabsTrigger value="color">Color</TabsTrigger>
              <TabsTrigger value="general">General</TabsTrigger>
            </TabsList>
            
            {/* Platform Analysis Content */}
            <TabsContent value="platform">
              <AnalysisResults 
                type="platform"
                showHistory={true}
              />
            </TabsContent>
            
            {/* Image Analysis Content */}
            <TabsContent value="image">
              <AnalysisResults 
                type="image"
                showHistory={true}
              />
            </TabsContent>
            
            {/* Typography Analysis Content */}
            <TabsContent value="typography">
              <AnalysisResults 
                type="typography"
                showHistory={true}
              />
            </TabsContent>
            
            {/* Color Analysis Content */}
            <TabsContent value="color">
              <AnalysisResults 
                type="color"
                showHistory={true}
              />
            </TabsContent>
            
            {/* General Analysis Content */}
            <TabsContent value="general">
              <AnalysisResults 
                type="general"
                showHistory={true}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
