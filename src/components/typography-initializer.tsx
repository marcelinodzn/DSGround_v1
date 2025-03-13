'use client'

import { useEffect } from 'react'
import { usePlatformStore } from '@/store/platform-store'
import { useTypographyStore } from '@/store/typography'
import { runSupabaseDiagnostics, ensureTableExists } from '@/lib/supabase-diagnostics'
import { supabase } from '@/lib/supabase'
import React from 'react'

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
  const [retryCount, setRetryCount] = React.useState(0)
  const maxRetries = 3
  
  useEffect(() => {
    // Guard against too many retries
    if (retryCount >= maxRetries) {
      console.warn(`[Typography] Maximum retry count (${maxRetries}) reached, stopping initialization attempts`);
      return;
    }
    
    const initializeData = async () => {
      console.log('[Typography] Starting data initialization')
      
      // Run diagnostics to check database connection and schema
      const diagnosticsResult = await runSupabaseDiagnostics()
      
      // If diagnostics fail, log the error but continue with initialization
      if (!diagnosticsResult.connection.success) {
        console.error('[Typography] Database connection check failed:', diagnosticsResult.connection.error)
        setRetryCount(prev => prev + 1);
        return;
      }
      
      if (!diagnosticsResult.tables.success) {
        console.error('[Typography] Database schema check failed:', diagnosticsResult.tables.error)
        console.warn('[Typography] Missing tables:', diagnosticsResult.tables.missingTables)
        
        // For each missing table that's critical, try to verify it exists directly
        const missingTables: string[] = diagnosticsResult.tables.missingTables || []
        
        if (missingTables.includes('typography_settings')) {
          const typographyTableExists = await ensureTableExists('typography_settings')
          if (!typographyTableExists) {
            console.error('[Typography] Critical table typography_settings is missing, initialization will fail')
            setRetryCount(prev => prev + 1);
            return;
          }
        }
        
        if (missingTables.includes('platforms')) {
          const platformsTableExists = await ensureTableExists('platforms')
          if (!platformsTableExists) {
            console.error('[Typography] Critical table platforms is missing, initialization will fail')
            setRetryCount(prev => prev + 1);
            return;
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
          try {
            const { data, error } = await supabase
              .from('typography_settings')
              .select('id')
              .eq('platform_id', platform.id)
              
            if (error) {
              console.error(`[Typography] Error checking typography settings for platform ${platform.id}:`, error)
              continue;
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
          } catch (platformError) {
            console.error(`[Typography] Error initializing platform ${platform.id}:`, platformError);
            // Continue with other platforms even if one fails
          }
        }
      }
      
      console.log('[Typography] Initialization complete')
    }
    
    // Use a delay to prevent initialization from running immediately during initial render
    const initTimeout = setTimeout(() => {
      initializeData().catch(error => {
        console.error('[Typography] Initialization failed:', error);
        setRetryCount(prev => prev + 1);
      });
    }, 1000);
    
    return () => clearTimeout(initTimeout);
  }, [platforms, typographyStore, retryCount, maxRetries]);
  
  // This component doesn't render anything
  return null
} 