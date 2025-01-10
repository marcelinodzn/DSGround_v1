import { Button } from "@/components/ui/button"

export default function TokensPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Design Tokens</h1>
        <Button>Import Tokens</Button>
      </div>
      
      <div className="grid grid-cols-4 gap-4">
        <div className="p-6 border rounded-lg bg-card shadow-sm hover:shadow-md transition-shadow">
          <h3 className="font-semibold mb-2">Typography</h3>
          <p className="text-sm text-muted-foreground mb-4">Type scale and fonts</p>
          <Button variant="outline" size="sm">Configure</Button>
        </div>
        <div className="p-6 border rounded-lg bg-card shadow-sm hover:shadow-md transition-shadow">
          <h3 className="font-semibold mb-2">Colors</h3>
          <p className="text-sm text-muted-foreground mb-4">Color system and palettes</p>
          <Button variant="outline" size="sm">Configure</Button>
        </div>
        <div className="p-6 border rounded-lg bg-card shadow-sm hover:shadow-md transition-shadow">
          <h3 className="font-semibold mb-2">Spacing</h3>
          <p className="text-sm text-muted-foreground mb-4">Layout and grid system</p>
          <Button variant="outline" size="sm">Configure</Button>
        </div>
        <div className="p-6 border rounded-lg bg-card shadow-sm hover:shadow-md transition-shadow">
          <h3 className="font-semibold mb-2">Surfaces</h3>
          <p className="text-sm text-muted-foreground mb-4">Elevation and materials</p>
          <Button variant="outline" size="sm">Configure</Button>
        </div>
      </div>
    </div>
  )
}
