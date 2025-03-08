/**
 * Type declarations for fontkit module
 */
declare module 'fontkit' {
  export function open(buffer: ArrayBuffer): Font;
  export function openSync(buffer: ArrayBuffer): Font;
  
  export interface Font {
    familyName: string;
    styleName: string;
    variationAxes?: any;
    weight?: number;
    width?: number;
    italic?: boolean;
    postscriptName?: string;
    fullName?: string;
    unitsPerEm?: number;
    ascent?: number;
    descent?: number;
    lineGap?: number;
    bbox?: any;
    tables?: Record<string, any>;
    [key: string]: any;
  }
} 