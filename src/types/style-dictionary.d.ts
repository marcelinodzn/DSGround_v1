declare module 'style-dictionary' {
  interface Dictionary {
    allTokens: Array<{
      name: string
      value: any
      original: any
      attributes: Record<string, any>
    }>
  }

  interface StyleDictionaryConfig {
    source: string[]
    platforms?: Record<string, {
      transformGroup?: string
      buildPath?: string
      files?: Array<{
        destination: string
        format: string
      }>
    }>
  }

  class StyleDictionary {
    static extend(config: Partial<StyleDictionaryConfig>): StyleDictionary
    exportPlatform(platform: string): Record<string, any>
    registerFormat(format: {
      name: string
      formatter: (dictionary: { dictionary: Dictionary }) => string
    }): void
  }

  export = StyleDictionary
} 