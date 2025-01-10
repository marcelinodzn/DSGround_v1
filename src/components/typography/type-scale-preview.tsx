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
  const { scale, scaleMethod } = useTypographyStore()

  const typeScaleItems = [
    { id: 'h1', label: 'H1', size: 49, ratio: '3.063x' },
    { id: 'h2', label: 'H2', size: 39, ratio: '2.438x' },
    { id: 'h3', label: 'H3', size: 31, ratio: '1.938x' },
    { id: 'h4', label: 'H4', size: 25, ratio: '1.563x' },
    { id: 'h5', label: 'H5', size: 20, ratio: '1.250x' },
    { id: 'h6', label: 'H6', size: 16, ratio: '1.000x' },
    { id: 'body', label: 'Body', size: 16, ratio: '1x' },
  ]

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
                <div 
                  style={{ 
                    fontSize: `${item.size}px`,
                    lineHeight: 1.2
                  }} 
                  className="truncate"
                >
                  The quick brown fox jumps over the lazy dog
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
