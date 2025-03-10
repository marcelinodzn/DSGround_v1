import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { AnimatedTabs } from "@/components/ui/animated-tabs"

interface GitHubSyncDialogProps {
  onSync: (config: {
    owner: string
    repo: string
    branch: string
    commitMessage: string
  }) => Promise<{ commitSha: string; url: string }>
}

export function GitHubSyncDialog({ onSync }: GitHubSyncDialogProps) {
  const [config, setConfig] = useState({
    owner: '',
    repo: '',
    branch: 'main',
    commitMessage: 'Update typography tokens'
  })
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const validateRepo = async (owner: string, repo: string) => {
    try {
      const token = process.env.NEXT_PUBLIC_GITHUB_TOKEN
      const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      })
      
      if (!response.ok) {
        throw new Error('Repository not found')
      }

      const data = await response.json()
      if (!data.permissions?.push) {
        throw new Error('No write access to repository')
      }

      return true
    } catch (error) {
      console.error('Validation error:', error)
      return false
    }
  }

  const handleSync = async () => {
    try {
      setIsLoading(true)

      // Validate repository exists before attempting sync
      const repoExists = await validateRepo(config.owner, config.repo)
      if (!repoExists) {
        toast.error(
          <div className="flex flex-col gap-2">
            <p>Repository not found. Please make sure:</p>
            <ul className="list-disc pl-4">
              <li>The repository exists at github.com/{config.owner}/{config.repo}</li>
              <li>The repository is public or you have access</li>
              <li>Your GitHub token has the correct permissions</li>
            </ul>
            <a 
              href={`https://github.com/new`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline mt-2"
            >
              Create new repository
            </a>
          </div>,
          { 
            duration: 10000,
            dismissible: true
          }
        )
        return
      }

      const result = await onSync(config)
      
      if (result) {
        toast.success(
          <div className="flex flex-col gap-2">
            <p>Successfully synced to GitHub!</p>
            <a 
              href={result.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary underline"
            >
              View changes
            </a>
          </div>,
          { 
            duration: 10000,
            dismissible: true
          }
        )
        
        setTimeout(() => setIsOpen(false), 3000)
      }
    } catch (error) {
      console.error('Sync error:', error)
      toast.error(
        <div className="flex flex-col gap-2">
          <p>Failed to sync with GitHub. Please check:</p>
          <ul className="list-disc pl-4">
            <li>Your GitHub token is valid</li>
            <li>The repository name is correct</li>
            <li>The branch exists</li>
          </ul>
          <pre className="text-xs mt-2 p-2 bg-muted rounded">
            {error instanceof Error ? error.message : 'Unknown error'}
          </pre>
        </div>,
        { 
          duration: 10000,
          dismissible: true
        }
      )
    } finally {
      setIsLoading(false)
    }
  }

  const platformTabs = [
    { id: 'web', label: 'Web' },
    { id: 'ios', label: 'iOS' },
    { id: 'android', label: 'Android' },
    { id: 'all', label: 'All Platforms' }
  ]

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Sync to GitHub
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sync to GitHub</DialogTitle>
          <DialogDescription>
            Configure your GitHub repository settings and permissions.
            <div className="mt-2 text-sm">
              Required permissions:
              <ul className="list-disc pl-4 mt-1">
                <li>repo (Full control of private repositories)</li>
                <li>workflow (Update GitHub Action workflows)</li>
              </ul>
            </div>
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Repository Owner</Label>
            <Input 
              placeholder="e.g., your-username" 
              value={config.owner}
              onChange={(e) => setConfig(prev => ({ ...prev, owner: e.target.value }))}
            />
            {config.owner && (
              <a 
                href={`https://github.com/${config.owner}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-muted-foreground hover:underline"
              >
                View profile
              </a>
            )}
          </div>
          <div className="space-y-2">
            <Label>Repository Name</Label>
            <Input 
              placeholder="e.g., design-tokens" 
              value={config.repo}
              onChange={(e) => setConfig(prev => ({ ...prev, repo: e.target.value }))}
            />
            {config.owner && config.repo && (
              <a 
                href={`https://github.com/${config.owner}/${config.repo}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-muted-foreground hover:underline"
              >
                View repository
              </a>
            )}
          </div>
          <div className="space-y-2">
            <Label>Branch</Label>
            <Input 
              placeholder="e.g., main" 
              value={config.branch}
              onChange={(e) => setConfig(prev => ({ ...prev, branch: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label>Commit Message</Label>
            <Input 
              placeholder="Update typography tokens" 
              value={config.commitMessage}
              onChange={(e) => setConfig(prev => ({ ...prev, commitMessage: e.target.value }))}
            />
          </div>
          <AnimatedTabs 
            tabs={platformTabs}
            defaultTab="web"
            layoutId="github-sync-tabs"
            onChange={(platform) => {
              // Platform change logic
            }}
          />
          <Button 
            className="w-full" 
            onClick={handleSync}
            disabled={!config.owner || !config.repo || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Syncing...
              </>
            ) : (
              'Sync with GitHub'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 