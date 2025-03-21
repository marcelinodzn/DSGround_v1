import { parse, formatHex, rgb, oklch } from 'culori';
import { v4 as uuidv4 } from 'uuid';

// Define RGB color type
interface RGBColor {
  r: number;
  g: number;
  b: number;
  mode: string;
}

// Create a custom CMYK mode for culori
const cmyk = (color: any) => {
  // Convert to RGB first
  const rgbColor = rgb(color);
  if (!rgbColor) return null;
  
  const r = rgbColor.r;
  const g = rgbColor.g;
  const b = rgbColor.b;
  
  const k = 1 - Math.max(r, g, b);
  const c = k === 1 ? 0 : (1 - r - k) / (1 - k);
  const m = k === 1 ? 0 : (1 - g - k) / (1 - k);
  const y = k === 1 ? 0 : (1 - b - k) / (1 - k);
  
  return { c, m, y, k, mode: 'cmyk' };
};

// Calculate luminance from RGB values
const luminance = (color: any) => {
  // Convert to RGB first if it's not already
  const rgbColor = typeof color === 'object' && color.mode === 'rgb' ? color : rgb(color);
  
  if (!rgbColor || typeof rgbColor.r !== 'number' || typeof rgbColor.g !== 'number' || typeof rgbColor.b !== 'number') {
    return 0.5;
  }
  
  // WCAG luminance formula
  const r = rgbColor.r <= 0.03928 ? rgbColor.r / 12.92 : Math.pow((rgbColor.r + 0.055) / 1.055, 2.4);
  const g = rgbColor.g <= 0.03928 ? rgbColor.g / 12.92 : Math.pow((rgbColor.g + 0.055) / 1.055, 2.4);
  const b = rgbColor.b <= 0.03928 ? rgbColor.b / 12.92 : Math.pow((rgbColor.b + 0.055) / 1.055, 2.4);
  
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

// Color formats
export type ColorFormat = 'oklch' | 'rgb' | 'hex' | 'cmyk' | 'pantone';

// Color representation in different formats
export interface ColorValues {
  oklch: string; // "oklch(60% 0.15 240)"
  rgb: string;   // "rgb(50, 100, 200)"
  hex: string;   // "#3264C8"
  cmyk?: string; // "cmyk(75%, 50%, 0%, 22%)"
  pantone?: string; // "Pantone 2728 C"
}

export interface ColorStep {
  id: string;
  name: string;
  values: ColorValues;
  accessibility?: any;
  isBaseColor?: boolean;
  color?: ColorValues;
  index?: number;
}

/**
 * Convert a color from one format to another
 */
export function convertColor(color: string, fromFormat: ColorFormat, toFormat: ColorFormat): string {
  try {
    // Parse the color based on the input format
    let parsed;
    
    switch (fromFormat) {
      case 'hex':
        parsed = parse(color);
        break;
      case 'rgb':
        parsed = parse(color);
        break;
      case 'oklch':
        parsed = parse(color);
        break;
      case 'cmyk':
        // Convert CMYK string to object format that culori can parse
        const cmykMatch = color.match(/cmyk\((\d+)%,\s*(\d+)%,\s*(\d+)%,\s*(\d+)%\)/);
        if (cmykMatch) {
          const [_, c, m, y, k] = cmykMatch;
          parsed = {
            mode: 'cmyk',
            c: parseInt(c) / 100,
            m: parseInt(m) / 100,
            y: parseInt(y) / 100,
            k: parseInt(k) / 100
          };
        }
        break;
      case 'pantone':
        // Pantone conversion would require a lookup table
        // For now, return the original color
        return color;
      default:
        return color;
    }
    
    if (!parsed) {
      return color;
    }
    
    // Convert to the target format
    switch (toFormat) {
      case 'hex':
        const hexValue = formatHex(parsed);
        return hexValue || '#000000'; // Fallback to black if undefined
      case 'rgb':
        const rgbColor = rgb(parsed);
        if (!rgbColor) return 'rgb(0, 0, 0)'; // Fallback to black if undefined
        return `rgb(${Math.round(rgbColor.r * 255)}, ${Math.round(rgbColor.g * 255)}, ${Math.round(rgbColor.b * 255)})`;
      case 'oklch':
        const oklchColor = oklch(parsed);
        if (!oklchColor) return 'oklch(0% 0 0)'; // Fallback to black if undefined
        return `oklch(${(oklchColor.l * 100).toFixed(0)}% ${oklchColor.c.toFixed(2)} ${oklchColor.h?.toFixed(0) || '0'})`;
      case 'cmyk':
        const cmykColor = cmyk(parsed);
        if (!cmykColor) return 'cmyk(0%, 0%, 0%, 100%)'; // Fallback to black if undefined
        return `cmyk(${Math.round(cmykColor.c * 100)}%, ${Math.round(cmykColor.m * 100)}%, ${Math.round(cmykColor.y * 100)}%, ${Math.round(cmykColor.k * 100)}%)`;
      case 'pantone':
        // Pantone conversion would require a lookup table
        // For now, return the original color
        return color;
      default:
        return color;
    }
  } catch (error) {
    console.error('Error converting color:', error);
    return color;
  }
}

/**
 * Convert a color to all supported formats
 */
export function convertToAllFormats(color: string): ColorValues {
  // Parse the color
  const parsed = parse(color);
  if (!parsed) {
    return {
      hex: '#000000',
      rgb: 'rgb(0, 0, 0)',
      oklch: 'oklch(0% 0 0)'
    };
  }

  // Convert to all formats
  const hexValue = formatHex(parsed);
  const hex = hexValue || '#000000';
  
  const rgbColor = rgb(parsed);
  const rgbValue = rgbColor ? 
    `rgb(${Math.round(rgbColor.r * 255)}, ${Math.round(rgbColor.g * 255)}, ${Math.round(rgbColor.b * 255)})` : 
    'rgb(0, 0, 0)';
  
  const oklchColor = oklch(parsed);
  const oklchValue = oklchColor ? 
    `oklch(${(oklchColor.l * 100).toFixed(0)}% ${oklchColor.c.toFixed(2)} ${oklchColor.h?.toFixed(0) || '0'})` : 
    'oklch(0% 0 0)';
  
  return {
    hex,
    rgb: rgbValue,
    oklch: oklchValue
  };
}

/**
 * Calculate the relative luminance of a color
 * https://www.w3.org/TR/WCAG20/#relativeluminancedef
 */
export function getLuminance(color: string): number {
  try {
    // Handle empty or invalid color values
    if (!color) {
      return 0.5;
    }
    
    // Make sure we have a valid hex color for parsing
    let colorToUse = color;
    if (!color.startsWith('#') && !color.startsWith('rgb') && !color.startsWith('oklch')) {
      // Default to a mid-gray if the color format is unrecognized
      colorToUse = '#808080';
    }
    
    // Parse the color
    const parsed = parse(colorToUse);
    if (!parsed) {
      return 0.5;
    }
    
    // Convert to RGB and calculate luminance
    const rgbColor = rgb(parsed);
    if (!rgbColor || typeof rgbColor.r !== 'number' || typeof rgbColor.g !== 'number' || typeof rgbColor.b !== 'number') {
      return 0.5;
    }
    
    return luminance(rgbColor);
  } catch (error) {
    // Don't log the error to avoid console spam
    return 0.5; // Default middle value
  }
}

/**
 * Calculate contrast ratio between two colors
 * https://www.w3.org/TR/WCAG20/#contrast-ratiodef
 */
export function calculateContrast(color1: string, color2: string): number {
  try {
    const l1 = getLuminance(color1);
    const l2 = getLuminance(color2);
    
    // Formula: (L1 + 0.05) / (L2 + 0.05) where L1 is the lighter color
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    
    return (lighter + 0.05) / (darker + 0.05);
  } catch (error) {
    console.error('Error calculating contrast:', error);
    return 1; // Default value (no contrast)
  }
}

/**
 * Check if a color meets WCAG accessibility guidelines
 */
export function checkAccessibility(color: string) {
  try {
    // Handle empty or invalid color values
    if (!color) {
      return {
        contrastWithWhite: 1,
        contrastWithBlack: 1,
        wcagAANormal: false,
        wcagAALarge: false,
        wcagAAA: false
      };
    }
    
    const contrastWithWhite = calculateContrast(color, '#FFFFFF');
    const contrastWithBlack = calculateContrast(color, '#000000');
    
    return {
      contrastWithWhite,
      contrastWithBlack,
      wcagAANormal: contrastWithWhite >= 4.5 || contrastWithBlack >= 4.5,
      wcagAALarge: contrastWithWhite >= 3 || contrastWithBlack >= 3,
      wcagAAA: contrastWithWhite >= 7 || contrastWithBlack >= 7
    };
  } catch (error) {
    console.error('Error checking accessibility:', error);
    return {
      contrastWithWhite: 1,
      contrastWithBlack: 1,
      wcagAANormal: false,
      wcagAALarge: false,
      wcagAAA: false
    };
  }
}

interface PaletteOptions {
  lightnessPreset?: 'linear' | 'curved' | 'custom' | 'easeIn' | 'easeOut';
  chromaPreset?: 'constant' | 'decrease' | 'increase' | 'custom';
  lightnessRange?: [number, number]; // Min and max lightness values (0-1)
  chromaRange?: [number, number]; // Min and max chroma values (0-1)
}

/**
 * Generate a palette of colors based on a base color
 * @param baseColor The base color to generate the palette from
 * @param numSteps The number of steps in the palette
 * @param lightness Whether to vary lightness (true) or chroma (false)
 * @param options Advanced options for generating the palette
 */
export function generatePalette(
  baseColor: ColorValues | string, 
  numSteps: number, 
  lightness: boolean = true, 
  options: {
    lightnessPreset?: 'linear' | 'curved' | 'custom' | 'easeIn' | 'easeOut',
    chromaPreset?: 'constant' | 'decrease' | 'increase' | 'custom',
    lightnessRange?: [number, number],
    chromaRange?: [number, number],
    hueShift?: number,
    lockBaseColor?: boolean,
    customLightnessValues?: number[],
    customChromaValues?: number[]
  } = {}
): ColorStep[] {
  try {
    console.log('Color utils - generating palette:', { baseColor, numSteps, lightness });
    
    // Handle invalid input
    if (!baseColor) {
      console.error('Invalid base color:', baseColor);
      throw new Error('Invalid base color');
    }
    
    // Convert string to ColorValues if needed
    let baseColorValues: ColorValues;
    if (typeof baseColor === 'string') {
      baseColorValues = convertToAllFormats(baseColor);
    } else {
      baseColorValues = baseColor;
    }
    
    // Make sure we have an OKLCH value to work with
    if (!baseColorValues.oklch) {
      console.error('Missing OKLCH value in base color:', baseColorValues);
      throw new Error('Missing OKLCH value in base color');
    }
    
    const parsed = parse(baseColorValues.oklch);
    if (!parsed) {
      console.error('Could not parse color:', baseColorValues.oklch);
      throw new Error('Could not parse color');
    }
    
    const oklchBase = oklch(parsed);
    if (!oklchBase) {
      console.error('Could not convert to oklch:', parsed);
      throw new Error('Could not convert to oklch');
    }
    
    // Ensure we have valid values
    if (typeof oklchBase.l !== 'number' || typeof oklchBase.c !== 'number' || typeof oklchBase.h !== 'number') {
      console.error('Invalid oklch values:', oklchBase);
      oklchBase.l = oklchBase.l || 0.5; // Default to 50% lightness
      oklchBase.c = oklchBase.c || 0.1; // Default to 0.1 chroma
      oklchBase.h = oklchBase.h || 240; // Default to blue hue
    }
    
    // Extract options with defaults
    const {
      lightnessPreset = 'linear',
      chromaPreset = 'constant',
      lightnessRange = [0, 1], // Allow full range from 0 (black) to 1 (white)
      chromaRange = [0, 0.4],
      hueShift = 0,
      lockBaseColor = true,
      customLightnessValues = [],
      customChromaValues = []
    } = options;
    
    console.log('Generating palette with options:', { 
      lightnessPreset, 
      chromaPreset, 
      lightnessRange, 
      chromaRange,
      lockBaseColor
    });
    
    // Apply hue shift to the base color if specified
    if (hueShift && oklchBase.h) {
      oklchBase.h = (oklchBase.h + hueShift + 360) % 360;
    }
    
    const steps = [];
    
    // Find the base color index (middle by default)
    const baseIndex = Math.floor(numSteps / 2);
    
    // Function to calculate lightness based on the preset
    const calculateLightness = (index: number, total: number): number => {
      // If we have custom lightness values and enough of them, use those
      if (lightnessPreset === 'custom' && customLightnessValues.length >= total) {
        return customLightnessValues[index];
      }
      
      const normalizedIndex = index / (total - 1); // 0 to 1
      const [minLight, maxLight] = lightnessRange;
      const range = maxLight - minLight;
      
      switch (lightnessPreset) {
        case 'linear':
          // Linear distribution from min to max
          return minLight + (normalizedIndex * range);
          
        case 'curved':
          // Curved distribution (easeInOutCubic) - more steps in middle
          if (normalizedIndex < 0.5) {
            // Ease in
            return minLight + (4 * normalizedIndex * normalizedIndex * normalizedIndex * range / 2);
          } else {
            // Ease out
            return minLight + (1 - Math.pow(-2 * normalizedIndex + 2, 3) / 2 + 1) * range / 2;
          }
          
        case 'easeIn':
          // Ease in only - slow start, fast end
          return minLight + (normalizedIndex * normalizedIndex * normalizedIndex * range);
          
        case 'easeOut':
          // Ease out only - fast start, slow end
          return minLight + ((1 - Math.pow(1 - normalizedIndex, 3)) * range);
          
        default:
          // Custom range with linear distribution as fallback
          return minLight + (normalizedIndex * range);
      }
    };
    
    // Function to calculate chroma based on the preset
    const calculateChroma = (index: number, total: number, lightness: number): number => {
      // If we have custom chroma values and enough of them, use those
      if (chromaPreset === 'custom' && customChromaValues.length >= total) {
        return customChromaValues[index];
      }
      
      const normalizedIndex = index / (total - 1); // 0 to 1
      const [minChroma, maxChroma] = chromaRange;
      const range = maxChroma - minChroma;
      
      // Calculate normalized lightness (0-1) relative to the lightness range
      const normalizedLightness = (lightness - lightnessRange[0]) / (lightnessRange[1] - lightnessRange[0]);
      
      switch (chromaPreset) {
        case 'constant':
          // Constant chroma value (base color's chroma)
          return maxChroma;
          
        case 'decrease':
          // Decrease chroma as lightness increases
          return maxChroma - (normalizedLightness * range);
          
        case 'increase':
          // Increase chroma as lightness increases
          return minChroma + (normalizedLightness * range);
          
        default:
          // Custom range with linear distribution as fallback
          return minChroma + (normalizedIndex * range);
      }
    };
    
    // Generate steps
    for (let i = 0; i < numSteps; i++) {
      // If this is the base color index and we're locking the base color
      const isBaseColorIndex = i === baseIndex;
      
      // Calculate lightness and chroma
      let l, c, h;
      
      if (isBaseColorIndex && lockBaseColor) {
        // Use the original base color values
        l = oklchBase.l;
        c = oklchBase.c;
        h = oklchBase.h;
      } else {
        // Calculate new values based on the distribution
        l = lightness ? calculateLightness(i, numSteps) : oklchBase.l;
        c = lightness ? calculateChroma(i, numSteps, l) : calculateChroma(i, numSteps, oklchBase.l);
        h = oklchBase.h;
      }
      
      // Create the color in all formats
      const oklchColor = `oklch(${Math.round(l * 100)}% ${c.toFixed(3)} ${h.toFixed(0)})`;
      const colorValues = convertToAllFormats(oklchColor);
      
      // Calculate accessibility metrics
      const accessibility = checkAccessibility(colorValues.hex);
      
      // Create the step
      const step: ColorStep = {
        id: uuidv4(),
        name: `${(i + 1) * 100}`,
        values: colorValues,
        accessibility,
        isBaseColor: isBaseColorIndex
      };
      
      steps.push(step);
    }
    
    return steps;
  } catch (error) {
    console.error('Error generating palette:', error);
    throw error;
  }
}
