'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useDropzone } from 'react-dropzone'
import { v4 as uuidv4 } from 'uuid'
import { Upload, AlertCircle, X, Loader2, Trash2 } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Slider } from "@/components/ui/slider"
import { FontPreview } from './font-preview'
import { useToast } from '@/components/ui/use-toast'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useFontStore } from '@/store/font-store'
import { Font, FontCategory } from '@/lib/fonts'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import * as fontkit from 'fontkit'
import * as opentype from 'opentype.js'
import { SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Card } from "@/components/ui/card"
import { useAuth } from '@/providers/auth-provider'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

interface FontMetadata extends Partial<Font> {
  file: File
  error?: string
  size?: number
  variableMode?: 'variable' | 'fixed'
  selectedWeight?: number
  fileUrl?: string
  isVariable?: boolean
}

const fontCategories = [
  { value: 'sans-serif', label: 'Sans Serif' },
  { value: 'serif', label: 'Serif' },
  { value: 'monospace', label: 'Monospace' },
  { value: 'display', label: 'Display' },
  { value: 'handwriting', label: 'Handwriting' },
]

const commonWeights = [
  { value: 100, label: 'Thin' },
  { value: 200, label: 'Extra Light' },
  { value: 300, label: 'Light' },
  { value: 400, label: 'Regular' },
  { value: 500, label: 'Medium' },
  { value: 600, label: 'Semi Bold' },
  { value: 700, label: 'Bold' },
  { value: 800, label: 'Extra Bold' },
  { value: 900, label: 'Black' },
]

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

// Utility function to format bytes into human readable format
const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

