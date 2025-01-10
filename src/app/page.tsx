import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <div className="grid gap-8">
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Master Brands</h2>
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
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Design Foundations</h2>
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
      </section>
    </div>
  )
}
