import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import { type TypeStyle, type Platform } from '@/types/typography'

// Define TypographySettings interface here since it's not exported from elsewhere
interface TypographySettings {
  id: string;
  platform_id: string;
  settings: {
    scale: {
      baseSize: number;
      ratio: number;
      stepsUp: number;
      stepsDown: number;
    };
    typeStyles: Array<{
      id: string;
      name: string;
      fontFamily: string;
      fontSize: number;
      lineHeight: number;
      letterSpacing: number;
      fontWeight: number;
      scaleStep: number;
    }>;
  };
  created_at: string;
  updated_at: string;
}

interface TypographyState {
  platforms: {
    [key in Platform]: {
      styles: TypeStyle[]
      settings: {
        baseSize: number
        ratio: number
        steps: number
        scaleMethod: 'modular' | 'linear' | 'custom'
      }
    }
  }
  currentPlatform: Platform
  settings: TypographySettings | null
  styles: TypeStyle[]
  isLoading: boolean
  error: string | null
  setCurrentPlatform: (platform: Platform) => void
  updatePlatformStyles: (platform: Platform, styles: TypeStyle[]) => void
  updatePlatformSettings: (
    platform: Platform,
    settings: {
      baseSize: number
      ratio: number
      steps: number
      scaleMethod: 'modular' | 'linear' | 'custom'
    }
  ) => void
  fetchTypographySettings: (platformId: string) => Promise<void>
  fetchTypeStyles: (platformId: string) => Promise<void>
}

export const useTypographyStore = create<TypographyState>((set, get) => ({
  platforms: {
    web: {
      styles: [],
      settings: {
        baseSize: 16,
        ratio: 1.25,
        steps: 6,
        scaleMethod: 'modular'
      }
    },
    ios: {
      styles: [],
      settings: {
        baseSize: 16,
        ratio: 1.2,
        steps: 6,
        scaleMethod: 'modular'
      }
    },
    android: {
      styles: [],
      settings: {
        baseSize: 16,
        ratio: 1.2,
        steps: 6,
        scaleMethod: 'modular'
      }
    }
  },
  currentPlatform: 'web',
  setCurrentPlatform: (platform) => set({ currentPlatform: platform }),
  updatePlatformStyles: (platform, styles) =>
    set((state) => ({
      platforms: {
        ...state.platforms,
        [platform]: {
          ...state.platforms[platform],
          styles
        }
      }
    })),
  updatePlatformSettings: (platform, settings) =>
    set((state) => ({
      platforms: {
        ...state.platforms,
        [platform]: {
          ...state.platforms[platform],
          settings
        }
      }
    })),
  settings: null,
  styles: [],
  isLoading: false,
  error: null,

  fetchTypographySettings: async (platformId) => {
    set({ isLoading: true, error: null })
    try {
      console.log(`[Typography] Fetching settings for platform ${platformId}`);
      
      const { data, error } = await supabase
        .from('typography_settings')
        .select('*')
        .eq('platform_id', platformId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          console.log(`[Typography] No settings found for platform ${platformId}, will create default`);
          set({ settings: null });
          return;
        }
        throw error;
      }

      if (!data) {
        console.log(`[Typography] No data returned for platform ${platformId}`);
        set({ settings: null });
        return;
      }

      console.log(`[Typography] Successfully fetched settings for platform ${platformId}:`, data);
      set({ settings: data as TypographySettings, error: null });
    } catch (error) {
      console.error(`[Typography] Error fetching settings:`, error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch typography settings',
        settings: null
      });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchTypeStyles: async (platformId) => {
    set({ isLoading: true, error: null })
    try {
      console.log(`[Typography] Fetching type styles for platform ${platformId}`);
      
      const { data, error } = await supabase
        .from('type_styles')
        .select('*')
        .eq('platform_id', platformId)
        .order('created_at', { ascending: true })

      if (error) {
        console.error(`[Typography] Error fetching type styles:`, error);
        throw error;
      }

      if (!data || !Array.isArray(data)) {
        console.log(`[Typography] No type styles found for platform ${platformId}`);
        set({ styles: [] });
        return;
      }

      console.log(`[Typography] Successfully fetched ${data.length} type styles for platform ${platformId}`);
      set({ styles: data as TypeStyle[], error: null });
    } catch (error) {
      console.error(`[Typography] Error fetching type styles:`, error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch type styles',
        styles: []
      });
    } finally {
      set({ isLoading: false });
    }
  }
})) 