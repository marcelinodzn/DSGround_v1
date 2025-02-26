'use client';

import { useEffect, useState } from 'react';
import { usePlatformStore } from '@/store/platform-store';
import { useTypographyStore } from '@/store/typography';
import { useBrandStore } from '@/store/brand-store';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';

interface BrandTokensPageProps {
  params: {
    brandId: string;
  };
}

export default function BrandTokensPage({ params }: BrandTokensPageProps) {
  const { brandId } = params;
  const [platforms, setPlatforms] = useState([]);
  const [selectedPlatform, setSelectedPlatform] = useState('');
  
  // Load platforms directly from the database
  useEffect(() => {
    const loadPlatforms = async () => {
      try {
        console.log("Loading platforms for brand:", brandId);
        const { data, error } = await supabase
          .from('platforms')
          .select('*')
          .eq('brand_id', brandId);
          
        if (error) {
          console.error("Error loading platforms:", error);
          return;
        }
        
        console.log("Platforms loaded:", data);
        setPlatforms(data || []);
        
        if (data && data.length > 0 && !selectedPlatform) {
          setSelectedPlatform(data[0].id);
        }
      } catch (err) {
        console.error("Exception loading platforms:", err);
      }
    };
    
    loadPlatforms();
  }, [brandId, selectedPlatform]);

  return (
    <div>
      <h1 className="text-3xl font-bold text-red-500 mb-4">TEST TEXT - TOKENS PAGE</h1>
      
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Typography Tokens</h1>
          <p className="text-sm text-muted-foreground">Generated from typography scale</p>
        </div>
        <div className="flex items-center gap-2">
          <Select 
            value={selectedPlatform} 
            onValueChange={setSelectedPlatform}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select platform" />
            </SelectTrigger>
            <SelectContent>
              {platforms.length > 0 ? (
                platforms.map((platform, index) => (
                  <SelectItem key={`platform-${index}`} value={platform.id}>
                    {platform.name || "Unnamed Platform"}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="no-platforms" disabled>
                  No platforms available
                </SelectItem>
              )}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            Sync to Figma
          </Button>
          <Button variant="outline" size="sm">
            Sync to GitHub
          </Button>
        </div>
      </div>
      
      {/* Debug information */}
      <div className="p-4 bg-gray-100 rounded-md my-4">
        <h3 className="font-bold">Debug Info:</h3>
        <p>Brand ID: {brandId}</p>
        <p>Selected Platform: {selectedPlatform || 'None'}</p>
        <p>Available Platforms: {platforms.length}</p>
        <ul>
          {platforms.map((p, i) => (
            <li key={i}>{p.name || 'Unnamed'} (ID: {p.id})</li>
          ))}
        </ul>
      </div>
      
      {/* Table headers */}
      <div className="grid grid-cols-5 gap-4 font-medium text-sm mb-2 px-4">
        <div>Name</div>
        <div>Scale Step</div>
        <div>Font Size</div>
        <div>Line Height</div>
        <div>Font Weight</div>
      </div>
      
      {/* Generated code tabs */}
      <div className="mt-8">
        <h2 className="font-semibold mb-2">Generated Code</h2>
        <div className="flex gap-2 border-b">
          <button className="px-4 py-2 border-b-2 border-primary">CSS</button>
          <button className="px-4 py-2">SCSS</button>
          <button className="px-4 py-2">Tailwind</button>
          <button className="px-4 py-2">JavaScript</button>
          <button className="px-4 py-2">Web</button>
          <button className="px-4 py-2">iOS</button>
          <button className="px-4 py-2">Android</button>
        </div>
      </div>
    </div>
  );
} 