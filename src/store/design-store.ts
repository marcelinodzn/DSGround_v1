'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '@/lib/supabase'
import { v4 as uuidv4 } from 'uuid'

// Types for scale methods
export type ScaleMethod = 'linear' | 'modular' | 'custom'

// Types for layer styles
export interface LayerStyle {
  id: string
  name: string
  properties: {
    fill?: string | null
    stroke?: string | null
    strokeWidth?: number
    opacity?: number
    borderRadius?: number
    shadow?: {
      color: string
      offsetX: number
      offsetY: number
      blur: number
      spread: number
    } | null
    effects?: Array<{
      type: string
      value: any
    }>
  }
}

// Design element interface
export interface DesignElement {
  id: string
  type: 'image' | 'shape' | 'text' | 'component'
  name: string
  platformId: string
  properties: {
    x: number
    y: number
    width: number
    height: number
    rotation: number
    opacity: number
    layerStyleId?: string
    scaleMethod?: ScaleMethod
    // Additional properties specific to the element type
    [key: string]: any
  }
  assets?: {
    imageUrl?: string
    thumbnailUrl?: string
  }
  created_at: string
  updated_at: string
}

// Design store state interface
interface DesignStore {
  elements: DesignElement[]
  layerStyles: LayerStyle[]
  selectedElementId: string | null
  selectedLayerStyleId: string | null
  currentScaleMethod: ScaleMethod
  isLoading: boolean
  error: string | null
  
  // Element methods
  fetchElements: (platformId: string) => Promise<void>
  getElement: (id: string) => DesignElement | undefined
  addElement: (element: Omit<DesignElement, 'id' | 'created_at' | 'updated_at'>) => Promise<DesignElement>
  updateElement: (id: string, updates: Partial<Omit<DesignElement, 'id' | 'created_at'>>) => Promise<DesignElement>
  deleteElement: (id: string) => Promise<boolean>
  setSelectedElement: (id: string | null) => void
  
  // Layer style methods
  fetchLayerStyles: (platformId: string) => Promise<void>
  getLayerStyle: (id: string) => LayerStyle | undefined
  addLayerStyle: (style: Omit<LayerStyle, 'id'>) => Promise<LayerStyle>
  updateLayerStyle: (id: string, updates: Partial<Omit<LayerStyle, 'id'>>) => Promise<LayerStyle>
  deleteLayerStyle: (id: string) => Promise<boolean>
  setSelectedLayerStyle: (id: string | null) => void
  
  // Scale method
  setCurrentScaleMethod: (method: ScaleMethod) => Promise<void>
}

