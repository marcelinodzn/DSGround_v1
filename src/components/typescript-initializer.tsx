'use client';

import { useEffect } from 'react';
import { toast } from 'sonner';

/**
 * A component that displays usage instructions for the new features
 */
export function TypescriptInitializer() {
  useEffect(() => {
    // Show a toast notification to inform users about the new history feature
    toast('New Feature Available', {
      description: "You can now view the history of typography changes by clicking the History button in the header.",
      duration: 5000,
    });
  }, []);
  
  return null;
} 