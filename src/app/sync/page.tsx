import { Button } from "@/components/ui/button"

export default function SyncPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Sync Settings</h1>
        <Button>Connect Service</Button>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="p-6 border rounded-lg bg-card shadow-sm hover:shadow-md transition-shadow">
          <h3 className="font-semibold mb-2">Figma</h3>
          <p className="text-sm text-muted-foreground mb-4">Connect to Figma to sync design tokens</p>
          <Button variant="outline" size="sm">Configure</Button>
        </div>
        <div className="p-6 border rounded-lg bg-card shadow-sm hover:shadow-md transition-shadow">
          <h3 className="font-semibold mb-2">GitHub</h3>
          <p className="text-sm text-muted-foreground mb-4">Sync tokens with your codebase</p>
          <Button variant="outline" size="sm">Configure</Button>
        </div>
      </div>
    </div>
  )
}
