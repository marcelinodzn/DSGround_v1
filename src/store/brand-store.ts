import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '@/lib/supabase'
import { usePlatformStore } from './platform-store'
import { useTypographyStore } from './typography'

export interface Brand {
  id: string
  name: string
  description: string | null
  type: 'master' | 'sub'
  created_at: string
  updated_at: string
}

interface BrandStore {
  brands: Brand[]
  currentBrand: Brand | null
  isLoading: boolean
  error: string | null
  fetchBrands: () => Promise<void>
  createBrand: (brand: { 
    name: string
    description?: string | null
    type: 'master' | 'sub' 
  }) => Promise<void>
  updateBrand: (id: string, updates: Partial<Brand>) => Promise<void>
  deleteBrand: (id: string) => Promise<void>
  setCurrentBrand: (id: string | null) => Promise<void>
  fetchBrand: (brandId: string) => Promise<void>
}

// Helper to create stable function references
const createStableActions = (set: any, get: any) => {
  const actions = {
    fetchBrands: async () => {
      const state = get()
      // If already loading, don't trigger another fetch
      if (state.isLoading) {
        console.log('Already fetching brands, skipping duplicate request')
        return
      }
      
      set({ isLoading: true })
      try {
        console.log('Fetching brands...');
        
        const { data, error } = await supabase
          .from('brands')
          .select('*')
          .order('created_at', { ascending: false })
  
        if (error) {
          console.error('Error fetching brands:', error);
          throw error;
        }
        
        if (!data || data.length === 0) {
          console.log('No brands found in database');
          set({ brands: [], error: null })
          return
        }
        
        // Validate and clean brand data
        const validatedBrands = data.map((brand: any) => {
          if (!brand.name || typeof brand.name !== 'string') {
            console.warn('Brand name is missing or invalid:', brand);
            // Ensure the brand has a valid name
            return { 
              ...brand, 
              name: brand.name || `Brand ${brand.id ? brand.id.substring(0, 8) : 'Unknown'}`
            };
          }
          return brand;
        });
        
        console.log('Brands fetched successfully:', validatedBrands);
        if (validatedBrands.length > 0) {
          console.log('First brand structure:', {
            id: validatedBrands[0].id,
            name: validatedBrands[0].name,
            fullObject: validatedBrands[0]
          });
        }
        
        // Set brands but NOT currentBrand yet to avoid re-renders
        set({ brands: validatedBrands as unknown as Brand[], error: null })
  
        // Only set currentBrand if it's null and we have brands
        const updatedState = get()
        if (!updatedState.currentBrand && validatedBrands.length > 0) {
          console.log('Setting current brand to:', validatedBrands[0]);
          console.log('Current state in setter:', get());
          set({ currentBrand: validatedBrands[0] as unknown as Brand });
        }
      } catch (error) {
        console.error('Error fetching brands:', error);
        set({ error: (error as Error).message, isLoading: false })
      } finally {
        set({ isLoading: false })
      }
    }
  }
  
  return actions
}

export const useBrandStore = create<BrandStore>((set, get) => {
  const stableActions = createStableActions(set, get)
  
  return {
    brands: [],
    currentBrand: null,
    isLoading: false,
    error: null,
    fetchBrands: stableActions.fetchBrands,

    createBrand: async (brand) => {
      set({ isLoading: true })
      try {
        // Validate brand name
        if (!brand.name || typeof brand.name !== 'string' || brand.name.trim() === '') {
          throw new Error('Brand name is required');
        }
        
        // Prepare brand data with proper validation
        const brandData = {
          name: brand.name.trim(),
          description: brand.description || null,
          type: brand.type || 'master'
        };
        
        console.log('Creating brand with data:', brandData);
        
        const { data, error } = await supabase
          .from('brands')
          .insert([brandData])
          .select()

        if (error) {
          console.error('Error creating brand:', error);
          throw error;
        }
        
        if (!data || data.length === 0) {
          console.error('No data returned from brand creation');
          throw new Error('No data returned from brand creation');
        }
        
        // Validate returned brand data
        const newBrand = data[0];
        if (!newBrand.name || typeof newBrand.name !== 'string') {
          console.warn('Brand returned from server has invalid name, fixing it');
          newBrand.name = brandData.name;
        }
        
        console.log('Brand created successfully:', newBrand);
        
        set(state => ({
          brands: [...state.brands, newBrand as unknown as Brand],
          currentBrand: newBrand as unknown as Brand,
          isLoading: false
        }))
      } catch (error) {
        console.error('Failed to create brand:', error);
        set({ error: (error as Error).message, isLoading: false })
        throw error;
      }
    },

    updateBrand: async (id, updates) => {
      set({ isLoading: true })
      try {
        const { data, error } = await supabase
          .from('brands')
          .update(updates)
          .eq('id', id)
          .select()
          .single()

        if (error) throw error
        
        set(state => ({
          brands: state.brands.map(b => 
            b.id === id ? { ...b, ...data } as Brand : b
          )
        }))
      } catch (error) {
        set({ error: (error as Error).message })
      } finally {
        set({ isLoading: false })
      }
    },

    deleteBrand: async (id) => {
      set({ isLoading: true })
      try {
        const { error } = await supabase
          .from('brands')
          .delete()
          .eq('id', id)

        if (error) throw error
        
        set(state => ({
          brands: state.brands.filter(b => b.id !== id),
          currentBrand: state.currentBrand && state.currentBrand.id === id ? null : state.currentBrand
        }))
      } catch (error) {
        set({ error: (error as Error).message })
      } finally {
        set({ isLoading: false })
      }
    },

    setCurrentBrand: async (id: string | null) => {
      try {
        if (!id) {
          console.log('Setting currentBrand to null');
          set({ currentBrand: null })
          return
        }

        console.log(`Attempting to set current brand to ID: ${id}`);
        const state = get()
        const brand = state.brands.find(b => b.id === id)
        if (brand) {
          console.log(`Found brand in local state:`, brand);
          set({ currentBrand: brand as unknown as Brand })
        } else {
          console.log(`Brand not found in local state, fetching from database`);
          const { data, error } = await supabase
            .from('brands')
            .select('*')
            .eq('id', id)
            .single()

          if (error) {
            console.error(`Error fetching brand: ${error.message}`);
            throw error
          }
          
          if (data) {
            console.log(`Successfully fetched brand from database:`, data);
            set({ currentBrand: data as unknown as Brand })
          } else {
            console.warn(`No brand found with ID: ${id}`);
          }
        }
      } catch (error) {
        console.error(`Error in setCurrentBrand:`, error);
        set({ error: (error as Error).message })
      }
    },

    fetchBrand: async (brandId) => {
      set({ isLoading: true })
      try {
        const { data, error } = await supabase
          .from('brands')
          .select('*')
          .eq('id', brandId)
          .single()

        if (error) throw error
        
        set({ 
          currentBrand: data as unknown as Brand,
          error: null 
        })
      } catch (error) {
        set({ error: (error as Error).message })
      } finally {
        set({ isLoading: false })
      }
    }
  }
})