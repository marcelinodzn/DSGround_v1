'use client'

// Create a new store for platforms
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

export interface Platform {
  id: string
  name: string
  description: string
  createdAt: string
  units: {
    typography: 'rem' | 'em' | 'ch' | 'ex' | 'vw' | 'vh' | '%' | 'px' | 'pt' | 'pc'
    spacing: 'rem' | 'em' | 'vw' | 'vh' | '%' | 'px'
    dimensions: '%' | 'vw' | 'vh' | 'px' | 'cm' | 'mm' | 'in' | 'm'
  }
  layout: {
    baseSize: number
    gridColumns: number
    gridGutter: number
    containerPadding: number
  }
}

interface PlatformStore {
  platforms: Platform[]
  addPlatform: (platform: Platform) => void
  updatePlatform: (id: string, updates: Partial<Platform>) => void
  deletePlatform: (id: string) => void
  duplicatePlatform: (id: string) => void
}

export const usePlatformStore = create<PlatformStore>()(
  persist(
    (set) => ({
      platforms: [{
        id: 'web',
        name: 'Web Platform',
        description: 'Default web platform configuration',
        createdAt: new Date().toISOString(),
        units: {
          typography: 'rem',
          spacing: 'px',
          dimensions: 'px'
        },
        layout: {
          baseSize: 16,
          gridColumns: 12,
          gridGutter: 24,
          containerPadding: 16
        }
      }],
      addPlatform: (platform) => 
        set((state) => ({ platforms: [...state.platforms, platform] })),
      updatePlatform: (id, updates) =>
        set((state) => ({
          platforms: state.platforms.map((p) =>
            p.id === id ? { ...p, ...updates } : p
          ),
        })),
      deletePlatform: (id) =>
        set((state) => ({
          platforms: state.platforms.filter((p) => p.id !== id),
        })),
      duplicatePlatform: (id) =>
        set((state) => {
          const platform = state.platforms.find((p) => p.id === id)
          if (!platform) return state
          const newPlatform = {
            ...platform,
            id: crypto.randomUUID(),
            name: `${platform.name} (Copy)`,
            createdAt: new Date().toISOString()
          }
          return { platforms: [...state.platforms, newPlatform] }
        }),
    }),
    {
      name: 'platform-store',
      storage: createJSONStorage(() => localStorage),
      version: 1,
    }
  )
) 