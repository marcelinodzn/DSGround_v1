import { useState, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { v4 as uuidv4 } from 'uuid'
import { useAIAnalysisStore } from '@/store/ai-analysis-store'
import { usePlatformStore } from '@/store/platform-store'

export interface UseImageUploadProps {
  onUpload?: (url: string) => void
  initialUrl?: string
  bucket?: string
  folder?: string
  saveAnalysisResults?: boolean
  platformId?: string
  brandId?: string
}

export interface UseImageUploadReturn {
  previewUrl: string | null
  fileName: string | null
  fileInputRef: React.RefObject<HTMLInputElement>
  isUploading: boolean
  error: Error | null
  handleThumbnailClick: () => void
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleRemove: () => void
  upload: (file: File) => Promise<string>
}

export function useImageUpload({
  onUpload,
  initialUrl = null,
  bucket = 'images',
  folder = 'uploads',
  saveAnalysisResults = true,
  platformId,
  brandId,
}: UseImageUploadProps = {}): UseImageUploadReturn {
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialUrl)
  const [fileName, setFileName] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Get stores
  const { saveResult } = useAIAnalysisStore()
  const { currentPlatform } = usePlatformStore()
  
  // If platformId is not provided, use the current platform
  const effectivePlatformId = platformId || currentPlatform?.id

  const handleThumbnailClick = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }, [])

  // Mock function for AI image analysis - replace with your actual AI API call
  const analyzeImage = async (url: string, filename: string): Promise<any> => {
    // In a real implementation, this would call your AI API for image analysis
    return {
      description: `This is an image of ${filename}`,
      tags: ['image', 'upload', 'design'],
      dimensions: '800x600',
      colors: ['#FF5733', '#33FF57', '#3357FF'],
      dominant_color: '#FF5733',
      analysis_summary: 'This is a placeholder for real image analysis.',
    }
  }

  const upload = async (file: File): Promise<string> => {
    setIsUploading(true)
    setError(null)

    try {
      // Generate a unique filename to prevent overwriting
      const fileExt = file.name.split('.').pop()
      const fileName = `${uuidv4()}.${fileExt}`
      const filePath = `${folder}/${fileName}`

      // Upload to Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) {
        throw new Error(uploadError.message)
      }

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath)
        
      // Save file metadata to the database
      await supabase.from('uploaded_files').insert({
        id: uuidv4(),
        filename: file.name,
        storage_path: filePath,
        public_url: publicUrl,
        mime_type: file.type,
        size_bytes: file.size,
        platform_id: effectivePlatformId,
        brand_id: brandId,
        metadata: {
          originalName: file.name,
          uploadedAt: new Date().toISOString(),
        }
      })
      
      // If enabled, analyze the image and save the results
      if (saveAnalysisResults) {
        try {
          // Get AI analysis of the image
          const analysisResult = await analyzeImage(publicUrl, file.name)
          
          // Save the analysis result
          await saveResult({
            platform_id: effectivePlatformId,
            brand_id: brandId,
            analysis_type: 'image',
            prompt: `Analyze image: ${file.name}`,
            result: analysisResult,
            metadata: {
              imageUrl: publicUrl,
              fileName: file.name,
              fileSize: file.size,
              fileType: file.type,
            }
          })
        } catch (analysisError) {
          console.error('Error analyzing image:', analysisError)
          // Continue even if analysis fails
        }
      }

      return publicUrl
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error during upload')
      setError(error)
      throw error
    } finally {
      setIsUploading(false)
    }
  }

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Create local preview URL immediately for better UX
    const localPreviewUrl = URL.createObjectURL(file)
    setPreviewUrl(localPreviewUrl)
    setFileName(file.name)

    try {
      // Upload file to Supabase
      const publicUrl = await upload(file)
      
      // Call onUpload callback with the uploaded URL
      if (onUpload) onUpload(publicUrl)
    } catch (error) {
      console.error('Error uploading image:', error)
      // Keep local preview even if upload fails, so the user can retry
    }
  }, [onUpload, upload])

  const handleRemove = useCallback(() => {
    setPreviewUrl(null)
    setFileName(null)
    
    // Clear the file input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  return {
    previewUrl,
    fileName,
    fileInputRef,
    isUploading,
    error,
    handleThumbnailClick,
    handleFileChange,
    handleRemove,
    upload,
  }
}
