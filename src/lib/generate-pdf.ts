import jsPDF from 'jspdf'
import 'jspdf-autotable'
import { Platform } from '@/store/platform-store'
import { useTypographyStore } from '@/store/typography'
import { calculateDistanceBasedSize } from '@/lib/scale-calculations'
import { useBrandStore } from '@/store/brand-store'

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
  bodyStyles?: any
  alternateRowStyles?: any
  columnStyles?: any
  margin?: any
  didDrawPage?: (data: any) => void
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
  const getScaleValues = useTypographyStore.getState().getScaleValues
  const currentBrand = useBrandStore.getState().currentBrand
  
  // Set up colors - minimalistic black and white
  const primaryColor = [0, 0, 0] // Black
  const secondaryColor = [248, 248, 248] // Very light gray
  const textColor = [33, 33, 33] // Dark gray
  const lightTextColor = [117, 117, 117] // Medium gray
  
  // Add dark mode cover page
  doc.setFillColor(0, 0, 0) // Black background
  doc.rect(0, 0, 210, 297, 'F')
  
  // Add title
  doc.setTextColor(255, 255, 255) // White text
  doc.setFontSize(24) // Smaller font size
  doc.setFont('helvetica', 'bold') // Using helvetica as closest to Inter
  doc.text('Typography Documentation', 20, 40)
  
  // Add divider below headline
  doc.setDrawColor(255, 255, 255) // White line
  doc.setLineWidth(0.5)
  doc.line(20, 50, 190, 50)
  
  // Add brand name
  doc.setFontSize(16)
  doc.setFont('helvetica', 'normal')
  doc.text(`Brand: ${currentBrand?.name || 'Default'}`, 20, 60)
  
  // Add date
  const today = new Date()
  const dateStr = today.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })
  doc.setFontSize(10)
  doc.setTextColor(200, 200, 200) // Light gray text
  doc.text(`Generated on ${dateStr}`, 20, 70)
  
  // Add platforms count
  doc.text(`Includes ${platforms.length} platform${platforms.length !== 1 ? 's' : ''} and ${
    typographyPlatforms.reduce((count, platform) => count + (platform.typeStyles?.length || 0), 0)
  } type styles`, 20, 80)
  
  // Add separator line
  doc.setDrawColor(255, 255, 255) // White line
  doc.setLineWidth(0.5)
  doc.line(20, 90, 190, 90)
  
  // Add logo at the bottom left
  // Simple square logo based on the app's logo
  doc.setFillColor(255, 255, 255) // White fill for logo
  doc.rect(20, 260, 12, 12, 'F') // Outer square - smaller size
  doc.setFillColor(0, 0, 0) // Black fill for inner square
  doc.rect(22, 262, 8, 8, 'F') // Inner square - smaller size
  
  // Add "DSGround" text next to logo
  doc.setFontSize(12)
  doc.setTextColor(255, 255, 255)
  doc.text('DSGround', 36, 269) // Adjusted position to align with smaller logo
  
  // Add new page for content
  doc.addPage()
  
  // Function to add header and footer to each page
  const addHeaderFooter = (data: any) => {
    // Header
    doc.setFillColor(255, 255, 255) // White background
    doc.rect(0, 0, 210, 15, 'F')
    doc.setFontSize(8)
    doc.setTextColor(lightTextColor[0], lightTextColor[1], lightTextColor[2])
    doc.text('Typography Documentation', 20, 10)
    
    // Footer
    doc.setFillColor(255, 255, 255) // White background
    doc.rect(0, 282, 210, 15, 'F')
    doc.text(`Page ${doc.getNumberOfPages()}`, 190, 287, { align: 'right' })
    doc.text(dateStr, 20, 287)
    
    // Add separator line at the bottom of the header
    doc.setDrawColor(secondaryColor[0], secondaryColor[1], secondaryColor[2])
    doc.setLineWidth(0.2)
    doc.line(20, 12, 190, 12)
  }
  
  // Platform comparison section
  let yPos = 30
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Platform Settings', 20, yPos)
  yPos += 8
  
  // Platform comparison table
  const platformHeaders = [['Platform', 'Base Size', 'Scale Method', 'Ratio', 'Steps']]
  const platformRows = platforms.map(platform => {
    const typographyData = typographyPlatforms.find(p => p.id === platform.id)
    if (!typographyData || !typographyData.scale) {
      return null
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
    
    return [
      platform.name,
      `${baseSize}px`,
      typographyData.scaleMethod || 'None',
      typographyData.scale.ratio.toString(),
      `${typographyData.scale.stepsUp}/${typographyData.scale.stepsDown}`
    ]
  }).filter(Boolean) as any[][]
  
  doc.autoTable({
    head: platformHeaders,
    body: platformRows,
    startY: yPos,
    theme: 'plain',
    styles: { 
      fontSize: 9,
      cellPadding: 4,
      lineWidth: 0.1
    },
    headStyles: { 
      fillColor: secondaryColor,
      textColor: primaryColor,
      fontStyle: 'bold',
      lineWidth: 0.1
    },
    alternateRowStyles: {
      fillColor: [255, 255, 255]
    },
    margin: { top: 20, bottom: 20, left: 20, right: 20 },
    didDrawPage: addHeaderFooter
  })
  
  // Process each platform
  platforms.forEach(platform => {
    const typographyData = typographyPlatforms.find(p => p.id === platform.id)
    if (!typographyData) return
    
    // Add new page for each platform
    doc.addPage()
    yPos = 20
    
    // Add platform title
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
    doc.text(`${platform.name}`, 20, yPos)
    yPos += 5
    
    // Add separator line
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2])
    doc.setLineWidth(0.2)
    doc.line(20, yPos + 3, 190, yPos + 3)
    yPos += 10
    
    // Get scale values
    const scaleValues = getScaleValues(platform.id) || []
    
    if (scaleValues.length > 0) {
      // Add scale values section title
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text('Scale Values', 20, yPos)
      yPos += 5
      
      const scaleHeaders = [['Step', 'Size', 'Ratio', 'Type Styles']]
      const scaleRows = scaleValues.map(value => {
        const stylesAtScale = typographyData.typeStyles?.filter(
          style => style.scaleStep === value.label
        ) || []
        
        return [
          value.label,
          `${Math.round(value.size)}${platform.units?.typography || 'px'}`,
          value.ratio.toFixed(2),
          stylesAtScale.length > 0 
            ? stylesAtScale.map(style => style.name).join(', ')
            : '-'
        ]
      })
      
      doc.autoTable({
        head: scaleHeaders,
        body: scaleRows,
        startY: yPos,
        theme: 'plain',
        styles: { 
          fontSize: 8,
          cellPadding: 3,
          lineWidth: 0.1
        },
        headStyles: { 
          fillColor: secondaryColor,
          textColor: primaryColor,
          fontStyle: 'bold',
          lineWidth: 0.1
        },
        alternateRowStyles: {
          fillColor: [255, 255, 255]
        },
        margin: { top: 20, bottom: 20, left: 20, right: 20 },
        didDrawPage: addHeaderFooter
      })
    }
    
    // Type styles section
    if (typographyData.typeStyles && typographyData.typeStyles.length > 0) {
      yPos = doc.lastAutoTable.finalY + 10
      
      // Add type styles section title
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text('Type Styles', 20, yPos)
      yPos += 5
      
      const styleHeaders = [['Style Name', 'Size', 'Weight', 'Line Height', 'Letter Spacing', 'Text Transform', 'Scale Step']]
      const styleRows = typographyData.typeStyles.map(style => {
        const scaleValue = getScaleValues(platform.id)?.find(s => s.label === style.scaleStep)
        const fontSize = style.fontSize || (scaleValue ? scaleValue.size : 16)
        
        // Format line height based on unit
        const lineHeight = style.lineHeightUnit === 'multiplier' 
          ? `${style.lineHeight.toFixed(2)}×` 
          : `${(style.lineHeight * 100).toFixed(0)}%`
        
        return [
          style.name,
          `${fontSize}${platform.units?.typography || 'px'}`,
          style.fontWeight.toString(),
          lineHeight,
          `${style.letterSpacing}em`,
          style.textTransform || 'none',
          style.scaleStep
        ]
      })
      
      doc.autoTable({
        head: styleHeaders,
        body: styleRows,
        startY: yPos,
        theme: 'plain',
        styles: { 
          fontSize: 8,
          cellPadding: 3,
          lineWidth: 0.1
        },
        headStyles: { 
          fillColor: secondaryColor,
          textColor: primaryColor,
          fontStyle: 'bold',
          lineWidth: 0.1
        },
        alternateRowStyles: {
          fillColor: [255, 255, 255]
        },
        columnStyles: {
          0: { fontStyle: 'bold' } // Style name column
        },
        margin: { top: 20, bottom: 20, left: 20, right: 20 },
        didDrawPage: addHeaderFooter
      })
      
      // Add preview section with examples
      yPos = doc.lastAutoTable.finalY + 10
      
      // Add preview section title
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text('Preview Examples', 20, yPos)
      yPos += 10
      
      // Sort styles by scale step to maintain hierarchy
      const sortedStyles = [...typographyData.typeStyles].sort((a, b) => {
        // Get scale values for both styles
        const aScaleValue = getScaleValues(platform.id)?.find(s => s.label === a.scaleStep)
        const bScaleValue = getScaleValues(platform.id)?.find(s => s.label === b.scaleStep)
        
        // Get sizes
        const aSize = a.fontSize || (aScaleValue ? aScaleValue.size : 16)
        const bSize = b.fontSize || (bScaleValue ? bScaleValue.size : 16)
        
        // Sort by size (descending)
        return bSize - aSize
      })
      
      // Find the largest and smallest font sizes to calculate scale
      const largestStyle = sortedStyles[0]
      const smallestStyle = sortedStyles[sortedStyles.length - 1]
      
      const largestScaleValue = getScaleValues(platform.id)?.find(s => s.label === largestStyle.scaleStep)
      const smallestScaleValue = getScaleValues(platform.id)?.find(s => s.label === smallestStyle.scaleStep)
      
      const largestSize = largestStyle.fontSize || (largestScaleValue ? largestScaleValue.size : 16)
      const smallestSize = smallestStyle.fontSize || (smallestScaleValue ? smallestScaleValue.size : 16)
      
      // Calculate scale factor to fit all styles proportionally
      const availableHeight = 200 // Maximum available height for previews
      const totalHeight = sortedStyles.reduce((sum, style) => {
        const scaleValue = getScaleValues(platform.id)?.find(s => s.label === style.scaleStep)
        const fontSize = style.fontSize || (scaleValue ? scaleValue.size : 16)
        return sum + Math.max(fontSize * 0.8, 10) // Minimum height of 10
      }, 0)
      
      const scaleFactor = Math.min(1, availableHeight / totalHeight)
      
      // Add preview text for each style with proportional scaling
      let currentY = yPos
      sortedStyles.forEach((style, index) => {
        const scaleValue = getScaleValues(platform.id)?.find(s => s.label === style.scaleStep)
        const fontSize = style.fontSize || (scaleValue ? scaleValue.size : 16)
        
        // Calculate proportional display size
        const displaySize = Math.min(fontSize * scaleFactor, 24) // Cap at 24pt for very large fonts
        const rowHeight = Math.max(displaySize * 1.5, 15) // Ensure minimum height
        
        // Check if we need a new page
        if (currentY + rowHeight > 270) {
          doc.addPage()
          currentY = 30
          addHeaderFooter({})
        }
        
        // Style name and properties
        doc.setFontSize(7)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(lightTextColor[0], lightTextColor[1], lightTextColor[2])
        doc.text(`${style.name} (${fontSize}${platform.units?.typography || 'px'}, ${style.fontWeight})`, 20, currentY)
        currentY += 3
        
        // Preview text
        doc.setFontSize(displaySize)
        doc.setFont('helvetica', style.fontWeight >= 700 ? 'bold' : 'normal')
        doc.setTextColor(textColor[0], textColor[1], textColor[2])
        
        // Apply text transformation
        let previewText = 'The quick brown fox'
        if (style.textTransform === 'uppercase') previewText = previewText.toUpperCase()
        else if (style.textTransform === 'lowercase') previewText = previewText.toLowerCase()
        else if (style.textTransform === 'capitalize') previewText = previewText.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
        
        doc.text(previewText, 20, currentY + displaySize)
        currentY += rowHeight
      })
    }
  })
  
  return doc
} 