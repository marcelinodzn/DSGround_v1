import { useTypographyStore } from "@/store/typography"
import { Separator } from "@/components/ui/separator"

export function TypeScalePreview() {
  const { scale } = useTypographyStore()
  const levels = 6

  const calculateSize = (level: number) => {
    return Math.round(scale.baseSize * Math.pow(scale.ratio, levels - level))
  }

  return (
    <div className="space-y-6">
      {[...Array(levels)].map((_, i) => {
        const size = calculateSize(i + 1)
        return (
          <div key={i}>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>H{i + 1}</span>
                <span>{size}px ({(size / scale.baseSize).toFixed(3)}x)</span>
              </div>
              <div
                style={{ fontSize: size }}
                className="font-semibold truncate"
              >
                The quick brown fox jumps over the lazy dog
              </div>
            </div>
            {i < levels - 1 && <Separator className="mt-6" />}
          </div>
        )
      })}

      <div>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Body</span>
            <span>{scale.baseSize}px (1x)</span>
          </div>
          <p style={{ fontSize: scale.baseSize }}>
            The quick brown fox jumps over the lazy dog
          </p>
        </div>
      </div>
    </div>
  )
}
