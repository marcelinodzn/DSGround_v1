import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTypographyStore, ScaleMethod } from "@/store/typography"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown } from "lucide-react"

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
    <div className="space-y-4 p-4">
      <Collapsible defaultOpen>
        <CollapsibleTrigger className="flex w-full items-center justify-between py-2 text-lg font-semibold">
          <span>Scale Method</span>
          <ChevronDown className="h-5 w-5" />
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-2 pb-4">
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
                <div className="mt-2 text-sm">Modular</div>
              </Label>
            </div>
            <div>
              <RadioGroupItem value="distance" id="distance" className="peer sr-only" />
              <Label
                htmlFor="distance"
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-transparent p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><circle cx="7" cy="17" r="1"/><circle cx="17" cy="7" r="1"/><path d="M8 17 17 8"/></svg>
                <div className="mt-2 text-sm">Distance</div>
              </Label>
            </div>
            <div>
              <RadioGroupItem value="ai" id="ai" className="peer sr-only" />
              <Label
                htmlFor="ai"
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-transparent p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20"/><path d="M2 12h20"/><path d="m12 2 4 4"/><path d="m12 2-4 4"/><path d="m12 22 4-4"/><path d="m12 22-4-4"/><path d="m2 12 4 4"/><path d="m2 12 4-4"/><path d="m22 12-4 4"/><path d="m22 12-4-4"/></svg>
                <div className="mt-2 text-sm">AI</div>
              </Label>
            </div>
          </RadioGroup>
        </CollapsibleContent>
      </Collapsible>

      {scaleMethod === 'modular' && (
        <Collapsible defaultOpen>
          <CollapsibleTrigger className="flex w-full items-center justify-between py-2 text-lg font-semibold">
            <span>Modular Scale</span>
            <ChevronDown className="h-5 w-5" />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 pt-2 pb-4">
            <div>
              <Label className="text-sm">Scale Type</Label>
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
                <SelectTrigger>
                  <SelectValue placeholder="Select scale type" />
                </SelectTrigger>
                <SelectContent>
                  {typographyScales.map((scale) => (
                    <SelectItem key={scale.name} value={scale.name.toLowerCase()}>
                      {scale.name} ({scale.ratio})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm">Base Size (px)</Label>
              <Input
                type="number"
                value={scale.baseSize}
                onChange={(e) => {
                  setScale(scale.type, scale.ratio, Number(e.target.value))
                }}
              />
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

      {scaleMethod === 'distance' && (
        <Collapsible defaultOpen>
          <CollapsibleTrigger className="flex w-full items-center justify-between py-2 text-lg font-semibold">
            <span>Distance Settings</span>
            <ChevronDown className="h-5 w-5" />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 pt-2 pb-4">
            <div>
              <Label className="text-sm">Viewing Distance (m)</Label>
              <Input
                type="number"
                step="0.1"
                value={accessibility.viewingDistance}
                onChange={(e) =>
                  setAccessibility({
                    viewingDistance: Number(e.target.value),
                  })
                }
              />
              <div className="mt-2 space-y-2 text-sm text-muted-foreground">
                <p>Headlines: {(0.00582 * accessibility.viewingDistance * 100).toFixed(2)}cm cap height</p>
                <p>Body Text: {(0.00465 * accessibility.viewingDistance * 100).toFixed(2)}cm cap height</p>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

      {scaleMethod === 'ai' && (
        <Collapsible defaultOpen>
          <CollapsibleTrigger className="flex w-full items-center justify-between py-2 text-lg font-semibold">
            <span>AI Settings</span>
            <ChevronDown className="h-5 w-5" />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 pt-2 pb-4">
            <div>
              <Label className="text-sm">Content Type</Label>
              <Select defaultValue="article">
                <SelectTrigger>
                  <SelectValue placeholder="Select content type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="article">Article</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="documentation">Documentation</SelectItem>
                  <SelectItem value="dashboard">Dashboard</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm">Brand Personality</Label>
              <Select defaultValue="professional">
                <SelectTrigger>
                  <SelectValue placeholder="Select brand personality" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="friendly">Friendly</SelectItem>
                  <SelectItem value="bold">Bold</SelectItem>
                  <SelectItem value="minimal">Minimal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full">Generate Scale</Button>
          </CollapsibleContent>
        </Collapsible>
      )}

      <Collapsible>
        <CollapsibleTrigger className="flex w-full items-center justify-between py-2 text-lg font-semibold">
          <span>Accessibility</span>
          <ChevronDown className="h-5 w-5" />
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 pt-2 pb-4">
          <div>
            <Label className="text-sm">Minimum Contrast (Body)</Label>
            <Input
              type="number"
              step="0.1"
              value={accessibility.minContrastBody}
              onChange={(e) =>
                setAccessibility({
                  minContrastBody: Number(e.target.value),
                })
              }
            />
            <p className="text-xs text-muted-foreground mt-1">WCAG 2.1 Level AA requires 4.5:1</p>
          </div>
          <div>
            <Label className="text-sm">Minimum Contrast (Large)</Label>
            <Input
              type="number"
              step="0.1"
              value={accessibility.minContrastLarge}
              onChange={(e) =>
                setAccessibility({
                  minContrastLarge: Number(e.target.value),
                })
              }
            />
            <p className="text-xs text-muted-foreground mt-1">WCAG 2.1 Level AA requires 3:1</p>
          </div>
        </CollapsibleContent>
      </Collapsible>

      <div className="pt-4 flex space-x-4">
        <Button variant="outline" className="flex-1">Reset</Button>
        <Button className="flex-1">Save</Button>
      </div>
    </div>
  )
}
