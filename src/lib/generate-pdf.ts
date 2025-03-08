import jsPDF from 'jspdf'
import 'jspdf-autotable'
import { Platform } from '@/store/platform-store'
import { useTypographyStore } from '@/store/typography'
import { calculateDistanceBasedSize } from '@/lib/scale-calculations'

// Add type definition for jsPDF with autoTable plugin
interface jsPDF {
  autoTable: (options: AutoTableOptions) => void
  lastAutoTable: {
    finalY: number
  }
}

// Type for autoTable options
type AutoTableOptions = {
  head: any[][]
  body: any[][]
  startY?: number
  theme?: string
  styles?: any
  headStyles?: any
  margin?: any
}

type ScaleValue = {
  px: number
  rem: number
  factor: number
}

export function generatePDF(platforms: Platform[]) {
  // Create a new document
  const doc = new jsPDF() as unknown as jsPDF
  
  // Get typography data from the store
  const typographyPlatforms = useTypographyStore.getState().platforms || []
  
  // Add title
  let yPos = 20
  doc.setFontSize(18)
  doc.text('Typography Documentation', 20, yPos)
  
  // Platform comparison table
  yPos += 20
  doc.setFontSize(14)
  doc.text('Platform Settings', 20, yPos)
  yPos += 10
  
  // Table headers
  doc.setFontSize(12)
  doc.text('Platform', 20, yPos)
  doc.text('Base Size', 60, yPos)
  doc.text('Scale Method', 100, yPos)
  doc.text('Ratio', 140, yPos)
  doc.text('Steps', 180, yPos)
  yPos += 10

  // Platform data
  doc.setFontSize(10)
  platforms.forEach(platform => {
    if (!platform) return // Skip if platform is undefined
    
    // Check if scale property exists before accessing it
    const typographyData = typographyPlatforms.find(p => p.id === platform.id)
    if (!typographyData || !typographyData.scale) {
      console.warn('Platform is missing typography data or scale property:', platform.id || 'unknown');
      return; // Skip this platform if scale is undefined
    }

    let baseSize = typographyData.scale.baseSize
    if (typographyData.scaleMethod === 'distance' && typographyData.distanceScale) {
      // Calculate distance-based size
      const {
        viewingDistance,
        visualAcuity,
        meanLengthRatio,
        textType,
        lighting,
        ppi
      } = typographyData.distanceScale
      
      baseSize = calculateDistanceBasedSize(
        viewingDistance,
        visualAcuity,
        meanLengthRatio,
        textType,
        lighting,
        ppi
      )
    }
    
    doc.text(platform.name, 20, yPos)
    doc.text(`${baseSize}px`, 60, yPos)
    doc.text(typographyData.scaleMethod || 'None', 100, yPos)
    doc.text(typographyData.scale.ratio.toString(), 140, yPos)
    doc.text(`${typographyData.scale.stepsUp}/${typographyData.scale.stepsDown}`, 180, yPos)
    yPos += 10
  })
  
  // Type styles table
  yPos += 10
  doc.setFontSize(14)
  doc.text('Type Styles', 20, yPos)
  yPos += 10
  
  // Create table data
  const tableData = []
  
  // Add headers
  const headers = [
    [
      'Platform',
      'Style Name',
      'Size',
      'Weight',
      'Line Height',
      'Letter Spacing',
      'Scale Step'
    ]
  ]
  
  // Add rows
  platforms.forEach(platform => {
    const typographyData = typographyPlatforms.find(p => p.id === platform.id)
    if (!typographyData || !typographyData.typeStyles) return
    
    typographyData.typeStyles.forEach(style => {
      tableData.push([
        platform.name,
        style.name,
        `${style.fontSize || ''}px`,
        style.fontWeight || '',
        style.lineHeight || '',
        style.letterSpacing || '',
        style.scaleStep || ''
      ])
    })
  })
  
  // Generate table
  doc.autoTable({
    head: headers,
    body: tableData,
    startY: yPos,
    theme: 'grid',
    styles: { fontSize: 8 },
    headStyles: { fillColor: [200, 200, 200] },
    margin: { top: 10 }
  })
  
  return doc
} 