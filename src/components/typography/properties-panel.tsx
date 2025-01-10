import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTypographyStore, ScaleMethod } from "@/store/typography"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown } from "lucide-react"
import { Separator } from "@/components/ui/separator"

const typographyScales = [
  { name: "Major Second", ratio: 1.125 },
  { name: "Major Third", ratio: 1.25 },
  { name: "Perfect Fourth", ratio: 1.333 },
  { name: "Perfect Fifth", ratio: 1.5 },
  { name: "Golden Ratio", ratio: 1.618 },
]

export function PropertiesPanel() {
  const { scaleMethod, scale, accessibility, setScaleMethod, setScale, setAccessibility } = useTypographyStore()

  return (
    <div className="h-full">
      <Collapsible defaultOpen>
        <CollapsibleTrigger className="flex w-full items-center justify-between px-4 py-4 text-sm font-semibold">
          <span>Scale Method</span>
          <ChevronDown className="h-4 w-4" />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-4 py-4">
            <RadioGroup
              value={scaleMethod}
              onValueChange={(value) => setScaleMethod(value as ScaleMethod)}
              className="grid grid-cols-3 gap-4"
            >
              <div>
                <RadioGroupItem value="modular" id="modular" className="peer sr-only" />
                <Label
                  htmlFor="modular"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-transparent p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
                  <div className="mt-2 text-xs">Modular</div>
                </Label>
              </div>
              <div>
                <RadioGroupItem value="distance" id="distance" className="peer sr-only" />
                <Label
                  htmlFor="distance"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-transparent p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><circle cx="7" cy="17" r="1"/><circle cx="17" cy="7" r="1"/><path d="M8 17 17 8"/></svg>
                  <div className="mt-2 text-xs">Distance</div>
                </Label>
              </div>
              <div>
                <RadioGroupItem value="ai" id="ai" className="peer sr-only" />
                <Label
                  htmlFor="ai"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-transparent p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20"/><path d="M2 12h20"/><path d="m12 2 4 4"/><path d="m12 2-4 4"/><path d="m12 22 4-4"/><path d="m12 22-4-4"/><path d="m2 12 4 4"/><path d="m2 12 4-4"/><path d="m22 12-4 4"/><path d="m22 12-4-4"/></svg>
                  <div className="mt-2 text-xs">AI</div>
                </Label>
              </div>
            </RadioGroup>

            {scaleMethod === 'modular' && (
              <div className="mt-4 space-y-4">
                <div>
                  <Label className="text-xs">Scale Type</Label>
                  <Select
                    value={scale.type.toLowerCase()}
                    onValueChange={(value) => {
                      const selectedScale = typographyScales.find(
                        (s) => s.name.toLowerCase() === value
                      )
                      if (selectedScale) {
                        setScale(selectedScale.name, selectedScale.ratio, scale.baseSize)
                      }
                    }}
                  >
                    <SelectTrigger className="text-xs h-8">
                      <SelectValue placeholder="Select scale type" />
                    </SelectTrigger>
                    <SelectContent>
                      {typographyScales.map((s) => (
                        <SelectItem key={s.name.toLowerCase()} value={s.name.toLowerCase()} className="text-xs">
                          {s.name} ({s.ratio})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs">Base Size (px)</Label>
                  <Input
                    type="number"
                    value={scale.baseSize}
                    onChange={(e) => {
                      setScale(scale.type, scale.ratio, parseInt(e.target.value))
                    }}
                    className="text-xs h-8"
                  />
                </div>
              </div>
            )}

            {scaleMethod === 'distance' && (
              <div className="mt-4">
                <Label className="text-xs">Viewing Distance (m)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={accessibility.viewingDistance}
                  onChange={(e) => {
                    setAccessibility({
                      ...accessibility,
                      viewingDistance: Number(e.target.value),
                    })
                  }}
                  className="text-xs h-8"
                />
                <div className="mt-2 space-y-2 text-xs text-muted-foreground">
                  <p>Headlines: {(0.00582 * accessibility.viewingDistance * 100).toFixed(2)}cm cap height</p>
                  <p>Body Text: {(0.00465 * accessibility.viewingDistance * 100).toFixed(2)}cm cap height</p>
                </div>
              </div>
            )}

            {scaleMethod === 'ai' && (
              <div className="mt-4 space-y-4">
                <div>
                  <Label className="text-xs">Content Type</Label>
                  <Select defaultValue="article">
                    <SelectTrigger className="text-xs h-8">
                      <SelectValue placeholder="Select content type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="article" className="text-xs">Article</SelectItem>
                      <SelectItem value="marketing" className="text-xs">Marketing</SelectItem>
                      <SelectItem value="documentation" className="text-xs">Documentation</SelectItem>
                      <SelectItem value="dashboard" className="text-xs">Dashboard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Brand Personality</Label>
                  <Select defaultValue="professional">
                    <SelectTrigger className="text-xs h-8">
                      <SelectValue placeholder="Select brand personality" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional" className="text-xs">Professional</SelectItem>
                      <SelectItem value="friendly" className="text-xs">Friendly</SelectItem>
                      <SelectItem value="bold" className="text-xs">Bold</SelectItem>
                      <SelectItem value="minimal" className="text-xs">Minimal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button className="w-full text-xs">Generate Scale</Button>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>

      <Collapsible>
        <CollapsibleTrigger className="flex w-full items-center justify-between px-4 py-4 text-sm font-semibold border-t">
          <span>Accessibility</span>
          <ChevronDown className="h-4 w-4" />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-4 py-4 space-y-4">
            <div>
              <Label className="text-xs">Minimum Contrast (Body)</Label>
              <Input
                type="number"
                step="0.1"
                value={accessibility.minContrastBody}
                onChange={(e) => {
                  setAccessibility({
                    ...accessibility,
                    minContrastBody: Number(e.target.value),
                  })
                }}
                className="text-xs h-8"
              />
              <p className="text-xs text-muted-foreground mt-1">WCAG 2.1 Level AA requires 4.5:1</p>
            </div>
            <div>
              <Label className="text-xs">Minimum Contrast (Large)</Label>
              <Input
                type="number"
                step="0.1"
                value={accessibility.minContrastLarge}
                onChange={(e) => {
                  setAccessibility({
                    ...accessibility,
                    minContrastLarge: Number(e.target.value),
                  })
                }}
                className="text-xs h-8"
              />
              <p className="text-xs text-muted-foreground mt-1">WCAG 2.1 Level AA requires 3:1</p>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      <div className="px-4 py-4 mt-auto">
        <div className="flex space-x-4">
          <Button variant="outline" className="flex-1 text-xs">Reset</Button>
          <Button className="flex-1 text-xs">Save</Button>
        </div>
      </div>
    </div>
  )
}
