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

export const convertUnits = ({ from, to, value, baseSize = 16 }: UnitConversion): number => {
  // First convert to pixels as intermediate
  let px: number = value;
  
  // Convert from source unit to pixels
  switch (from) {
    case 'rem':
      px = value * baseSize;
      break;
    case 'em':
      px = value * baseSize;
      break;
    case 'pt':
      px = value * (96 / 72); // 1pt = 1/72 inch, 1px = 1/96 inch
      break;
    case 'pc':
      px = value * (96 / 6); // 1pc = 1/6 inch
      break;
    case '%':
      px = (value / 100) * baseSize;
      break;
    case 'px':
      px = value;
      break;
    // Add other unit conversions as needed
  }
  
  // Convert pixels to target unit
  switch (to) {
    case 'rem':
      return px / baseSize;
    case 'em':
      return px / baseSize;
    case 'pt':
      return px * (72 / 96);
    case 'pc':
      return px * (6 / 96);
    case '%':
      return (px / baseSize) * 100;
    case 'px':
      return px;
    default:
      return value; // Return original value if unit not supported
  }
}

// Add a function to format value with unit
export const formatWithUnit = (value: number, unit: string): string => {
  return `${value}${unit}`;
}
