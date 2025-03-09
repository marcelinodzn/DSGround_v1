"use strict";
// This file shows the code that runs in the Figma environment
// It handles the communication between the UI and the Figma document
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// Show the UI when the plugin is run
figma.showUI(__html__, { width: 450, height: 550 });
// Listen for messages from the UI
figma.ui.onmessage = (msg) => __awaiter(void 0, void 0, void 0, function* () {
    if (msg.type === 'import-typography') {
        try {
            const { typographyData } = msg;
            // Process each platform's typography styles
            for (const platform of typographyData) {
                if (!platform.typeStyles || platform.typeStyles.length === 0)
                    continue;
                // Create a folder for this platform
                const folderName = `${platform.name} Typography`;
                // Process each type style
                for (const style of platform.typeStyles) {
                    // Get the scale value for this style
                    const scaleValue = getScaleValue(platform, style.scaleStep);
                    const fontSize = style.fontSize || (scaleValue ? scaleValue : 16);
                    // Create a text style
                    const textStyle = figma.createTextStyle();
                    // Set the style properties
                    textStyle.name = `${folderName}/${style.name}`;
                    textStyle.description = `Scale step: ${style.scaleStep}`;
                    // Set font properties
                    yield figma.loadFontAsync({ family: style.fontFamily || "Inter", style: getFontStyle(style.fontWeight) });
                    textStyle.fontName = { family: style.fontFamily || "Inter", style: getFontStyle(style.fontWeight) };
                    // Set size properties
                    textStyle.fontSize = fontSize;
                    // Set line height based on unit
                    if (style.lineHeightUnit === 'percent') {
                        textStyle.lineHeight = { unit: 'PERCENT', value: style.lineHeight * 100 };
                    }
                    else {
                        textStyle.lineHeight = { unit: 'PERCENT', value: style.lineHeight * 100 };
                    }
                    // Set letter spacing
                    textStyle.letterSpacing = { unit: 'PERCENT', value: style.letterSpacing * 100 };
                    // Set text case (transform)
                    if (style.textTransform === 'uppercase') {
                        textStyle.textCase = 'UPPER';
                    }
                    else if (style.textTransform === 'lowercase') {
                        textStyle.textCase = 'LOWER';
                    }
                    else if (style.textTransform === 'capitalize') {
                        textStyle.textCase = 'TITLE';
                    }
                    else {
                        textStyle.textCase = 'ORIGINAL';
                    }
                }
            }
            // Notify the UI that the import was successful
            figma.ui.postMessage({ type: 'import-success' });
        }
        catch (error) {
            // Notify the UI that there was an error
            figma.ui.postMessage({
                type: 'import-error',
                message: error instanceof Error ? error.message : 'An unknown error occurred'
            });
        }
    }
    else if (msg.type === 'close') {
        figma.closePlugin();
    }
});
// Helper function to get the font style based on weight
function getFontStyle(weight) {
    if (weight >= 700)
        return 'Bold';
    if (weight >= 600)
        return 'SemiBold';
    if (weight >= 500)
        return 'Medium';
    if (weight >= 400)
        return 'Regular';
    if (weight >= 300)
        return 'Light';
    return 'Regular';
}
// Helper function to get scale value for a step
function getScaleValue(platform, scaleStep) {
    if (!platform.scale)
        return null;
    const { baseSize, ratio, stepsUp, stepsDown } = platform.scale;
    // Parse the step number from the scale step (e.g., "f3" -> 3, "f-2" -> -2)
    const stepMatch = scaleStep.match(/f(-?\d+)/);
    if (!stepMatch)
        return null;
    const step = parseInt(stepMatch[1], 10);
    // Calculate the scale value
    if (step >= 0) {
        return baseSize * Math.pow(ratio, step);
    }
    else {
        return baseSize / Math.pow(ratio, Math.abs(step));
    }
}
