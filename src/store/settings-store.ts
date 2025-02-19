import { create } from 'zustand'

interface LayoutState {
  isFullscreen: boolean
  setIsFullscreen: (value: boolean) => void
}

export const useLayout = create<LayoutState>((set) => ({
  isFullscreen: false,
  setIsFullscreen: (value) => set({ isFullscreen: value }),
}))// Update the fetchBrands function
fetchBrands: async () => {
  set({ isLoading: true })
  try {
    const { data, error } = await supabase
      .from('brands')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    const typedData = data as unknown as Brand[]
    set({ brands: typedData, error: null })

    if (!get().currentBrand && typedData.length > 0) {
      await get().setCurrentBrand(typedData[0].id)
    }
  } catch (error) {
    set({ error: (error as Error).message })
  } finally {
    set({ isLoading: false })
  }
}// Update the tabs definition
const tabs = [
  {
    id: 'typography',
    label: 'Typography',
    content: 'Typography'
  },
  {
    id: 'colors',
    label: 'Colors',
    content: 'Colors'
  },
  {
    id: 'components',
    label: 'Components',
    content: 'Components'
  },
  {
    id: 'tokens',
    label: 'Tokens',
    content: 'Tokens'
  }
]

// Update the setBrand call in fetchBrand
const fetchBrand = async () => {
  try {
    const { data, error } = await supabase
      .from('brands')
      .select('*')
      .eq('id', brandId)
      .single()

    if (error) throw error
    setBrand(data as Brand)
  } catch (error) {
    console.error('Error fetching brand:', error)
  }
}// Add units to Platform interface
export interface Platform {
  id: string
  name: string
  scaleMethod: ScaleMethod
  scale: ScaleConfig
  units: {
    typography: string
    spacing: string
    dimensions: string
  }
  distanceScale: {
    viewingDistance: number
    visualAcuity: number
    meanLengthRatio: number
    textType: TextType
    lighting: LightingCondition
    ppi: number
  }
  accessibility: {
    minContrastBody: number
    minContrastLarge: number
  }
  typeStyles: TypeStyle[]
  aiScale?: AIScale
  currentFontRole?: 'primary' | 'secondary' | 'tertiary'
  fontId?: string
}

// Update saveTypographySettings
saveTypographySettings: async (platformId: string, settings: Partial<Platform>) => {
  try {
    const { error } = await supabase
      .from('typography_settings')
      .upsert({
        platform_id: platformId,
        ...settings,
      })

    if (error) throw error

    set((state) => ({
      platforms: state.platforms.map((platform) => {
        if (platform.id === platformId) {
          return {
            ...platform,
            ...settings
          }
        }
        return platform
      })
    }))
  } catch (error) {
    set({ error: (error as Error).message })
  }
}// Update fetchPlatforms
fetchPlatforms: async () => {
  set({ isLoading: true })
  try {
    const { data, error } = await supabase
      .from('platforms')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    const typedData = data as unknown as Platform[]
    set({ platforms: typedData, error: null })

    if (!get().currentPlatform && typedData.length > 0) {
      await get().setCurrentPlatform(typedData[0].id)
    }
  } catch (error) {
    set({ error: (error as Error).message })
  } finally {
    set({ isLoading: false })
  }
}import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SettingsState {
  theme: string
  setTheme: (theme: string) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'system',
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'settings-store',
    }
  )
)
