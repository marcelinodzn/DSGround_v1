import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const convertToBase64 = async (file: File): Promise<string> => {
  // First compress the image
  const compressedImage = await compressImage(file, {
    maxWidth: 800,
    maxHeight: 600,
    quality: 0.8
  })
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(compressedImage)
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = (error) => reject(error)
  })
}

interface CompressOptions {
  maxWidth: number
  maxHeight: number
  quality: number
}

const compressImage = (file: File, options: CompressOptions): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.src = URL.createObjectURL(file)
    
    img.onload = () => {
      URL.revokeObjectURL(img.src)
      
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      if (!ctx) {
        reject(new Error('Could not get canvas context'))
        return
      }
      
      // Calculate new dimensions while maintaining aspect ratio
      let { width, height } = img
      if (width > options.maxWidth) {
        height = Math.round((height * options.maxWidth) / width)
        width = options.maxWidth
      }
      if (height > options.maxHeight) {
        width = Math.round((width * options.maxHeight) / height)
        height = options.maxHeight
      }
      
      // Set canvas dimensions
      canvas.width = width
      canvas.height = height
      
      // Draw and compress image
      ctx.drawImage(img, 0, 0, width, height)
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('Could not compress image'))
          }
        },
        'image/jpeg',
        options.quality
      )
    }
    
    img.onerror = () => {
      URL.revokeObjectURL(img.src)
      reject(new Error('Could not load image'))
    }
  })
}

export const slugify = (text: string) => {
  return text
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
}

// Add these unit conversion utilities
interface UnitConversion {
  from: string
  to: string
  value: number
  baseSize?: number
}

export function convertUnits(
  value: number, 
  fromUnit: string, 
  toUnit: string, 
  baseSize: number = 16
): number {
  // First convert to pixels
  let pixels = value;
  if (fromUnit !== 'px') {
    switch (fromUnit) {
      case 'rem':
        pixels = value * baseSize;
        break;
      case 'em':
        pixels = value * baseSize;
        break;
      // Add other unit conversions as needed
    }
  }

  // Then convert pixels to target unit
  switch (toUnit) {
    case 'px':
      return Math.round(pixels * 100) / 100;
    case 'rem':
      return Math.round((pixels / baseSize) * 1000) / 1000;
    case 'em':
      return Math.round((pixels / baseSize) * 1000) / 1000;
    case '%':
      return Math.round((pixels / baseSize * 100) * 100) / 100;
    case 'pt':
      return Math.round((pixels * 0.75) * 100) / 100;
    default:
      return pixels;
  }
}

// Add a function to format value with unit
export const formatWithUnit = (value: number, unit: string): string => {
  return `${value}${unit}`;
}
