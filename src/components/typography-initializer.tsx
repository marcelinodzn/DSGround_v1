'use client'

import { useEffect } from 'react'
import { usePlatformStore } from '@/store/platform-store'
import { useTypographyStore } from '@/store/typography'
import { runSupabaseDiagnostics, ensureTableExists } from '@/lib/supabase-diagnostics'
import { supabase } from '@/lib/supabase'

interface TypographySettings {
  scale: {
    baseSize: number;
    ratio: number;
    stepsUp: number;
    stepsDown: number;
  };
  // Add other properties as needed
}

export function TypographyInitializer() {
  const { platforms } = usePlatformStore()
  const typographyStore = useTypographyStore()
  
  useEffect(() => {
    const initializeData = async () => {
      console.log('[Typography] Starting data initialization')
      
      // Run diagnostics to check database connection and schema
      const diagnosticsResult = await runSupabaseDiagnostics()
      
      // If diagnostics fail, log the error but continue with initialization
      if (!diagnosticsResult.connection.success) {
        console.error('[Typography] Database connection check failed:', diagnosticsResult.connection.error)
        return
      }
      
      if (!diagnosticsResult.tables.success) {
        console.error('[Typography] Database schema check failed:', diagnosticsResult.tables.error)
        console.warn('[Typography] Missing tables:', diagnosticsResult.tables.missingTables)
        
        // For each missing table that's critical, try to verify it exists directly
        const missingTables = diagnosticsResult.tables.missingTables || []
        
        if (missingTables.includes('typography_settings')) {
          const typographyTableExists = await ensureTableExists('typography_settings')
          if (!typographyTableExists) {
            console.error('[Typography] Critical table typography_settings is missing, initialization will fail')
            return
          }
        }
        
        if (missingTables.includes('platforms')) {
          const platformsTableExists = await ensureTableExists('platforms')
          if (!platformsTableExists) {
            console.error('[Typography] Critical table platforms is missing, initialization will fail')
            return
          }
        }
      }
      
      // Initialize typography data for each platform
      // This ensures that every platform has typography settings
      if (platforms && platforms.length > 0) {
        console.log('[Typography] Platforms available for initialization:', platforms)
        
        for (const platform of platforms) {
          console.log(`[Typography] Checking platform ${platform.id}`)
          
          // Check if typography settings exist for the platform
          const { data, error } = await supabase
            .from('typography_settings')
            .select('id')
            .eq('platform_id', platform.id)
            
          if (error) {
            console.error(`[Typography] Error checking typography settings for platform ${platform.id}:`, error)
            continue
          }
          
          if (!data || data.length === 0) {
            console.log(`[Typography] No typography settings found for platform ${platform.id}, creating default settings`)
            
            // Create default typography settings
            if (typeof typographyStore.saveTypographySettings === 'function') {
              const defaultSettings: TypographySettings = {
                scale: {
                  baseSize: 16,
                  ratio: 1.2,
                  stepsUp: 3,
                  stepsDown: 2
                }
              }
              
              await typographyStore.saveTypographySettings(platform.id, defaultSettings)
              console.log(`[Typography] Created default typography settings for platform ${platform.id}`)
            } else {
              console.error(`[Typography] saveTypographySettings function not available, cannot create default settings`)
            }
          } else {
            console.log(`[Typography] Typography data for platform ${platform.id} already exists, skipping initialization`)
          }
        }
      }
      
      console.log('[Typography] Initialization complete')
    }
    
    initializeData()
  }, [platforms, typographyStore])
  
  // This component doesn't render anything
  return null
} 