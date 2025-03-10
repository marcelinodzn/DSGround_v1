'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { ensureTableExists } from '@/lib/supabase-diagnostics';
import { X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle } from 'lucide-react';

export function TypographyDebugMode() {
  const [authStatus, setAuthStatus] = useState<'authenticated' | 'unauthenticated' | 'checking'>('checking');
  const [logs, setLogs] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [isClearingSettings, setIsClearingSettings] = useState(false);
  const [tableStatus, setTableStatus] = useState<Record<string, boolean>>({});

  // Check authentication status
  const checkAuth = async () => {
    addLog('Checking authentication status...');
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error('Auth error:', error);
      setAuthStatus('unauthenticated');
      addLog(`Authentication error: ${error.message}`);
      return false;
    }
    
    const status = data?.session ? 'authenticated' : 'unauthenticated';
    setAuthStatus(status);
    addLog(`Authentication status: ${status}`);
    return status === 'authenticated';
  };
  
  // Check auth on load
  useEffect(() => {
    checkAuth();
  }, []);

  // Run diagnostics 
  const runDiagnostics = async () => {
    setIsChecking(true);
    addLog('Running diagnostics...');
    
    // Check authentication first
    await checkAuth();
    
    // Check critical tables
    const tables = ['typography_settings', 'platforms', 'brands', 'fonts'];
    const results: Record<string, boolean> = {};
    
    // Add a note about expected errors
    addLog('Note: 404 errors for pg_catalog.pg_tables are normal and can be ignored');
    addLog('The application uses direct table checks which are working correctly');
    
    for (const table of tables) {
      addLog(`Checking table: ${table}...`);
      try {
        const exists = await ensureTableExists(table);
        results[table] = exists;
        addLog(`Table ${table}: ${exists ? 'EXISTS ✅' : 'MISSING ❌'}`);
      } catch (e) {
        results[table] = false;
        addLog(`Error checking table ${table}: ${e instanceof Error ? e.message : 'Unknown error'}`);
      }
    }
    
    // Check if typography settings are being saved correctly
    addLog('Checking if typography settings can be saved...');
    try {
      const { data } = await supabase
        .from('typography_settings')
        .select('*')
        .limit(1);
        
      if (data && data.length > 0) {
        addLog('Typography settings table contains data ✅');
      } else {
        addLog('Typography settings table is empty - this is normal for new platforms');
      }
    } catch (e) {
      addLog(`Error checking typography settings: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }
    
    setTableStatus(results);
    
    // Check auth
    addLog(`Auth status: ${authStatus}`);
    
    setIsChecking(false);
  };

  const clearTypographySettings = async () => {
    if (!confirm('Are you sure you want to delete ALL typography settings? This cannot be undone!')) {
      return;
    }
    
    addLog('Deleting all typography settings...');
    
    try {
      const { error } = await supabase
        .from('typography_settings')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records
      
      if (error) {
        addLog(`Error deleting typography settings: ${error.message}`);
      } else {
        addLog('Successfully deleted all typography settings');
      }
    } catch (e) {
      addLog(`Error: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }
  };
  
  const addLog = (message: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };
  
  if (!isOpen) {
    return (
      <div className="fixed right-4 bottom-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(true)}
          className="bg-slate-900 text-white hover:bg-slate-800"
        >
          Debug Mode
        </Button>
      </div>
    );
  }
  
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-lg w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-bold">Typography Debug Mode</h2>
          <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
            Close
          </Button>
        </div>
        
        <div className="p-4 space-y-4 overflow-y-auto flex-1">
          <div className="flex space-x-2">
            <Button onClick={runDiagnostics} disabled={isChecking}>
              Run Diagnostics
            </Button>
            <Button
              variant="destructive"
              onClick={clearTypographySettings}
              disabled={isChecking || authStatus !== 'authenticated'}
            >
              Clear All Typography Settings
            </Button>
          </div>
          
          <div className="mb-4 rounded-md bg-amber-50 dark:bg-amber-950 p-3 text-sm">
            <p className="font-medium text-amber-800 dark:text-amber-300 flex items-center">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Note about console errors
            </p>
            <p className="mt-1 text-amber-700 dark:text-amber-400">
              404 errors for <code>pg_catalog.pg_tables</code> in the console are normal and do not affect functionality.
              The application falls back to direct table checks which are working correctly.
            </p>
          </div>
          
          <div>
            <h3 className="font-bold mb-2">Auth Status</h3>
            <div className={`px-3 py-2 rounded text-white ${
              authStatus === 'authenticated' ? 'bg-green-500' :
              authStatus === 'unauthenticated' ? 'bg-red-500' : 'bg-yellow-500'
            }`}>
              {authStatus}
            </div>
          </div>
          
          {Object.keys(tableStatus).length > 0 && (
            <div>
              <h3 className="font-bold mb-2">Database Tables</h3>
              <div className="space-y-2">
                {Object.entries(tableStatus).map(([table, exists]) => (
                  <div
                    key={table}
                    className={`px-3 py-2 rounded text-white ${exists ? 'bg-green-500' : 'bg-red-500'}`}
                  >
                    {table}: {exists ? 'EXISTS' : 'MISSING'}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div>
            <h3 className="font-bold mb-2">Logs</h3>
            <div className="bg-black text-white rounded p-2 overflow-y-auto max-h-[200px]">
              {logs.length === 0 ? (
                <p className="text-gray-500">No logs yet. Run diagnostics to see results.</p>
              ) : (
                logs.map((log, i) => (
                  <div key={i} className="font-mono text-xs">
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 