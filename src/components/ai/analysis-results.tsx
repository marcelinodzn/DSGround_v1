'use client'

import { useEffect, useState } from 'react'
import { useAIAnalysisStore, AnalysisType, AIAnalysisResult } from '@/store/ai-analysis-store'
import { usePlatformStore } from '@/store/platform-store'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { format } from 'date-fns'
import { Loader2, History, RefreshCw } from 'lucide-react'

interface AnalysisResultsProps {
  type: AnalysisType
  platformId?: string
  brandId?: string
  showHistory?: boolean
  className?: string
}

export function AnalysisResults({
  type,
  platformId,
  brandId,
  showHistory = true,
  className = '',
}: AnalysisResultsProps) {
  const {
    currentResults,
    fetchResults,
    getLatestResultByType,
    setCurrentResult,
    isLoading,
  } = useAIAnalysisStore()

  const { currentPlatform } = usePlatformStore()
  const [historyResults, setHistoryResults] = useState<AIAnalysisResult[]>([])
  const [showHistoryPanel, setShowHistoryPanel] = useState(false)

  // If platformId is not provided, use the current platform
  const effectivePlatformId = platformId || currentPlatform?.id

  // Load the current result from the store
  const currentResult = currentResults[type]

  // On initial load, fetch the latest result if we don't have one
  useEffect(() => {
    if (!currentResult && effectivePlatformId) {
      getLatestResultByType(type, {
        platform_id: effectivePlatformId,
        brand_id: brandId,
      })
    }
  }, [currentResult, effectivePlatformId, brandId, type, getLatestResultByType])

  // Fetch history results when the history panel is opened
  useEffect(() => {
    if (showHistoryPanel && effectivePlatformId) {
      fetchResults({
        platform_id: effectivePlatformId,
        brand_id: brandId,
        analysis_type: type,
        limit: 10,
      }).then(setHistoryResults)
    }
  }, [showHistoryPanel, effectivePlatformId, brandId, type, fetchResults])

  // Format and render the result content based on its structure
  const renderResultContent = (result: any) => {
    if (!result) return null

    if (typeof result === 'string') {
      return <div className="whitespace-pre-wrap">{result}</div>
    }

    if (Array.isArray(result)) {
      return (
        <ul className="list-disc pl-5">
          {result.map((item, index) => (
            <li key={index}>{typeof item === 'object' ? JSON.stringify(item) : String(item)}</li>
          ))}
        </ul>
      )
    }

    if (typeof result === 'object') {
      // If the result is a complex object, render it as an accordion
      return (
        <Accordion type="single" collapsible className="w-full">
          {Object.entries(result).map(([key, value]) => (
            <AccordionItem key={key} value={key}>
              <AccordionTrigger className="text-sm font-medium">
                {key}
              </AccordionTrigger>
              <AccordionContent>
                {typeof value === 'object' ? (
                  <pre className="text-xs overflow-auto p-2 bg-muted rounded">
                    {JSON.stringify(value, null, 2)}
                  </pre>
                ) : (
                  <p>{String(value)}</p>
                )}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )
    }

    return <div>{String(result)}</div>
  }

  const handleSelectHistoryItem = (result: AIAnalysisResult) => {
    setCurrentResult(type, result)
    setShowHistoryPanel(false)
  }

  const handleRefresh = () => {
    if (effectivePlatformId) {
      getLatestResultByType(type, {
        platform_id: effectivePlatformId,
        brand_id: brandId,
      })
    }
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl capitalize">{type} Analysis</CardTitle>
          <div className="flex gap-2">
            {showHistory && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowHistoryPanel(!showHistoryPanel)}
              >
                <History className="h-4 w-4 mr-1" />
                History
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
        {currentResult && (
          <CardDescription>
            Generated on {format(new Date(currentResult.created_at), 'PPP p')}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent>
        {showHistoryPanel ? (
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Previous Analysis Results</h3>
            {historyResults.length === 0 ? (
              <p className="text-sm text-muted-foreground">No previous results found.</p>
            ) : (
              <div className="space-y-2">
                {historyResults.map((result) => (
                  <div
                    key={result.id}
                    className="p-3 border rounded-lg cursor-pointer hover:bg-muted"
                    onClick={() => handleSelectHistoryItem(result)}
                  >
                    <div className="flex justify-between items-center">
                      <p className="font-medium truncate flex-1">{result.prompt.substring(0, 50)}{result.prompt.length > 50 ? '...' : ''}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(result.created_at), 'PP')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => setShowHistoryPanel(false)}
            >
              Back to Current Result
            </Button>
          </div>
        ) : isLoading ? (
          <div className="flex justify-center items-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : currentResult ? (
          <div className="space-y-4">
            <div className="p-3 bg-muted rounded-lg">
              <p className="font-medium text-sm">Prompt:</p>
              <p className="text-sm">{currentResult.prompt}</p>
            </div>
            <div className="space-y-2">
              <p className="font-medium text-sm">Result:</p>
              {renderResultContent(currentResult.result)}
            </div>
          </div>
        ) : (
          <div className="text-center p-8 text-muted-foreground">
            <p>No analysis results available.</p>
            <p className="text-sm">Generate a new analysis to see results here.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
