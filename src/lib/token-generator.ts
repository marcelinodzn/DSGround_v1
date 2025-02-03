import type { TypographyToken } from '@/types/tokens'

type Platform = 'css' | 'scss' | 'tailwind' | 'javascript' | 'ios' | 'android' | 'web'

function generateCSSTokens(tokens: TypographyToken[]): string {
  return tokens.map(token => `
.${token.name} {
  font-size: ${token.value.fontSize};
  line-height: ${token.value.lineHeight};
  font-weight: ${token.value.fontWeight};
  letter-spacing: ${token.value.letterSpacing};
}`).join('\n')
}

function generateSCSSTokens(tokens: TypographyToken[]): string {
  return tokens.map(token => `
$typography-${token.name}: (
  font-size: ${token.value.fontSize},
  line-height: ${token.value.lineHeight},
  font-weight: ${token.value.fontWeight},
  letter-spacing: ${token.value.letterSpacing}
);`).join('\n')
}

function generateTailwindTokens(tokens: TypographyToken[]): string {
  return `module.exports = {
  theme: {
    extend: {
      typography: {
        ${tokens.map(token => `'${token.name}': {
          fontSize: '${token.value.fontSize}',
          lineHeight: '${token.value.lineHeight}',
          fontWeight: ${token.value.fontWeight},
          letterSpacing: '${token.value.letterSpacing}',
        }`).join(',\n        ')}
      }
    }
  }
}`
}

function generateJavaScriptTokens(tokens: TypographyToken[]): string {
  return `export const typography = {
  ${tokens.map(token => `${token.name}: {
    fontSize: '${token.value.fontSize}',
    lineHeight: ${token.value.lineHeight},
    fontWeight: ${token.value.fontWeight},
    letterSpacing: '${token.value.letterSpacing}',
  }`).join(',\n  ')}
}`
}

function generateIOSTokens(tokens: TypographyToken[]): string {
  const getIOSWeight = (weight: number): string => {
    const weights: Record<number, string> = {
      100: 'ultraLight',
      200: 'thin',
      300: 'light',
      400: 'regular',
      500: 'medium',
      600: 'semibold',
      700: 'bold',
      800: 'heavy',
      900: 'black'
    }
    return weights[weight] || 'regular'
  }

  return `import UIKit

public enum Typography {
    ${tokens.map(token => `static let ${token.name} = UIFont.systemFont(
        size: ${parseFloat(token.value.fontSize)},
        weight: .${getIOSWeight(token.value.fontWeight)}
    )`).join('\n    ')}
}`
}

function generateAndroidTokens(tokens: TypographyToken[]): string {
  return `<?xml version="1.0" encoding="utf-8"?>
<resources>
    ${tokens.map(token => `<dimen name="typography_${token.name}_size">${token.value.fontSize}</dimen>
    <item name="typography_${token.name}_line_height" format="float">${token.value.lineHeight}</item>
    <item name="typography_${token.name}_letter_spacing" format="float">${token.value.letterSpacing}</item>`).join('\n    ')}
</resources>`
}

function generateWebTokens(tokens: TypographyToken[]): string {
  const properties = tokens.reduce((acc, token) => ({
    ...acc,
    [`typography.${token.name}`]: {
      value: {
        fontSize: token.value.fontSize,
        lineHeight: token.value.lineHeight,
        fontWeight: token.value.fontWeight,
        letterSpacing: token.value.letterSpacing,
      },
      type: 'typography',
      category: 'typography',
      comment: token.description || '',
    }
  }), {})

  return JSON.stringify({
    properties,
    extensions: {
      'org.amzn.style-dictionary.web': {
        transformGroup: 'web',
        buildPath: 'build/web/',
        files: [{
          destination: 'tokens.json',
          format: 'json/nested'
        }]
      }
    }
  }, null, 2)
}

export function generateTokens(tokens: TypographyToken[]) {
  return {
    css: generateCSSTokens(tokens),
    scss: generateSCSSTokens(tokens),
    tailwind: generateTailwindTokens(tokens),
    javascript: generateJavaScriptTokens(tokens),
    ios: generateIOSTokens(tokens),
    android: generateAndroidTokens(tokens),
    web: generateWebTokens(tokens)
  }
} 