export function FontUploader() {
  const previewRef = useRef<HTMLDivElement>(null)
  const [files, setFiles] = useState<FontMetadata[]>([])
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const { uploadFont, createFamily, loadFonts, deleteFont } = useFontStore()
  const { session } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Clean up object URLs when component unmounts
    return () => {
      files.forEach(font => {
        if (font.fileUrl) {
          URL.revokeObjectURL(font.fileUrl)
        }
      })
    }
  }, [files])

  const validateFont = async (file: File): Promise<string | null> => {
    if (file.size > MAX_FILE_SIZE) {
      return `File size exceeds 5MB limit`
    }

    // Additional font validation could be added here
    return null
  }

  const extractFontMetadata = async (font: opentype.Font) => {
    try {
      // Check if font has variable font data
      const hasVariations = font.tables.fvar !== undefined;
      
      return {
        familyName: font.names.fontFamily?.en || 'Unknown Family',
        styleName: font.names.fontSubfamily?.en || 'Regular',
        fullName: font.names.fullName?.en || 'Unknown Font',
        postScriptName: font.names.postScriptName?.en,
        designer: font.names.designer?.en,
        description: font.names.description?.en,
        // Only include variations if the font has them
        variations: hasVariations ? font.tables.fvar.axes.map((axis: any) => ({
          tag: axis.tag,
          name: axis.name,
          min: axis.minValue,
          max: axis.maxValue,
          default: axis.defaultValue
        })) : []
      };
    } catch (error) {
      console.error('Error extracting font metadata:', error);
      // Return basic metadata if extraction fails
      return {
        familyName: font.names.fontFamily?.en || 'Unknown Family',
        styleName: font.names.fontSubfamily?.en || 'Regular',
        fullName: font.names.fullName?.en || 'Unknown Font',
        variations: []
      };
    }
  };

  const handleFileUpload = async (acceptedFiles: File[]) => {
    const newFiles: FontMetadata[] = []

    for (const file of acceptedFiles) {
      try {
        // Validate file
        const error = await validateFont(file)
        if (error) {
          newFiles.push({
            file,
            error,
            name: file.name,
            size: file.size,
          })
          continue
        }

        // Read font file
        const buffer = await file.arrayBuffer()
        const font = opentype.parse(buffer)
        const metadata = await extractFontMetadata(font)

        // Create object URL for preview
        const fileUrl = URL.createObjectURL(file)

        // Check if font is variable
        const isVariable = font.tables.fvar !== undefined

        newFiles.push({
          file,
          name: metadata.fullName || file.name,
          family: metadata.familyName || '',
          weight: 400, // Default weight
          style: 'normal', // Default style
          format: file.name.split('.').pop() || '',
          category: detectFontCategory(metadata) as FontCategory,
          tags: [],
          fileUrl,
          isVariable,
          variableMode: isVariable ? 'variable' : undefined,
          size: file.size,
        })
      } catch (error) {
        console.error('Error processing font:', error)
        newFiles.push({
          file,
          error: 'Failed to process font file',
          name: file.name,
          size: file.size,
        })
      }
    }

    setFiles(prev => [...prev, ...newFiles])
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleFileUpload,
    accept: {
      'font/ttf': ['.ttf'],
      'font/otf': ['.otf'],
      'font/woff2': ['.woff2'],
    },
    maxSize: MAX_FILE_SIZE,
  })

  const handleMetadataChange = (
    index: number,
    field: keyof FontMetadata,
    value: any
  ) => {
    setFiles(prev => {
      const newFiles = [...prev]
      const font = { ...newFiles[index] }
      
      // Handle special cases
      if (field === 'weight') {
        // Update weight when in fixed mode
        font.selectedWeight = value
        font.weight = value
      } else {
        // Handle other metadata changes with proper typing
        (font as any)[field] = value
      }
      
      newFiles[index] = font
      return newFiles
    })
  }

  const handleUpload = async () => {
    if (files.length === 0) {
      toast('Please add at least one font file', {
        description: 'You need to add font files before uploading.',
        icon: '⚠️',
      });
      return;
    }
    
    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      toast('Authentication required', {
        description: 'You must be signed in to upload fonts',
        icon: '⚠️',
      });
      router.push('/auth/signin')
      return;
    }
    
    setUploading(true)
    let uploaded = 0

    try {
      const totalFiles = files.length
      const familyGroups = files.reduce((acc, font) => {
        const family = font.family as string
        if (!acc[family]) acc[family] = []
        acc[family].push(font)
        return acc
      }, {} as Record<string, FontMetadata[]>)

      for (const [familyName, familyFonts] of Object.entries(familyGroups)) {
        try {
          const familyId = uuidv4()
          
          // Create family with proper typing
          const familyData = {
            id: familyId,
            name: familyName,
            category: familyFonts[0].category as FontCategory,
            tags: familyFonts[0].tags || []
          };
          
          try {
            const family = await createFamily(familyData);
             
            // Upload fonts
            for (const font of familyFonts) {
              try {
                const fontId = uuidv4()
                
                // Ensure we have the correct file format
                const fileExt = font.file.name.split('.').pop()?.toLowerCase() || '';
                const validFormats = ['ttf', 'otf', 'woff', 'woff2'];
                
                if (!validFormats.includes(fileExt)) {
                  toast.error(`Unsupported font format: ${fileExt}. Please use TTF, OTF, WOFF, or WOFF2.`);
                  continue;
                }
                
                // Log file details for debugging
                console.log(`Preparing to upload font: ${font.name}`, {
                  type: font.file.type,
                  size: font.file.size,
                  extension: fileExt
                });
                
                // Create a new File object with the correct MIME type if needed
                let fileToUpload = font.file;
                if (!font.file.type || font.file.type === 'application/json') {
                  const mimeTypes: Record<string, string> = {
                    'ttf': 'font/ttf',
                    'otf': 'font/otf',
                    'woff': 'font/woff',
                    'woff2': 'font/woff2'
                  };
                  const correctType = mimeTypes[fileExt] || 'application/octet-stream';
                  
                  // Create a new File with the correct MIME type
                  const arrayBuffer = await font.file.arrayBuffer();
                  fileToUpload = new File([arrayBuffer], font.file.name, { 
                    type: correctType 
                  });
                  
                  console.log(`Created new file with corrected MIME type: ${correctType}`);
                }
                
                await uploadFont(fileToUpload, {
                  id: fontId,
                  name: font.name || '',
                  family: familyName,
                  family_id: familyId, // Use the ID we generated
                  weight: font.weight || 400,
                  style: font.style || 'normal',
                  format: fileExt,
                  is_variable: font.isVariable,
                  variable_mode: font.variableMode,
                  category: font.category as FontCategory,
                  tags: font.tags || []
                })
                
                uploaded++
                setProgress((uploaded / totalFiles) * 100)
              } catch (error: any) {
                console.error('Font upload error:', error)
                toast.error(`Failed to upload font: ${font.name}`)
              }
            }
          } catch (error: any) {
            console.error('Family creation error:', error)
            toast.error(`Failed to create font family: ${familyName}`)
          }
        } catch (error: any) {
          if (error.message === 'Authentication required') {
            toast.error('You must be signed in to upload fonts')
            router.push('/auth/signin')
            return
          }
          console.error('Family creation error:', error)
          toast.error(`Failed to create family: ${familyName}`)
        }
      }

      if (uploaded > 0) {
        toast.success(`Successfully uploaded ${uploaded} font${uploaded > 1 ? 's' : ''}`)
        setFiles([])
        setProgress(0)
        await loadFonts()
      }
    } catch (error: any) {
      console.error('Upload error:', error)
      toast.error('Failed to upload fonts. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const confirmDelete = (index: number) => {
    setDeleteIndex(index)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = () => {
    if (deleteIndex !== null) {
      handleDeleteFont(deleteIndex)
    }
    setDeleteDialogOpen(false)
    setDeleteIndex(null)
  }

  const handleDeleteFont = (index: number) => {
    setFiles(prev => {
      const newFiles = [...prev]
      const fileToDelete = newFiles[index]
      if (fileToDelete.fileUrl) {
        URL.revokeObjectURL(fileToDelete.fileUrl)
      }
      newFiles.splice(index, 1)
      return newFiles
    })
  }

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="space-y-6 flex-shrink-0">
        <div {...getRootProps()} className={cn(
          "rounded-lg p-6 bg-muted hover:bg-muted/80 transition-colors",
          isDragActive && "bg-primary/5"
        )}>
          <input {...getInputProps()} />
          <div className="flex flex-col items-center justify-center gap-2 text-center">
            <Upload className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Drag & drop font files here, or click to select files
            </p>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-8">
          {files.map((font, index) => (
            <div key={`${font.name}-${index}`} className="space-y-6">
              {font.error ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{font.error}</AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="text-2xl font-bold">{font.name}</div>
                      <div className="flex items-center gap-2">
                        <div className="text-sm text-muted-foreground">
                          {formatBytes(font.file.size)}
                        </div>
                        {font.isVariable ? (
                          <Badge variant="secondary">Variable Font</Badge>
                        ) : (
                          <Badge variant="outline">Static Font</Badge>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setDeleteIndex(index)
                        setDeleteDialogOpen(true)
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    {/* Font Family Name */}
                    <div className="space-y-2">
                      <Label>Font Family Name</Label>
                      <Input
                        value={font.family || ''}
                        onChange={(e) => handleMetadataChange(index, 'family', e.target.value)}
                        placeholder="e.g., Inter"
                      />
                    </div>

                    {/* Font Category */}
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Select
                        value={font.category}
                        onValueChange={(value) => handleMetadataChange(index, 'category', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {fontCategories.map(category => (
                            <SelectItem key={category.value} value={category.value}>
                              {category.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Font Style */}
                    <div className="space-y-2">
                      <Label>Style</Label>
                      <Select
                        value={font.style}
                        onValueChange={(value) => handleMetadataChange(index, 'style', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select style" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="normal">Normal</SelectItem>
                          <SelectItem value="italic">Italic</SelectItem>
                          <SelectItem value="oblique">Oblique</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Variable Font Mode Selection */}
                  {font.isVariable && (
                    <div className="space-y-4">
                      <div className="rounded-lg border p-4 space-y-4">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="h-4 w-4 mt-0.5 text-primary" />
                          <div className="space-y-1">
                            <div className="font-medium">Variable Font Options</div>
                            <div className="text-sm text-muted-foreground">
                              This font supports variable weights. Choose how you want to use it:
                            </div>
                          </div>
                        </div>

                        <div className="grid gap-4">
                          <div className="flex items-center space-x-2">
                            <input
                              type="radio"
                              id={`variable-${index}`}
                              name={`variable-mode-${index}`}
                              className="radio"
                              checked={font.variableMode === 'variable'}
                              onChange={() => {
                                setFiles(files.map((f, i) => 
                                  i === index ? {
                                    ...f,
                                    variableMode: 'variable',
                                    weight: 400
                                  } : f
                                ))
                              }}
                            />
                            <div className="grid gap-1.5">
                              <label
                                htmlFor={`variable-${index}`}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                              >
                                Full Variable Range
                              </label>
                              <p className="text-sm text-muted-foreground">
                                Use the complete weight range (1-1000)
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="radio"
                              id={`fixed-${index}`}
                              name={`variable-mode-${index}`}
                              className="radio"
                              checked={font.variableMode === 'fixed'}
                              onChange={() => {
                                setFiles(files.map((f, i) => 
                                  i === index ? {
                                    ...f,
                                    variableMode: 'fixed',
                                    weight: 400
                                  } : f
                                ))
                              }}
                            />
                            <div className="grid gap-1.5">
                              <label
                                htmlFor={`fixed-${index}`}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                              >
                                Fixed Weight
                              </label>
                              <p className="text-sm text-muted-foreground">
                                Select a specific weight to use
                              </p>
                            </div>
                          </div>
                        </div>

                        {font.variableMode === 'variable' ? (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label>Preview Weight</Label>
                              <span className="text-sm text-muted-foreground">{font.weight}</span>
                            </div>
                            <Slider
                              defaultValue={[font.weight || 400]}
                              min={1}
                              max={1000}
                              step={1}
                              onValueChange={([value]) => {
                                setFiles(files.map((f, i) => 
                                  i === index ? { ...f, weight: value } : f
                                ))
                              }}
                            />
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <Label>Fixed Weight</Label>
                            <Select
                              value={font.weight?.toString()}
                              onValueChange={(value) => {
                                setFiles(files.map((f, i) => 
                                  i === index ? { ...f, weight: parseInt(value) } : f
                                ))
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select weight" />
                              </SelectTrigger>
                              <SelectContent>
                                {commonWeights.map(weight => (
                                  <SelectItem key={weight.value} value={weight.value.toString()}>
                                    {weight.label} ({weight.value})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  {/* Font Preview */}
                  <div className="space-y-2">
                    <Label>Preview</Label>
                    {font.fileUrl && (
                      <Card className="p-4 space-y-4">
                        <div 
                          className="min-h-[120px] p-4 rounded-lg bg-muted"
                          style={{ 
                            fontWeight: font.weight || 400,
                            fontStyle: font.style || 'normal',
                            fontSize: `${32}px`,
                            lineHeight: 1.3,
                            height: 'auto',
                            fontVariationSettings: font.isVariable && font.variableMode === 'variable' ? `'wght' ${font.weight || 400}` : undefined
                          }}
                        >
                          <div className="text-4xl mb-4">
                            The quick brown fox jumps over the lazy dog
                          </div>
                          <div className="text-base">
                            ABCDEFGHIJKLMNOPQRSTUVWXYZ<br />
                            abcdefghijklmnopqrstuvwxyz<br />
                            1234567890!@#$%^&*()
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <Label className="text-muted-foreground">Category</Label>
                            <div className="capitalize">{font.category}</div>
                          </div>
                          <div>
                            <Label className="text-muted-foreground">Style</Label>
                            <div className="capitalize">{font.style}</div>
                          </div>
                          {font.isVariable && (
                            <div className="col-span-2">
                              <Label className="text-muted-foreground">Variable Font</Label>
                              <div>
                                {font.variableMode === 'variable' 
                                  ? 'Variable weight (1-1000)' 
                                  : 'Fixed weight mode'}
                              </div>
                            </div>
                          )}
                        </div>
                      </Card>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>

      {files.length > 0 && (
        <div className="flex justify-end gap-4 flex-shrink-0 pt-4">
          <Button
            variant="outline"
            onClick={() => {
              setFiles([])
              setProgress(0)
            }}
          >
            Clear All
          </Button>
          <Button
            onClick={handleUpload}
            disabled={uploading || files.some(f => f.error)}
          >
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              'Upload'
            )}
          </Button>
        </div>
      )}

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Font</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this font?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {uploading && (
        <Progress value={progress} className="h-1" />
      )}
    </div>
  )
}

function detectFontCategory(font: any): FontCategory {
  const postscriptName = font.postscriptName?.toLowerCase() || ''
  const fullName = font.fullName?.toLowerCase() || ''
  const subfamily = font.subfamilyName?.toLowerCase() || ''

  if (
    postscriptName.includes('serif') || 
    fullName.includes('serif') || 
    subfamily.includes('serif')
  ) {
    if (postscriptName.includes('sans') || fullName.includes('sans') || subfamily.includes('sans')) {
      return 'sans-serif'
    } else {
      return 'serif'
    }
  } else if (
    postscriptName.includes('mono') || 
    fullName.includes('mono') || 
    subfamily.includes('mono') ||
    postscriptName.includes('code') || 
    fullName.includes('code') || 
    subfamily.includes('code')
  ) {
    return 'monospace'
  } else if (
    postscriptName.includes('script') || 
    fullName.includes('script') || 
    subfamily.includes('script') ||
    postscriptName.includes('hand') || 
    fullName.includes('hand') || 
    subfamily.includes('hand')
  ) {
    return 'handwriting'
  } else if (
    postscriptName.includes('display') || 
    fullName.includes('display') || 
    subfamily.includes('display') ||
    postscriptName.includes('decorative') || 
    fullName.includes('decorative') || 
    subfamily.includes('decorative')
  ) {
    return 'display'
  }

  return 'sans-serif'
}


