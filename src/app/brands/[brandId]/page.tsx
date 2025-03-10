'use client'

import { useLayout } from "@/contexts/layout-context"
import { Button } from "@/components/ui/button"
import { Maximize2, Minimize2, Pencil, Copy, Check, Type, Palette, Ruler, Layers, ArrowRight, Trash2 } from 'lucide-react'
import { cn } from "@/lib/utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { useTypographyStore } from "@/store/typography"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useClipboard } from "@/hooks/use-clipboard"
import { generateTokens } from '@/lib/token-generator'
import { StyleDictionarySync } from '@/lib/style-dictionary-sync'
import { GitHubSyncDialog } from "@/components/github-sync-dialog"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { AnimatedTabs } from "@/components/ui/animated-tabs"
import { supabase } from "@/lib/supabase"

// Add new token management interfaces
interface Token {
  name: string
  value: string
  type: 'color' | 'spacing' | 'typography' | string
  description?: string
}

interface TokenCollection {
  core: {
    colors: Token[]
    spacing: Token[]
    typography: Token[]
  }
  semantic: {
    light: Token[]
    dark: Token[]
  }
  themes: Record<string, Token[]>
}

// Add new platform interface and state
interface PlatformSettings {
  id: string
  name: string
  distanceUnit: 'px' | 'rem' | 'pt'
  baseSize: number
  typeUnit: 'px' | 'rem' | 'pt'
}

interface BrandPageProps {
  params: {
    brandId: string
  }
  searchParams?: { [key: string]: string | string[] | undefined }
}

