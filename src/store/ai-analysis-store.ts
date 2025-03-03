'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '@/lib/supabase'
import { v4 as uuidv4 } from 'uuid'

export type AnalysisType = 'image' | 'platform' | 'typography' | 'color' | 'general'

export interface AIAnalysisResult {
  id: string
  platform_id: string | null
  brand_id: string | null
  analysis_type: AnalysisType
  prompt: string
  result: any
  metadata?: Record<string, any>
  created_at: string
  updated_at: string
}

interface AIAnalysisStore {
  results: AIAnalysisResult[]
  currentResults: Record<AnalysisType, AIAnalysisResult | null>
  isLoading: boolean
  error: string | null
  
  // Methods
  fetchResults: (options?: { 
    platform_id?: string, 
    brand_id?: string, 
    analysis_type?: AnalysisType,
    limit?: number
  }) => Promise<AIAnalysisResult[]>
  
  getResultById: (id: string) => AIAnalysisResult | undefined
  
  saveResult: (data: {
    platform_id?: string | null
    brand_id?: string | null
    analysis_type: AnalysisType
    prompt: string
    result: any
    metadata?: Record<string, any>
  }) => Promise<AIAnalysisResult>
  
  deleteResult: (id: string) => Promise<boolean>
  
  setCurrentResult: (type: AnalysisType, result: AIAnalysisResult | null) => void
  
  getLatestResultByType: (type: AnalysisType, options?: {
    platform_id?: string,
    brand_id?: string
  }) => Promise<AIAnalysisResult | null>
}

export const useAIAnalysisStore = create<AIAnalysisStore>()(
  persist(
    (set, get) => ({
      results: [],
      currentResults: {
        image: null,
        platform: null,
        typography: null,
        color: null,
        general: null,
      },
      isLoading: false,
      error: null,

      // Fetch results with optional filtering
      fetchResults: async (options = {}) => {
        set({ isLoading: true, error: null })
        
        try {
          let query = supabase.from('ai_analysis_results').select('*')
          
          if (options.platform_id) {
            query = query.eq('platform_id', options.platform_id)
          }
          
          if (options.brand_id) {
            query = query.eq('brand_id', options.brand_id)
          }
          
          if (options.analysis_type) {
            query = query.eq('analysis_type', options.analysis_type)
          }
          
          // Order by most recent first
          query = query.order('created_at', { ascending: false })
          
          if (options.limit) {
            query = query.limit(options.limit)
          }
          
          const { data, error } = await query
          
          if (error) throw new Error(error.message)
          
          const results = data as AIAnalysisResult[]
          set({ results, isLoading: false })
          return results
        } catch (error) {
          console.error('Error fetching AI analysis results:', error)
          set({ 
            error: error instanceof Error ? error.message : 'Unknown error fetching results', 
            isLoading: false 
          })
          return []
        }
      },
      
      // Get a specific result by ID
      getResultById: (id: string) => {
        return get().results.find(result => result.id === id)
      },
      
      // Save a new analysis result
      saveResult: async (data) => {
        set({ isLoading: true, error: null })
        
        const newResult = {
          id: uuidv4(),
          platform_id: data.platform_id || null,
          brand_id: data.brand_id || null,
          analysis_type: data.analysis_type,
          prompt: data.prompt,
          result: data.result,
          metadata: data.metadata || {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        
        try {
          const { data: savedData, error } = await supabase
            .from('ai_analysis_results')
            .insert([newResult])
            .select()
            
          if (error) throw new Error(error.message)
          
          const savedResult = savedData?.[0] as AIAnalysisResult
          
          set(state => ({
            results: [savedResult, ...state.results],
            currentResults: {
              ...state.currentResults,
              [data.analysis_type]: savedResult,
            },
            isLoading: false
          }))
          
          return savedResult
        } catch (error) {
          console.error('Error saving AI analysis result:', error)
          set({ 
            error: error instanceof Error ? error.message : 'Unknown error saving result', 
            isLoading: false 
          })
          throw error
        }
      },
      
      // Delete a result
      deleteResult: async (id: string) => {
        set({ isLoading: true, error: null })
        
        try {
          const { error } = await supabase
            .from('ai_analysis_results')
            .delete()
            .eq('id', id)
            
          if (error) throw new Error(error.message)
          
          const deletedResult = get().results.find(r => r.id === id)
          
          set(state => {
            // Update current results if the deleted result was current
            const currentResults = { ...state.currentResults }
            if (deletedResult && currentResults[deletedResult.analysis_type]?.id === id) {
              currentResults[deletedResult.analysis_type] = null
            }
            
            return {
              results: state.results.filter(r => r.id !== id),
              currentResults,
              isLoading: false
            }
          })
          
          return true
        } catch (error) {
          console.error('Error deleting AI analysis result:', error)
          set({ 
            error: error instanceof Error ? error.message : 'Unknown error deleting result', 
            isLoading: false 
          })
          return false
        }
      },
      
      // Set current result for a specific type
      setCurrentResult: (type: AnalysisType, result: AIAnalysisResult | null) => {
        set(state => ({
          currentResults: {
            ...state.currentResults,
            [type]: result
          }
        }))
      },
      
      // Get the latest result for a specific type
      getLatestResultByType: async (type: AnalysisType, options = {}) => {
        set({ isLoading: true, error: null })
        
        try {
          let query = supabase
            .from('ai_analysis_results')
            .select('*')
            .eq('analysis_type', type)
            .order('created_at', { ascending: false })
            .limit(1)
          
          if (options.platform_id) {
            query = query.eq('platform_id', options.platform_id)
          }
          
          if (options.brand_id) {
            query = query.eq('brand_id', options.brand_id)
          }
          
          const { data, error } = await query
          
          if (error) throw new Error(error.message)
          
          const result = data?.length ? data[0] as AIAnalysisResult : null
          
          if (result) {
            set(state => ({
              currentResults: {
                ...state.currentResults,
                [type]: result
              },
              isLoading: false
            }))
          } else {
            set({ isLoading: false })
          }
          
          return result
        } catch (error) {
          console.error('Error fetching latest AI analysis result:', error)
          set({ 
            error: error instanceof Error ? error.message : 'Unknown error fetching latest result', 
            isLoading: false 
          })
          return null
        }
      }
    }),
    {
      name: 'ai-analysis-store',
      // Only persist the current results to localStorage for quick access on page load
      partialize: (state) => ({
        currentResults: state.currentResults,
      }),
    }
  )
)