export const useDesignStore = create<DesignStore>()(
  persist(
    (set, get) => ({
      elements: [],
      layerStyles: [],
      selectedElementId: null,
      selectedLayerStyleId: null,
      currentScaleMethod: 'linear',
      isLoading: false,
      error: null,

      // Element methods
      fetchElements: async (platformId: string) => {
        set({ isLoading: true, error: null })
        
        try {
          const { data, error } = await supabase
            .from('design_elements')
            .select('*')
            .eq('platform_id', platformId)
            
          if (error) throw new Error(error.message)
          
          set({ elements: data as DesignElement[], isLoading: false })
        } catch (error) {
          console.error('Error fetching design elements:', error)
          set({ 
            error: error instanceof Error ? error.message : 'Unknown error fetching elements', 
            isLoading: false 
          })
        }
      },
      
      getElement: (id: string) => {
        return get().elements.find(element => element.id === id)
      },
      
      addElement: async (element) => {
        set({ isLoading: true, error: null })
        
        const newElement = {
          ...element,
          id: uuidv4(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        
        try {
          const { data, error } = await supabase
            .from('design_elements')
            .insert([newElement])
            .select()
            
          if (error) throw new Error(error.message)
          
          const addedElement = data?.[0] as DesignElement
          
          set(state => ({
            elements: [...state.elements, addedElement],
            isLoading: false
          }))
          
          return addedElement
        } catch (error) {
          console.error('Error adding design element:', error)
          set({ 
            error: error instanceof Error ? error.message : 'Unknown error adding element', 
            isLoading: false 
          })
          throw error
        }
      },
      
      updateElement: async (id, updates) => {
        set({ isLoading: true, error: null })
        
        try {
          const element = get().getElement(id)
          if (!element) throw new Error(`Element with ID ${id} not found`)
          
          const updatedElement = {
            ...element,
            ...updates,
            updated_at: new Date().toISOString()
          }
          
          const { data, error } = await supabase
            .from('design_elements')
            .update(updatedElement)
            .eq('id', id)
            .select()
            
          if (error) throw new Error(error.message)
          
          const updated = data?.[0] as DesignElement
          
          set(state => ({
            elements: state.elements.map(e => e.id === id ? updated : e),
            isLoading: false
          }))
          
          return updated
        } catch (error) {
          console.error('Error updating design element:', error)
          set({ 
            error: error instanceof Error ? error.message : 'Unknown error updating element', 
            isLoading: false 
          })
          throw error
        }
      },
      
      deleteElement: async (id) => {
        set({ isLoading: true, error: null })
        
        try {
          const { error } = await supabase
            .from('design_elements')
            .delete()
            .eq('id', id)
            
          if (error) throw new Error(error.message)
          
          set(state => ({
            elements: state.elements.filter(e => e.id !== id),
            selectedElementId: state.selectedElementId === id ? null : state.selectedElementId,
            isLoading: false
          }))
          
          return true
        } catch (error) {
          console.error('Error deleting design element:', error)
          set({ 
            error: error instanceof Error ? error.message : 'Unknown error deleting element', 
            isLoading: false 
          })
          return false
        }
      },
      
      setSelectedElement: (id) => {
        set({ selectedElementId: id })
      },
      
      // Layer style methods
      fetchLayerStyles: async (platformId: string) => {
        set({ isLoading: true, error: null })
        
        try {
          const { data, error } = await supabase
            .from('layer_styles')
            .select('*')
            .eq('platform_id', platformId)
            
          if (error) throw new Error(error.message)
          
          set({ layerStyles: data as LayerStyle[], isLoading: false })
        } catch (error) {
          console.error('Error fetching layer styles:', error)
          set({ 
            error: error instanceof Error ? error.message : 'Unknown error fetching layer styles', 
            isLoading: false 
          })
        }
      },
      
      getLayerStyle: (id: string) => {
        return get().layerStyles.find(style => style.id === id)
      },
      
      addLayerStyle: async (style) => {
        set({ isLoading: true, error: null })
        
        const newStyle = {
          ...style,
          id: uuidv4(),
        }
        
        try {
          const { data, error } = await supabase
            .from('layer_styles')
            .insert([newStyle])
            .select()
            
          if (error) throw new Error(error.message)
          
          const addedStyle = data?.[0] as LayerStyle
          
          set(state => ({
            layerStyles: [...state.layerStyles, addedStyle],
            isLoading: false
          }))
          
          return addedStyle
        } catch (error) {
          console.error('Error adding layer style:', error)
          set({ 
            error: error instanceof Error ? error.message : 'Unknown error adding layer style', 
            isLoading: false 
          })
          throw error
        }
      },
      
      updateLayerStyle: async (id, updates) => {
        set({ isLoading: true, error: null })
        
        try {
          const style = get().getLayerStyle(id)
          if (!style) throw new Error(`Layer style with ID ${id} not found`)
          
          const updatedStyle = {
            ...style,
            ...updates,
          }
          
          const { data, error } = await supabase
            .from('layer_styles')
            .update(updatedStyle)
            .eq('id', id)
            .select()
            
          if (error) throw new Error(error.message)
          
          const updated = data?.[0] as LayerStyle
          
          set(state => ({
            layerStyles: state.layerStyles.map(s => s.id === id ? updated : s),
            isLoading: false
          }))
          
          return updated
        } catch (error) {
          console.error('Error updating layer style:', error)
          set({ 
            error: error instanceof Error ? error.message : 'Unknown error updating layer style', 
            isLoading: false 
          })
          throw error
        }
      },
      
      deleteLayerStyle: async (id) => {
        set({ isLoading: true, error: null })
        
        try {
          const { error } = await supabase
            .from('layer_styles')
            .delete()
            .eq('id', id)
            
          if (error) throw new Error(error.message)
          
          set(state => ({
            layerStyles: state.layerStyles.filter(s => s.id !== id),
            selectedLayerStyleId: state.selectedLayerStyleId === id ? null : state.selectedLayerStyleId,
            isLoading: false
          }))
          
          return true
        } catch (error) {
          console.error('Error deleting layer style:', error)
          set({ 
            error: error instanceof Error ? error.message : 'Unknown error deleting layer style', 
            isLoading: false 
          })
          return false
        }
      },
      
      setSelectedLayerStyle: (id) => {
        set({ selectedLayerStyleId: id })
      },
      
      // Scale method
      setCurrentScaleMethod: async (method) => {
        set({ currentScaleMethod: method })
        
        // If needed, we could also store the user's preference in Supabase
        try {
          const userId = await get().getUserId()
          if (!userId) return
          
          await supabase
            .from('user_preferences')
            .upsert({
              user_id: userId,
              preference_type: 'scale_method',
              preference_value: method
            }, { onConflict: 'user_id,preference_type' })
            
        } catch (error) {
          console.error('Error storing scale method preference:', error)
        }
      },
      
      // Helper method to get the current user ID
      getUserId: async () => {
        const { data } = await supabase.auth.getUser()
        return data?.user?.id
      }
    }),
    {
      name: 'design-store',
      // Only persist non-sensitive data to localStorage
      partialize: (state) => ({
        selectedElementId: state.selectedElementId,
        selectedLayerStyleId: state.selectedLayerStyleId,
        currentScaleMethod: state.currentScaleMethod,
      }),
    }
  )
)
