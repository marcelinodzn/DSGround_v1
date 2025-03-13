// Font utility functions for safe font handling and loading

/**
 * Get fallback fonts based on font category
 */
export const getFontCategoryFallback = (category: string): string => {
  switch(category) {
    case 'serif': return 'Georgia, Times, serif';
    case 'monospace': return 'Consolas, "Courier New", monospace';
    case 'display': return 'Impact, fantasy';
    case 'handwriting': return 'cursive';
    default: return 'Arial, Helvetica, sans-serif';
  }
}

/**
 * Safely load a font with proper error handling and timeouts
 * @param fontFamily Font family name
 * @param url Font file URL
 * @param options Font loading options
 * @returns Promise that resolves when font is loaded or rejects with error
 */
export const loadFontSafely = async (
  fontFamily: string,
  url: string,
  options: { 
    weight?: string | number,
    style?: string,
    timeout?: number
  } = {}
): Promise<FontFace | null> => {
  // Default timeout of 5 seconds
  const timeout = options.timeout || 5000;
  
  if (!url || !fontFamily) {
    console.warn(`Cannot load font: missing ${!url ? 'URL' : 'font family'}`);
    return null;
  }
  
  try {
    // Check if URL is valid
    if (!url.startsWith('http') && !url.startsWith('blob:') && !url.startsWith('data:')) {
      console.warn(`Invalid font URL format: ${url}`);
      return null;
    }
    
    // Create the FontFace
    const fontFace = new FontFace(
      fontFamily,
      `url(${url})`,
      {
        weight: options.weight?.toString() || '400',
        style: options.style || 'normal',
      }
    );
    
    // Create a promise that times out
    const timeoutPromise = new Promise<FontFace | null>((_, reject) => {
      setTimeout(() => reject(new Error(`Font loading timed out for ${fontFamily}`)), timeout);
    });
    
    // Race the font loading against the timeout
    const loadedFont = await Promise.race([
      fontFace.load(),
      timeoutPromise
    ]) as FontFace;
    
    // Add the font to the document
    if (loadedFont && document.fonts) {
      document.fonts.add(loadedFont);
      console.log(`Font loaded successfully: ${fontFamily}`);
      return loadedFont;
    }
    
    return null;
  } catch (error) {
    console.error(`Error loading font ${fontFamily}:`, error);
    return null;
  }
}

/**
 * Apply a font to a specific CSS selector with fallbacks
 * @param selector CSS selector
 * @param fontFamily Primary font family
 * @param category Font category for fallbacks
 */
export const applyFontToElements = (
  selector: string,
  fontFamily: string,
  category: string = 'sans-serif'
): void => {
  if (!fontFamily || typeof document === 'undefined') return;
  
  try {
    const fallbackFonts = getFontCategoryFallback(category);
    const elements = document.querySelectorAll(selector);
    
    elements.forEach(element => {
      if (element instanceof HTMLElement) {
        element.style.fontFamily = `"${fontFamily}", ${fallbackFonts}`;
      }
    });
  } catch (error) {
    console.error('Error applying font to elements:', error);
  }
}

// Maintain a registry of loaded fonts to avoid duplicate loading
interface LoadedFont {
  family: string;
  url: string;
  loaded: boolean;
  error?: string;
}

const loadedFonts: Record<string, LoadedFont> = {};

/**
 * Load a font only if it hasn't been loaded already
 */
export const loadFontOnce = async (
  fontFamily: string,
  url: string,
  options: {
    weight?: string | number,
    style?: string,
    force?: boolean
  } = {}
): Promise<boolean> => {
  // If font is already loaded and not forced, return immediately
  const cacheKey = `${fontFamily}:${url}`;
  if (loadedFonts[cacheKey] && loadedFonts[cacheKey].loaded && !options.force) {
    return true;
  }
  
  // Set loading state
  loadedFonts[cacheKey] = {
    family: fontFamily,
    url,
    loaded: false
  };
  
  try {
    const result = await loadFontSafely(fontFamily, url, options);
    loadedFonts[cacheKey].loaded = !!result;
    return !!result;
  } catch (error) {
    loadedFonts[cacheKey].error = error instanceof Error ? error.message : 'Unknown error';
    return false;
  }
}

/**
 * Check if document fonts are available and properly loaded
 */
export const areFontsReady = async (): Promise<boolean> => {
  if (typeof document === 'undefined' || !document.fonts) {
    return false;
  }
  
  try {
    return await document.fonts.ready.then(() => true);
  } catch (error) {
    console.error('Error checking if fonts are ready:', error);
    return false;
  }
} 