export default function BrandPage({ params, searchParams }: BrandPageProps) {
  const { isFullscreen, setIsFullscreen } = useLayout()
  const [brand, setBrand] = useState<any>(null)
  const [isEditingName, setIsEditingName] = useState(false)
  const [brandName, setBrandName] = useState('')
  const [tokens, setTokens] = useState<TokenCollection>({
    core: {
      colors: [],
      spacing: [],
      typography: []
    },
    semantic: {
      light: [],
      dark: []
    },
    themes: {}
  })
  const [selectedVersion, setSelectedVersion] = useState('main')
  const typographyStore = useTypographyStore.getState() as any
  const platforms = typographyStore.platforms || []
  const currentPlatform = typographyStore.currentPlatform
  const { copy, copied } = useClipboard()
  const [githubConfig, setGithubConfig] = useState({
    owner: '',
    repo: '',
    branch: 'main',
    commitMessage: 'Update typography tokens'
  })
  const router = useRouter()
  const [activeMainTab, setActiveMainTab] = useState('overview')
  const [activeTokenTab, setActiveTokenTab] = useState('css')
  const [activeCoreTokenTab, setActiveCoreTokenTab] = useState('colors')
  const [activeSemanticTokenTab, setActiveSemanticTokenTab] = useState('light')
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings[]>([
    {
      id: 'web',
      name: 'Web',
      distanceUnit: 'rem',
      baseSize: 16,
      typeUnit: 'rem'
    }
  ])

  const mainTabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'foundations', label: 'Foundations' },
    { id: 'tokens', label: 'Tokens' },
    { id: 'settings', label: 'Settings' },
    { id: 'platforms', label: 'Platforms' },
  ]

  const tokenTabs = [
    { id: 'css', label: 'CSS' },
    { id: 'scss', label: 'SCSS' },
    { id: 'tailwind', label: 'Tailwind' },
    { id: 'javascript', label: 'JavaScript' },
    { id: 'web', label: 'Web' },
    { id: 'ios', label: 'iOS' },
    { id: 'android', label: 'Android' }
  ]

  const coreTokenTabs = [
    { 
      id: 'colors', 
      label: 'Colors',
      href: `/brands/${params.brandId}/foundations/colors`
    },
    { 
      id: 'spacing', 
      label: 'Spacing',
      href: `/brands/${params.brandId}/foundations/spacing`
    },
    { 
      id: 'typography', 
      label: 'Typography',
      href: `/brands/${params.brandId}/foundations/typography`
    }
  ]

  const semanticTokenTabs = [
    { id: 'light', label: 'Light Theme' },
    { id: 'dark', label: 'Dark Theme' }
  ]

  const handleTabChange = (href: string) => {
    router.push(href)
  }

  useEffect(() => {
    const fetchBrand = async () => {
      try {
        const { data: brandData, error } = await supabase
          .from('brands')
          .select('*')
          .eq('id', params.brandId)
          .single()

        if (error) {
          console.error('Error fetching brand:', error)
          toast.error('Failed to load brand details')
          return
        }

        if (brandData) {
          setBrand(brandData)
          setBrandName(brandData.name)
        }
      } catch (error) {
        console.error('Error in fetchBrand:', error)
      }
    }

    if (params.brandId) {
      fetchBrand()
    }
  }, [params.brandId])

  const handleNameSave = async () => {
    if (brandName.trim()) {
      try {
        const { error } = await supabase
          .from('brands')
          .update({ name: brandName })
          .eq('id', params.brandId)

        if (error) {
          throw error
        }

        setBrand(prev => ({ ...prev, name: brandName }))
        setIsEditingName(false)
        toast.success('Brand name updated successfully')
      } catch (error) {
        console.error('Error updating brand name:', error)
        toast.error('Failed to update brand name')
      }
    }
  }

  // Function to convert typography scale to tokens
  const generateTypographyTokens = () => {
    const platform = platforms.find(p => p.id === currentPlatform)
    if (!platform) return []

    const tokens: any[] = platform.typeStyles.map(style => {
      const scaleValue = useTypographyStore.getState().getScaleValues(currentPlatform)
        .find(v => v.label === style.scaleStep)

      return {
        id: style.id,
        name: style.name,
        value: {
          fontSize: `${scaleValue?.size || platform.scale.baseSize}px`,
          lineHeight: style.lineHeight.toString(),
          fontWeight: style.fontWeight,
          letterSpacing: `${style.letterSpacing}em`,
          scaleStep: style.scaleStep
        },
        description: `Typography style for ${style.name}`
      }
    })

    return tokens
  }

  // Function to sync with Figma
  const syncToFigma = async () => {
    const typographyTokens = generateTypographyTokens()
    // Convert to Figma variables format
    const figmaVariables = typographyTokens.map(token => ({
      name: `typography/${token.name}`,
      type: "TYPOGRAPHY",
      value: {
        fontSize: parseFloat(token.value.fontSize),
        lineHeight: parseFloat(token.value.lineHeight),
        fontWeight: token.value.fontWeight,
        letterSpacing: parseFloat(token.value.letterSpacing),
      }
    }))

    // TODO: Call Figma API to create/update variables
    console.log('Figma variables:', figmaVariables)
  }

  // Function to generate code
  const generateCode = () => {
    const typographyTokens = generateTypographyTokens()
    
    // Generate CSS
    const css = typographyTokens.map(token => `
.${token.name} {
  font-size: ${token.value.fontSize};
  line-height: ${token.value.lineHeight};
  font-weight: ${token.value.fontWeight};
  letter-spacing: ${token.value.letterSpacing};
}
    `).join('\n')

    // Generate TypeScript
    const ts = `
export const typography = {
  ${typographyTokens.map(token => `
  ${token.name}: {
    fontSize: '${token.value.fontSize}',
    lineHeight: ${token.value.lineHeight},
    fontWeight: ${token.value.fontWeight},
    letterSpacing: '${token.value.letterSpacing}',
  }`).join(',\n')}
} as const
    `

    return { css, ts }
  }

  // Function to generate Style Dictionary config
  const generateStyleDictionary = () => {
    const tokens = generateTypographyTokens()
    
    const styleDictionaryTokens = {
      typography: tokens.reduce((acc, token) => ({
        ...acc,
        [token.name]: {
          value: token.value,
          type: 'typography',
          description: token.description
        }
      }), {})
    }

    const config = {
      source: ['tokens/**/*.json'],
      platforms: {
        css: {
          transformGroup: 'css',
          buildPath: 'build/css/',
          files: [{
            destination: 'variables.css',
            format: 'css/variables'
          }]
        },
        scss: {
          transformGroup: 'scss',
          buildPath: 'build/scss/',
          files: [{
            destination: '_variables.scss',
            format: 'scss/variables'
          }]
        }
      }
    }

    return { tokens: styleDictionaryTokens, config }
  }

  const handleCodePreviewHover = (code: string) => {
    copy(code)
  }

  const handleGitSync = async () => {
    try {
      const githubToken = process.env.NEXT_PUBLIC_GITHUB_TOKEN
      if (!githubToken) {
        throw new Error('GitHub token not configured')
      }

      const styleDictionarySync = new StyleDictionarySync(
        githubToken,
        githubConfig.owner,
        githubConfig.repo,
        githubConfig.branch
      )

      const commitSha = await styleDictionarySync.syncToGithub(
        generateTypographyTokens(),
        githubConfig.commitMessage
      )

      console.log('Successfully synced to GitHub:', commitSha)
      toast.success('Successfully synced tokens to GitHub')
    } catch (error) {
      console.error('Failed to sync with GitHub:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to sync with GitHub')
    }
  }

  // Add platform management functions
  const handleAddPlatform = () => {
    const newPlatform: PlatformSettings = {
      id: crypto.randomUUID(),
      name: 'New Platform',
      distanceUnit: 'px',
      baseSize: 16,
      typeUnit: 'px'
    }
    setPlatformSettings([...platformSettings, newPlatform])
  }

  const handleUpdatePlatform = (id: string, updates: Partial<PlatformSettings>) => {
    setPlatformSettings(platforms => 
      platforms.map(p => p.id === id ? { ...p, ...updates } : p)
    )
  }

  const handleDeletePlatform = (id: string) => {
    setPlatformSettings(platforms => platforms.filter(p => p.id !== id))
  }

  return (
    <div className={cn(
      "h-full flex transition-all duration-300 ease-in-out",
      isFullscreen && "fixed inset-0 bg-background z-50 overflow-y-auto p-6 max-w-[100vw]"
    )}>
      <div className="flex-1 min-w-0 max-w-full">
        <div className={cn(
          "flex items-center justify-between mb-6",
          isFullscreen ? "" : "pt-6 px-6"
        )}>
          <div className="group relative">
            {isEditingName ? (
              <div className="flex items-center gap-2">
                <Input
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  className="text-[30px] font-bold h-auto"
                  autoFocus
                  onBlur={handleNameSave}
                  onKeyDown={(e) => e.key === 'Enter' && handleNameSave()}
                />
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h1 className="text-[30px] font-bold">{brand?.name}</h1>
                <Button
                  variant="ghost"
                  size="icon"
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => setIsEditingName(true)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm">Save Changes</Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="ml-2"
            >
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        <div className="py-8 px-6 max-w-full overflow-x-hidden">
          <div className="space-y-6">
            <AnimatedTabs 
              tabs={mainTabs}
              defaultTab="overview"
              onChange={setActiveMainTab}
              layoutId="main-tabs"
            />

            {activeMainTab === 'overview' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="p-6">
                  <h3 className="text-sm font-medium text-muted-foreground">Components</h3>
                  <p className="text-2xl font-bold mt-2">24</p>
                </Card>
                <Card className="p-6">
                  <h3 className="text-sm font-medium text-muted-foreground">Design Tokens</h3>
                  <p className="text-2xl font-bold mt-2">156</p>
                </Card>
                <Card className="p-6">
                  <h3 className="text-sm font-medium text-muted-foreground">Sub-brands</h3>
                  <p className="text-2xl font-bold mt-2">3</p>
                </Card>
                <Card className="p-6">
                  <h3 className="text-sm font-medium text-muted-foreground">Last Updated</h3>
                  <p className="text-2xl font-bold mt-2">2h ago</p>
                </Card>
              </div>
            )}

            {activeMainTab === 'foundations' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card 
                  className="cursor-pointer hover:bg-accent" 
                  onClick={() => router.push(`/brands/${params.brandId}/foundations/typography`)}
                >
                  <div className="flex items-center justify-between w-full p-6">
                    <div>
                      <h3 className="font-semibold">Typography</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Type scale, styles, and fonts
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </Card>

                <Button 
                  variant="outline" 
                  className="h-auto p-6 flex flex-col items-start justify-between space-y-4 hover:bg-accent text-left"
                  onClick={() => router.push(`/foundations/colors`)}
                >
                  <div className="flex items-center justify-between w-full">
                    <Palette className="h-4 w-4 text-foreground" />
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="w-full">
                    <h3 className="font-semibold text-left">Colors</h3>
                    <p className="text-sm text-muted-foreground mt-1 text-left">
                      Color system and palettes
                    </p>
                  </div>
                </Button>

                <Button 
                  variant="outline" 
                  className="h-auto p-6 flex flex-col items-start justify-between space-y-4 hover:bg-accent text-left"
                  onClick={() => router.push(`/foundations/spacing`)}
                >
                  <div className="flex items-center justify-between w-full">
                    <Ruler className="h-4 w-4 text-foreground" />
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="w-full">
                    <h3 className="font-semibold text-left">Spacing</h3>
                    <p className="text-sm text-muted-foreground mt-1 text-left">
                      Spacing scale and layout grid
                    </p>
                  </div>
                </Button>

                <Button 
                  variant="outline" 
                  className="h-auto p-6 flex flex-col items-start justify-between space-y-4 hover:bg-accent text-left"
                  onClick={() => router.push(`/foundations/surfaces`)}
                >
                  <div className="flex items-center justify-between w-full">
                    <Layers className="h-4 w-4 text-foreground" />
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="w-full">
                    <h3 className="font-semibold text-left">Surfaces</h3>
                    <p className="text-sm text-muted-foreground mt-1 text-left">
                      Elevation and surface styles
                    </p>
                  </div>
                </Button>
              </div>
            )}

            {activeMainTab === 'tokens' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <Select value={selectedVersion} onValueChange={setSelectedVersion}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select branch" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="main">main</SelectItem>
                        <SelectItem value="development">development</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm">New Branch</Button>
                  </div>
                  <Button>Commit Changes</Button>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold">Typography Tokens</h3>
                          <p className="text-sm text-muted-foreground">Generated from typography scale</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Select value={currentPlatform} onValueChange={(value) => useTypographyStore.setState({ currentPlatform: value })}>
                            <SelectTrigger className="w-[180px]">
                              <SelectValue placeholder="Select platform" />
                            </SelectTrigger>
                            <SelectContent>
                              {platforms.map((platform, index) => (
                                <SelectItem key={`brand-platform-${index}`} value={platform.id}>
                                  {platform.name || "Unnamed Platform"}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => syncToFigma()}
                          >
                            Sync to Figma
                          </Button>
                          <GitHubSyncDialog onSync={handleGitSync} />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Name</TableHead>
                              <TableHead>Scale Step</TableHead>
                              <TableHead>Font Size</TableHead>
                              <TableHead>Line Height</TableHead>
                              <TableHead>Font Weight</TableHead>
                              <TableHead>Letter Spacing</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {generateTypographyTokens().map(token => (
                              <TableRow 
                                key={token.id}
                                className="group cursor-pointer hover:bg-muted/50"
                                onClick={() => copy(JSON.stringify(token, null, 2))}
                              >
                                <TableCell className="font-medium">{token.name}</TableCell>
                                <TableCell>{token.value.scaleStep}</TableCell>
                                <TableCell>{token.value.fontSize}</TableCell>
                                <TableCell>{token.value.lineHeight}</TableCell>
                                <TableCell>{token.value.fontWeight}</TableCell>
                                <TableCell className="relative">
                                  {token.value.letterSpacing}
                                  <span className="absolute right-2 opacity-0 group-hover:opacity-100 transition-opacity text-xs text-muted-foreground">
                                    Click to copy
                                  </span>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>

                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium">Generated Code</h4>
                          </div>

                          <div>
                            <AnimatedTabs 
                              tabs={tokenTabs}
                              defaultTab="css"
                              onChange={setActiveTokenTab}
                              layoutId="generated-code-tabs"
                            />
                            {tokenTabs.map((tab) => (
                              <div 
                                key={tab.id} 
                                className={activeTokenTab === tab.id ? 'block' : 'hidden'}
                              >
                                <div className="relative group mt-4">
                                  <pre className="p-4 bg-muted rounded-lg overflow-auto">
                                    <code>{generateTokens(generateTypographyTokens())[tab.id]}</code>
                                  </pre>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => copy(generateTokens(generateTypographyTokens())[tab.id])}
                                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    {copied ? (
                                      <>
                                        <Check className="h-4 w-4 mr-2" />
                                        Copied!
                                      </>
                                    ) : (
                                      <>
                                        <Copy className="h-4 w-4 mr-2" />
                                        Copy code
                                      </>
                                    )}
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {activeMainTab === 'settings' && (
              <div className="space-y-6">
                <Card className="p-6">
                  <h3 className="font-semibold mb-4">Brand Settings</h3>
                  {/* Brand settings form will go here */}
                </Card>
              </div>
            )}

            {activeMainTab === 'platforms' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Platforms</h3>
                  <Button onClick={handleAddPlatform}>Add Platform</Button>
                </div>
                
                <div className="grid gap-6">
                  {platformSettings.map(platform => (
                    <Card key={platform.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <Input
                            value={platform.name}
                            onChange={(e) => handleUpdatePlatform(platform.id, { name: e.target.value })}
                            className="w-[200px] h-8"
                          />
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDeletePlatform(platform.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="space-y-2">
                            <Label>Distance Unit</Label>
                            <Select
                              value={platform.distanceUnit}
                              onValueChange={(value: 'px' | 'rem' | 'pt') => 
                                handleUpdatePlatform(platform.id, { distanceUnit: value })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select unit" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="px">Pixels (px)</SelectItem>
                                <SelectItem value="rem">REM</SelectItem>
                                <SelectItem value="pt">Points (pt)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label>Base Size</Label>
                            <Input
                              type="number"
                              value={platform.baseSize}
                              onChange={(e) => handleUpdatePlatform(platform.id, { 
                                baseSize: parseInt(e.target.value) 
                              })}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Typography Unit</Label>
                            <Select
                              value={platform.typeUnit}
                              onValueChange={(value: 'px' | 'rem' | 'pt') => 
                                handleUpdatePlatform(platform.id, { typeUnit: value })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select unit" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="px">Pixels (px)</SelectItem>
                                <SelectItem value="rem">REM</SelectItem>
                                <SelectItem value="pt">Points (pt)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}