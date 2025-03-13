'use client';

import { useState, useEffect } from 'react';
import { testSupabaseConnection, isSupabaseMockClient } from '@/lib/test-supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function SupabaseTestPage() {
  const [testResult, setTestResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [brands, setBrands] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isMockClient, setIsMockClient] = useState<boolean | null>(null);

  useEffect(() => {
    setIsMockClient(isSupabaseMockClient());
  }, []);

  const runTest = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await testSupabaseConnection();
      setTestResult(result);
      
      // Also try to fetch brands directly
      const { data, error } = await supabase.from('brands').select('*');
      if (error) {
        setError(error.message);
      } else {
        setBrands(data || []);
      }
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const addTestBrand = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('brands')
        .insert([
          { 
            name: `Test Brand ${Date.now()}`, 
            description: 'Created from the test page', 
            type: 'master' 
          }
        ])
        .select();
      
      if (error) {
        setError(error.message);
      } else {
        // Refresh brands list
        runTest();
      }
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container max-w-3xl py-12">
      <Card>
        <CardHeader>
          <CardTitle>Supabase Connection Test</CardTitle>
          <CardDescription>
            This page tests the connection to your Supabase database and displays information about your brands.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isMockClient !== null && (
            <Alert variant={isMockClient ? "destructive" : "default"}>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Client Type</AlertTitle>
              <AlertDescription>
                {isMockClient 
                  ? "Using MOCK Supabase client! Data will NOT persist between page refreshes." 
                  : "Using REAL Supabase client. Data will persist properly."}
              </AlertDescription>
            </Alert>
          )}

          {testResult && (
            <div className="space-y-2">
              <div className="flex items-center">
                <h3 className="text-lg font-medium">Connection Test:</h3>
                {testResult.success ? (
                  <CheckCircle className="ml-2 h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="ml-2 h-5 w-5 text-red-500" />
                )}
              </div>
              <pre className="p-4 bg-gray-100 rounded-md text-sm overflow-auto max-h-60">
                {JSON.stringify(testResult, null, 2)}
              </pre>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div>
            <h3 className="text-lg font-medium mb-2">Brands in Database:</h3>
            {brands.length > 0 ? (
              <ul className="space-y-2">
                {brands.map((brand) => (
                  <li key={brand.id} className="p-3 bg-gray-50 rounded-md">
                    <div className="font-medium">{brand.name}</div>
                    <div className="text-sm text-gray-500">{brand.description || 'No description'}</div>
                    <div className="text-xs text-gray-400 mt-1">ID: {brand.id}</div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">No brands found in the database.</p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button onClick={runTest} disabled={isLoading}>
            {isLoading ? 'Testing...' : 'Run Connection Test'}
          </Button>
          <Button onClick={addTestBrand} disabled={isLoading} variant="outline">
            Add Test Brand
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 