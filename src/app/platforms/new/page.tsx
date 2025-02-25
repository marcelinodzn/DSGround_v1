'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useBrandStore } from "@/store/brand-store"
import { usePlatformStore } from "@/store/platform-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"

export default function NewPlatformPage() {
  const router = useRouter()
  const { currentBrand } = useBrandStore()
  const { createPlatform } = usePlatformStore()
  
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [type, setType] = useState("web")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const platformTypes = [
    { id: "web", name: "Web" },
    { id: "mobile", name: "Mobile" },
    { id: "print", name: "Print" },
    { id: "outdoor", name: "Outdoor" },
    { id: "instore", name: "In-store" },
    { id: "vr", name: "VR" },
    { id: "tv", name: "TV" },
  ]
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!currentBrand) {
      setError("Please select a brand first")
      return
    }
    
    if (!name.trim()) {
      setError("Platform name is required")
      return
    }
    
    setIsSubmitting(true)
    setError(null)
    
    try {
      await createPlatform({
        name,
        description,
        type,
        brandId: currentBrand.id
      })
      
      router.push('/platforms')
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create platform")
    } finally {
      setIsSubmitting(false)
    }
  }
  
  if (!currentBrand) {
    return (
      <div className="container mx-auto py-8">
        <div className="max-w-3xl mx-auto">
          <div className="flex flex-col items-center justify-center min-h-[400px] gap-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Please select a brand first</h3>
              <p className="text-muted-foreground mb-4">
                You need to select a brand before creating a platform
              </p>
              <Button onClick={() => router.push('/platforms')}>
                Go to Platforms
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="container mx-auto py-8">
      <div className="max-w-3xl mx-auto">
        <Button 
          variant="ghost" 
          className="mb-6"
          onClick={() => router.push('/platforms')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Platforms
        </Button>
        
        <Card>
          <CardHeader>
            <CardTitle>Create New Platform</CardTitle>
            <CardDescription>
              Add a new platform for {currentBrand.name}
            </CardDescription>
          </CardHeader>
          
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm">
                  {error}
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="name">Platform Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Website, Mobile App, etc."
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="type">Platform Type</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select platform type" />
                  </SelectTrigger>
                  <SelectContent>
                    {platformTypes.map(platformType => (
                      <SelectItem key={platformType.id} value={platformType.id}>
                        {platformType.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of this platform"
                  rows={3}
                />
              </div>
            </CardContent>
            
            <CardFooter className="flex justify-end space-x-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => router.push('/platforms')}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
              >
                {isSubmitting ? "Creating..." : "Create Platform"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}