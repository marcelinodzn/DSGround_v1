import type { TypographyToken } from '@/types/tokens'
import { Octokit } from '@octokit/rest'

interface StyleDictionaryConfig {
  source: string[]
  platforms: {
    [key: string]: {
      transformGroup: string
      buildPath: string
      files: Array<{
        destination: string
        format: string
      }>
    }
  }
}

export class StyleDictionarySync {
  private octokit: Octokit
  private owner: string
  private repo: string
  private branch: string

  constructor(githubToken: string, owner: string, repo: string, branch = 'main') {
    this.octokit = new Octokit({ auth: githubToken })
    this.owner = owner
    this.repo = repo
    this.branch = branch
  }

  private generateTokenJson(tokens: TypographyToken[]) {
    // Group tokens by platform
    const tokensByPlatform = tokens.reduce((acc, token) => {
      const platform = token.value.platform || 'web' // Default to web if no platform specified
      if (!acc[platform]) {
        acc[platform] = {}
      }
      
      if (!acc[platform].typography) {
        acc[platform].typography = {}
      }

      acc[platform].typography[token.name] = {
        value: {
          fontSize: token.value.fontSize,
          lineHeight: token.value.lineHeight,
          fontWeight: token.value.fontWeight,
          letterSpacing: token.value.letterSpacing,
          scaleStep: token.value.scaleStep
        },
        type: 'typography',
        description: token.description || ''
      }
      
      return acc
    }, {} as Record<string, any>)

    return tokensByPlatform
  }

  private generateConfig(tokens: TypographyToken[]): StyleDictionaryConfig {
    // Get unique platforms from tokens
    const platforms = [...new Set(tokens.map(t => t.value.platform || 'web'))]

    return {
      source: ['tokens/**/*.json'],
      platforms: platforms.reduce((acc, platform) => ({
        ...acc,
        [`${platform}/css`]: {
          transformGroup: 'web',
          buildPath: `build/${platform}/css/`,
          files: [{
            destination: 'variables.css',
            format: 'css/variables',
            filter: (token) => token.platform === platform
          }]
        },
        [`${platform}/scss`]: {
          transformGroup: 'scss',
          buildPath: `build/${platform}/scss/`,
          files: [{
            destination: '_variables.scss',
            format: 'scss/variables',
            filter: (token) => token.platform === platform
          }]
        },
        [`${platform}/js`]: {
          transformGroup: 'js',
          buildPath: `build/${platform}/js/`,
          files: [{
            destination: 'tokens.js',
            format: 'javascript/module',
            filter: (token) => token.platform === platform
          }]
        }
      }), {})
    }
  }

  private async initializeRepository() {
    try {
      // Try to get the default branch
      const { data: repo } = await this.octokit.repos.get({
        owner: this.owner,
        repo: this.repo
      })
      this.branch = repo.default_branch

      // Check if tokens directory exists
      try {
        await this.octokit.repos.getContent({
          owner: this.owner,
          repo: this.repo,
          path: 'tokens'
        })
      } catch {
        // Create initial commit with README if repository is empty
        const { data: readme } = await this.octokit.repos.createOrUpdateFileContents({
          owner: this.owner,
          repo: this.repo,
          path: 'tokens/README.md',
          message: 'Initialize tokens directory',
          content: Buffer.from('# Design Tokens\nThis directory contains design tokens.').toString('base64')
        })
        console.log('✨ Initialized tokens directory')
      }

      return true
    } catch (error) {
      console.error('Failed to initialize repository:', error)
      return false
    }
  }

