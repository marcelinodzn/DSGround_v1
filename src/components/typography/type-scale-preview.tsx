import { useTypographyStore } from "@/store/typography"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export function TypeScalePreview() {
  const { scale } = useTypographyStore()
  
  const calculateSize = (step: number) => {
    return Math.round(scale.baseSize * Math.pow(scale.ratio, step))
  }

  const typeScaleItems = [
    { id: 'h1', label: 'H1', step: 5 },
    { id: 'h2', label: 'H2', step: 4 },
    { id: 'h3', label: 'H3', step: 3 },
    { id: 'h4', label: 'H4', step: 2 },
    { id: 'h5', label: 'H5', step: 1 },
    { id: 'h6', label: 'H6', step: 0 },
    { id: 'body', label: 'Body', step: 0 },
  ].map(item => ({
    ...item,
    size: calculateSize(item.step),
    ratio: item.step === 0 ? '1x' : `${(calculateSize(item.step) / scale.baseSize).toFixed(3)}x`
  }))

  return (
    <div className="border-y">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px] pl-0">Label</TableHead>
            <TableHead className="pl-0">Preview</TableHead>
            <TableHead className="w-[100px] pl-0">Size</TableHead>
            <TableHead className="w-[100px] pl-0">Ratio</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {typeScaleItems.map((item) => (
            <TableRow key={item.id} className="h-auto">
              <TableCell className="font-medium py-4 pl-0">{item.label}</TableCell>
              <TableCell className="py-4 pl-0">
                <div className="min-w-0 max-w-full">
                  <div 
                    style={{ 
                      fontSize: `${item.size}px`,
                      lineHeight: 1.2,
                      wordBreak: 'break-word',
                      overflowWrap: 'break-word',
                      whiteSpace: 'normal',
                      maxHeight: `${Math.max(item.size * 1.2 * 2, 48)}px`,
                      overflow: 'hidden'
                    }} 
                  >
                    The quick brown fox jumps over the lazy dog
                  </div>
                </div>
              </TableCell>
              <TableCell className="py-4 pl-0">{item.size}px</TableCell>
              <TableCell className="py-4 pl-0">{item.ratio}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
