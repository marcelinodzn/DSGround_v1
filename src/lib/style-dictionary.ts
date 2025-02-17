import StyleDictionary from 'style-dictionary'
import type { TypographyToken } from '@/types/tokens'

// Custom format for Tailwind CSS
StyleDictionary.registerFormat({
  name: 'tailwind/theme',
  formatter: ({ dictionary }) => {
    return `module.exports = {
  theme: {
    extend: {
      typography: {
        ${dictionary.allTokens.map(token => `'${token.name}': {
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
})

// Custom format for iOS
StyleDictionary.registerFormat({
  name: 'ios/swift',
  formatter: ({ dictionary }) => {
    return `import UIKit

public enum Typography {
    ${dictionary.allTokens.map(token => `static let ${token.name} = UIFont.systemFont(
        size: ${parseFloat(token.value.fontSize)},
        weight: .${getIOSWeight(token.value.fontWeight)}
    )`).join('\n    ')}
}`
  }
})

// Custom format for Android
StyleDictionary.registerFormat({
  name: 'android/xml',
  formatter: ({ dictionary }) => {
    return `<?xml version="1.0" encoding="utf-8"?>
<resources>
    ${dictionary.allTokens.map(token => `<dimen name="typography_${token.name}_size">${token.value.fontSize}</dimen>
    <item name="typography_${token.name}_line_height" format="float">${token.value.lineHeight}</item>
    <item name="typography_${token.name}_letter_spacing" format="float">${token.value.letterSpacing}</item>`).join('\n    ')}
</resources>`
  }
})

function getIOSWeight(weight: number): string {
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

export function generateTokens(tokens: TypographyToken[]) {
  const styleDictionary = StyleDictionary.extend({
    tokens: {
      typography: tokens.reduce((acc, token) => ({
        ...acc,
        [token.name]: {
          value: token.value,
          type: 'typography'
        }
      }), {})
    },
    platforms: {
      css: {
        transformGroup: 'css',
        buildPath: 'build/css/',
        files: [{
          destination: 'typography.css',
          format: 'css/variables'
        }]
      },
      scss: {
        transformGroup: 'scss',
        buildPath: 'build/scss/',
        files: [{
          destination: '_typography.scss',
          format: 'scss/variables'
        }]
      },
      tailwind: {
        transformGroup: 'js',
        buildPath: 'build/tailwind/',
        files: [{
          destination: 'typography.js',
          format: 'tailwind/theme'
        }]
      },
      javascript: {
        transformGroup: 'js',
        buildPath: 'build/js/',
        files: [{
          destination: 'typography.js',
          format: 'javascript/module'
        }]
      },
      ios: {
        transformGroup: 'ios',
        buildPath: 'build/ios/',
        files: [{
          destination: 'Typography.swift',
          format: 'ios/swift'
        }]
      },
      android: {
        transformGroup: 'android',
        buildPath: 'build/android/',
        files: [{
          destination: 'typography.xml',
          format: 'android/xml'
        }]
      }
    }
  })

  return styleDictionary.exportPlatform('all')
} 