  private async createRepositoryIfNeeded() {
    try {
      // Try to get the repository
      await this.octokit.repos.get({
        owner: this.owner,
        repo: this.repo
      })
    } catch {
      // Repository doesn't exist, create it
      await this.octokit.repos.createForAuthenticatedUser({
        name: this.repo,
        description: 'Design System Tokens',
        auto_init: true, // Initialize with README
        private: false
      })
      console.log('✨ Created new repository')
      
      // Wait a moment for GitHub to initialize the repository
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
  }

  async syncToGithub(tokens: TypographyToken[], commitMessage: string) {
    try {
      console.log('🚀 Starting GitHub sync...')
      
      // Create repository if it doesn't exist
      await this.createRepositoryIfNeeded()
      
      // Initialize repository structure
      const initialized = await this.initializeRepository()
      if (!initialized) {
        throw new Error('Failed to initialize repository')
      }

      console.log('🚀 Starting GitHub sync with config:', {
        owner: this.owner,
        repo: this.repo,
        branch: this.branch,
        tokenCount: tokens.length
      })

      // Check if repo exists and is accessible
      try {
        const { data: repo } = await this.octokit.repos.get({
          owner: this.owner,
          repo: this.repo
        })
        console.log('✅ Repository found:', repo.full_name)
      } catch (error) {
        console.error('❌ Repository error:', error)
        throw new Error(`Repository ${this.owner}/${this.repo} not found or not accessible. Make sure it exists and your token has access.`)
      }

      // Generate files
      const tokenJson = this.generateTokenJson(tokens)
      const configJson = this.generateConfig(tokens)
      
      console.log('📦 Generated token content:', JSON.stringify(tokenJson, null, 2))

      try {
        // Get default branch if not specified
        if (!this.branch) {
          const { data: repoData } = await this.octokit.repos.get({
            owner: this.owner,
            repo: this.repo
          })
          this.branch = repoData.default_branch
          console.log('ℹ️ Using default branch:', this.branch)
        }

        // Get the current commit SHA
        const { data: ref } = await this.octokit.git.getRef({
          owner: this.owner,
          repo: this.repo,
          ref: `heads/${this.branch}`
        })
        console.log('�� Got ref SHA:', ref.object.sha)

        // Create blobs for each platform
        const platforms = Object.keys(tokenJson)
        const blobPromises = platforms.map(platform => 
          this.octokit.git.createBlob({
            owner: this.owner,
            repo: this.repo,
            content: Buffer.from(JSON.stringify(tokenJson[platform], null, 2)).toString('base64'),
            encoding: 'base64'
          })
        )

        const configBlob = await this.octokit.git.createBlob({
          owner: this.owner,
          repo: this.repo,
          content: Buffer.from(JSON.stringify(configJson, null, 2)).toString('base64'),
          encoding: 'base64'
        })

        const blobs = await Promise.all(blobPromises)

        // Create tree with platform-specific directories
        const treeItems = platforms.map((platform, index) => ({
          path: `tokens/${platform}/typography.json`,
          mode: '100644',
          type: 'blob',
          sha: blobs[index].data.sha
        }))

        // Add config file to tree
        treeItems.push({
          path: 'style-dictionary.config.json',
          mode: '100644',
          type: 'blob',
          sha: configBlob.data.sha
        })

        const { data: tree } = await this.octokit.git.createTree({
          owner: this.owner,
          repo: this.repo,
          base_tree: ref.object.sha,
          tree: treeItems
        })
        console.log('🌳 Created tree:', tree.sha)

        // Create commit
        const { data: commit } = await this.octokit.git.createCommit({
          owner: this.owner,
          repo: this.repo,
          message: commitMessage,
          tree: tree.sha,
          parents: [ref.object.sha]
        })
        console.log('✨ Created commit:', commit.sha)

        // Update branch reference
        await this.octokit.git.updateRef({
          owner: this.owner,
          repo: this.repo,
          ref: `heads/${this.branch}`,
          sha: commit.sha
        })
        console.log('🎉 Successfully updated branch reference')

        // Return the URL to view the changes
        const repoUrl = `https://github.com/${this.owner}/${this.repo}/tree/${this.branch}`
        console.log('🔗 View changes at:', repoUrl)
        return {
          commitSha: commit.sha,
          url: repoUrl
        }
      } catch (error) {
        console.error('❌ GitHub API error:', error)
        if (error.status === 404) {
          throw new Error(`Branch '${this.branch}' not found. Please make sure it exists.`)
        }
        throw error
      }
    } catch (error) {
      console.error('❌ Sync failed:', error)
      throw error
    }
  }
} 