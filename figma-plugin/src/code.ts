/// <reference types="@figma/plugin-typings" />

// This file shows the code that runs in the Figma environment
// It handles the communication between the UI and the Figma document

// Define types for our data
interface TypeStyle {
  id: string;
  name: string;
  scaleStep: string;
  fontFamily: string;
  fontWeight: number;
  lineHeight: number;
  lineHeightUnit?: 'multiplier' | 'percent';
  letterSpacing: number;
  opticalSize: number;
  fontSize?: number;
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
}

interface ScaleConfig {
  baseSize: number;
  ratio: number;
  stepsUp: number;
  stepsDown: number;
}

interface Platform {
  id: string;
  name: string;
  scale: ScaleConfig;
  typeStyles: TypeStyle[];
}

interface ImportMessage {
  type: 'import-typography';
  typographyData: Platform[];
}

interface CloseMessage {
  type: 'close';
}

interface ImportSuccessMessage {
  type: 'import-success';
}

interface ImportErrorMessage {
  type: 'import-error';
  message: string;
}

type Message = ImportMessage | CloseMessage;
type ResponseMessage = ImportSuccessMessage | ImportErrorMessage;

// Show the UI when the plugin is run
figma.showUI(__html__, { width: 450, height: 550 });

// Listen for messages from the UI
figma.ui.onmessage = async (msg: Message) => {
  if (msg.type === 'import-typography') {
    try {
      const { typographyData } = msg;
      
      // Debug: Log the received data
      console.log('Received typography data:', typographyData);
      
      // Check if typographyData is an array
      if (!Array.isArray(typographyData)) {
        throw new Error('Typography data is not an array. Please check the JSON format.');
      }
      
      // Process each platform's typography styles
      for (const platform of typographyData) {
        // Debug: Log each platform
        console.log('Processing platform:', platform);
        
        if (!platform || typeof platform !== 'object') {
          console.warn('Invalid platform data:', platform);
          continue;
        }
        
        if (!platform.typeStyles || !Array.isArray(platform.typeStyles) || platform.typeStyles.length === 0) {
          console.warn('No type styles found for platform:', platform.name);
          continue;
        }
        
        // Create a folder for this platform
        const folderName = `${platform.name} Typography`;
        
        // Process each type style
        for (const style of platform.typeStyles) {
          // Debug: Log each style
          console.log('Processing style:', style);
          
          // Get the scale value for this style
          const scaleValue = getScaleValue(platform, style.scaleStep);
          const fontSize = style.fontSize || (scaleValue ? scaleValue : 16);
          
          // Create a text style
          const textStyle = figma.createTextStyle();
          
          // Set the style properties
          textStyle.name = `${folderName}/${style.name}`;
          textStyle.description = `Scale step: ${style.scaleStep}`;
          
          // Set font properties
          await figma.loadFontAsync({ family: style.fontFamily || "Inter", style: getFontStyle(style.fontWeight) });
          textStyle.fontName = { family: style.fontFamily || "Inter", style: getFontStyle(style.fontWeight) };
          
          // Set size properties
          textStyle.fontSize = fontSize;
          
          // Set line height based on unit
          if (style.lineHeightUnit === 'percent') {
            textStyle.lineHeight = { unit: 'PERCENT', value: style.lineHeight * 100 };
          } else {
            textStyle.lineHeight = { unit: 'PERCENT', value: style.lineHeight * 100 };
          }
          
          // Set letter spacing
          textStyle.letterSpacing = { unit: 'PERCENT', value: style.letterSpacing * 100 };
          
          // Set text case (transform)
          if (style.textTransform === 'uppercase') {
            textStyle.textCase = 'UPPER';
          } else if (style.textTransform === 'lowercase') {
            textStyle.textCase = 'LOWER';
          } else if (style.textTransform === 'capitalize') {
            textStyle.textCase = 'TITLE';
          } else {
            textStyle.textCase = 'ORIGINAL';
          }
        }
      }
      
      // Notify the UI that the import was successful
      figma.ui.postMessage({ type: 'import-success' } as ResponseMessage);
    } catch (error: unknown) {
      console.error('Error in import-typography:', error);
      
      // Notify the UI that there was an error
      figma.ui.postMessage({ 
        type: 'import-error', 
        message: error instanceof Error ? error.message : 'An unknown error occurred'
      } as ResponseMessage);
    }
  } else if (msg.type === 'close') {
    figma.closePlugin();
  }
};

// Helper function to get the font style based on weight
function getFontStyle(weight: number): string {
  if (weight >= 700) return 'Bold';
  if (weight >= 600) return 'SemiBold';
  if (weight >= 500) return 'Medium';
  if (weight >= 400) return 'Regular';
  if (weight >= 300) return 'Light';
  return 'Regular';
}

// Helper function to get scale value for a step
function getScaleValue(platform: Platform, scaleStep: string): number | null {
  if (!platform.scale) return null;
  
  const { baseSize, ratio, stepsUp, stepsDown } = platform.scale;
  
  // Parse the step number from the scale step (e.g., "f3" -> 3, "f-2" -> -2)
  const stepMatch = scaleStep.match(/f(-?\d+)/);
  if (!stepMatch) return null;
  
  const step = parseInt(stepMatch[1], 10);
  
  // Calculate the scale value
  if (step >= 0) {
    return baseSize * Math.pow(ratio, step);
  } else {
    return baseSize / Math.pow(ratio, Math.abs(step));
  }
} 