import jsPDF from 'jspdf'
import 'jspdf-autotable'
import type { UserOptions } from 'jspdf-autotable'
import { Platform } from '@/store/typography'
import { calculateDistanceBasedSize } from '@/lib/scale-calculations'

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: UserOptions) => void
    lastAutoTable: {
      finalY: number
    }
  }
}

type ScaleValue = {
  px: number
  rem: number
  factor: number
}

export function generatePDF(platforms: Platform[]) {
  const doc = new jsPDF()
  let yPos = 20

  // Title
  doc.setFontSize(20)
  doc.text('Typography Documentation', 20, yPos)
  yPos += 20

  // Platform Settings
  doc.setFontSize(16)
  doc.text('Platform Settings', 20, yPos)
  yPos += 10

  // Headers
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

    let baseSize = platform.scale.baseSize
    if (platform.scaleMethod === 'distance' && platform.distanceScale) {
      // Calculate distance-based size
      const {
        viewingDistance,
        visualAcuity,
        meanLengthRatio,
        textType,
        lighting,
        ppi
      } = platform.distanceScale

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
    doc.text(
      platform.scaleMethod === 'distance'
        ? `${Math.round(baseSize)}px (distance-based)`
        : `${baseSize}px`,
      60,
      yPos
    )
    doc.text(platform.scaleMethod, 100, yPos)
    doc.text(platform.scale.ratio.toString(), 140, yPos)
    doc.text(`${platform.scale.stepsUp}/${platform.scale.stepsDown}`, 180, yPos)
    yPos += 10
  })

  yPos += 20

  // Type Styles
  doc.setFontSize(16)
  doc.text('Type Styles', 20, yPos)
  yPos += 10

  // Headers
  doc.setFontSize(12)
  doc.text('Platform', 20, yPos)
  doc.text('Style Name', 60, yPos)
  doc.text('Scale Step', 100, yPos)
  doc.text('Properties', 140, yPos)
  yPos += 10

  // Type styles data
  doc.setFontSize(10)
  platforms.forEach(platform => {
    if (!platform) return // Skip if platform is undefined

    platform.typeStyles.forEach(style => {
      doc.text(platform.name, 20, yPos)
      doc.text(style.name, 60, yPos)
      doc.text(style.scaleStep, 100, yPos)
      doc.text(
        `${style.fontWeight}w, ${style.lineHeight}lh, ${style.letterSpacing}em`,
        140,
        yPos
      )
      yPos += 10

      // Add new page if needed
      if (yPos > 270) {
        doc.addPage()
        yPos = 20
      }
    })
  })

  return doc
} 