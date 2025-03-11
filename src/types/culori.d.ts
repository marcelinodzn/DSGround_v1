declare module 'culori' {
  export type ColorMode = 'rgb' | 'oklch' | 'hsl' | 'hsv' | 'lab' | 'lch' | 'cmyk' | string;

  export interface Color {
    mode: ColorMode;
    [key: string]: any;
  }

  export interface RgbColor extends Color {
    mode: 'rgb';
    r: number;
    g: number;
    b: number;
    alpha?: number;
  }

  export interface OklchColor extends Color {
    mode: 'oklch';
    l: number;
    c: number;
    h: number;
    alpha?: number;
  }

  export function parse(color: string): Color | undefined;
  export function formatHex(color: Color | string | undefined): string | undefined;
  
  export function rgb(color: Color | string | undefined): RgbColor | undefined;
  export function oklch(color: Color | string | undefined): OklchColor | undefined;
} 