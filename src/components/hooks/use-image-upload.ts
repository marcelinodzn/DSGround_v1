import { useState, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { v4 as uuidv4 } from 'uuid'

export interface UseImageUploadProps {
  onUpload?: (url: string) => void
  initialUrl?: string
  bucket?: string
  folder?: string
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
}: UseImageUploadProps = {}): UseImageUploadReturn {
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialUrl)
  const [fileName, setFileName] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleThumbnailClick = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }, [])

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
