/**
 * Deck Text Extraction
 * Supports PDF slides (PowerPoint/Keynote exported to PDF)
 * Uses browser's native capabilities or server-side extraction
 */

export interface ExtractedDeck {
  fileName: string
  slideCount: number
  extractedText: string // All text content combined
  slides: Array<{
    slideNumber: number
    text: string
    hasImages: boolean
  }>
}

/**
 * Extract text from PDF using browser FileReader
 * For MVP, we'll ask users to paste deck text manually
 * In production, this would use pdf-parse or similar
 */
export async function extractTextFromPDF(file: File): Promise<ExtractedDeck> {
  // For MVP: Manual paste workflow
  throw new Error('PDF extraction not implemented. Please paste slide text manually.')
}

/**
 * Parse manually pasted deck content
 * Expected format:
 * === Slide 1 ===
 * Title text
 * Body text
 *
 * === Slide 2 ===
 * ...
 */
export function parsePastedDeckText(content: string, fileName: string = 'Manual Entry'): ExtractedDeck {
  const slideDelimiter = /={3,}\s*Slide\s+(\d+)\s*={3,}/gi
  const parts = content.split(slideDelimiter)

  const slides: ExtractedDeck['slides'] = []

  // Process slide text (parts alternate: text, slideNumber, text, slideNumber, ...)
  for (let i = 1; i < parts.length; i += 2) {
    const slideNumber = parseInt(parts[i], 10)
    const text = parts[i + 1]?.trim() || ''

    if (text) {
      slides.push({
        slideNumber,
        text,
        hasImages: false, // Can't detect from pasted text
      })
    }
  }

  // If no delimiter found, treat entire content as one deck
  if (slides.length === 0) {
    slides.push({
      slideNumber: 1,
      text: content.trim(),
      hasImages: false,
    })
  }

  return {
    fileName,
    slideCount: slides.length,
    extractedText: slides.map(s => s.text).join('\n\n'),
    slides,
  }
}

/**
 * Clean and normalize deck text
 * Remove bullet points, excessive whitespace, etc.
 */
export function cleanDeckText(text: string): string {
  return text
    .replace(/^[•\-*]\s+/gm, '') // Remove bullet points
    .replace(/\n{3,}/g, '\n\n') // Collapse multiple newlines
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()
}
