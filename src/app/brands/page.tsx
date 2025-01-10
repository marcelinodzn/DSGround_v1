import { Button } from "@/components/ui/button"

export default function BrandsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Brands</h1>
        <Button>Create Brand</Button>
      </div>
      
      <div className="grid grid-cols-3 gap-4">
        <div className="p-6 border rounded-lg bg-card shadow-sm hover:shadow-md transition-shadow">
          <h3 className="font-semibold mb-2">Default Brand</h3>
          <p className="text-sm text-muted-foreground mb-4">Main design system configuration</p>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm">Edit</Button>
            <Button variant="ghost" size="sm">View Tokens</Button>
          </div>
        </div>
      </div>
    </div>
  )
}
