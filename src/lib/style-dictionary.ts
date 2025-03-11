import StyleDictionary from 'style-dictionary'
import type { TypographyToken } from '@/types/tokens'

// Custom format for Tailwind CSS
(StyleDictionary as any).registerFormat({
  name: 'tailwind/theme',
  formatter: ({ dictionary }: any) => {
    return `module.exports = {
  theme: {
    extend: {
      fontSize: {
        ${dictionary.allTokens
          .filter((token: any) => token.type === 'typography' && token.category === 'fontSize')
          .map((token: any) => `'${token.name}': '${token.value}',`)
          .join('\n        ')}
      },
      fontFamily: {
        ${dictionary.allTokens
          .filter((token: any) => token.type === 'typography' && token.category === 'fontFamily')
          .map((token: any) => `'${token.name}': '${token.value}',`)
          .join('\n        ')}
      }
    }
  }
}`
  }
})

// Custom format for iOS Swift
(StyleDictionary as any).registerFormat({
  name: 'ios/swift',
  formatter: ({ dictionary }: any) => {
    return `import UIKit

struct DesignTokens {
  struct Typography {
    ${dictionary.allTokens
      .filter((token: any) => token.type === 'typography')
      .map((token: any) => {
        if (token.category === 'fontSize') {
          return `static let ${token.name}Size: CGFloat = ${token.value.replace('px', '')}`
        } else if (token.category === 'fontFamily') {
          return `static let ${token.name}Family: String = "${token.value}"`
        }
        return ''
      })
      .filter(Boolean)
      .join('\n    ')}
  }
}`
  }
})

// Custom format for Android XML
(StyleDictionary as any).registerFormat({
  name: 'android/xml',
  formatter: ({ dictionary }: any) => {
    return `<?xml version="1.0" encoding="utf-8"?>
<resources>
  ${dictionary.allTokens
    .filter((token: any) => token.type === 'typography')
    .map((token: any) => {
      if (token.category === 'fontSize') {
        // Convert px to sp for Android
        const value = token.value.replace('px', '').trim()
        return `<dimen name="${token.name}_size">${value}sp</dimen>`
      } else if (token.category === 'fontFamily') {
        return `<string name="${token.name}_family">${token.value}</string>`
      }
      return ''
    })
    .filter(Boolean)
    .join('\n  ')}
</resources>`
  }
})

function getIOSWeight(weight: number): string {
  switch (weight) {
    case 100: return 'UIFont.Weight.ultraLight'
    case 200: return 'UIFont.Weight.thin'
    case 300: return 'UIFont.Weight.light'
    case 400: return 'UIFont.Weight.regular'
    case 500: return 'UIFont.Weight.medium'
    case 600: return 'UIFont.Weight.semibold'
    case 700: return 'UIFont.Weight.bold'
    case 800: return 'UIFont.Weight.heavy'
    case 900: return 'UIFont.Weight.black'
    default: return 'UIFont.Weight.regular'
  }
}

export function generateTokens(tokens: TypographyToken[]) {
  // Use type assertion for StyleDictionary.extend
  const styleDictionary: any = StyleDictionary.extend({
    tokens: tokens as any,
    platforms: {
      web: {
        transformGroup: 'web',
        buildPath: 'build/web/',
        files: [
          {
            destination: 'tokens.css',
            format: 'css/variables',
            options: {
              outputReferences: true
            }
          },
          {
            destination: 'tokens.js',
            format: 'tailwind/theme'
          }
        ]
      },
      ios: {
        transformGroup: 'ios',
        buildPath: 'build/ios/',
        files: [
          {
            destination: 'DesignTokens.swift',
            format: 'ios/swift'
          }
        ]
      },
      android: {
        transformGroup: 'android',
        buildPath: 'build/android/',
        files: [
          {
            destination: 'tokens.xml',
            format: 'android/xml'
          }
        ]
      }
    }
  } as any)

  // Call buildAllPlatforms method
  styleDictionary.buildAllPlatforms()
} 