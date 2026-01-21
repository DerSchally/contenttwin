import { generateJSON } from './claude-client'
import type { ExtractedDeck } from '@/lib/decks/extractor'

export interface DeckNarrative {
  mainTheme: string // Central message of the deck
  keyPoints: string[] // 5-10 main arguments/ideas
  storytellingStyle: string // How they structure narratives
  frameworks: string[] // Frameworks/models they use (e.g., "Golden Circle", "SWOT")
  uniquePerspectives: string[] // Contrarian or unique takes
  emotionalTone: string // e.g., "Inspirational", "Data-driven", "Provocative"
  targetAudience: string // Who this is aimed at
}

export interface DeckAnalysisResult {
  narratives: DeckNarrative[]
  overallVoice: {
    presentationStyle: string // How they present ideas
    coreBelief: string // What they fundamentally believe
    contentDNA: string // Recurring themes across all decks
  }
  suggestedPillars: Array<{
    name: string
    confidence: number
    evidence: string[] // Quotes/examples from decks
  }>
}

/**
 * Analyze a single deck to extract narrative patterns
 */
export async function analyzeDeck(deck: ExtractedDeck): Promise<DeckNarrative | null> {
  if (!deck.extractedText || deck.extractedText.length < 100) {
    return null
  }

  const prompt = `Analyze this presentation deck and extract the narrative structure and messaging patterns.

DECK: "${deck.fileName}"
SLIDE COUNT: ${deck.slideCount}

CONTENT:
${deck.extractedText}

Return a JSON object with this structure:
{
  "mainTheme": "<1 sentence: what is the core message?>",
  "keyPoints": [<5-10 main arguments or ideas presented>],
  "storytellingStyle": "<how do they structure the narrative? e.g., problem-solution, storytelling, data-driven>",
  "frameworks": [<any frameworks, models, or mental models used>],
  "uniquePerspectives": [<contrarian or unique takes that stand out>],
  "emotionalTone": "<inspirational/analytical/provocative/educational/etc>",
  "targetAudience": "<who is this presentation aimed at?>"
}

GUIDELINES:
- Focus on HOW they communicate, not just WHAT they say
- Identify recurring patterns and unique angles
- Look for frameworks they use to structure thinking
- Capture their perspective/opinion, not generic facts`

  return generateJSON<DeckNarrative>(prompt, {
    temperature: 0.3,
  })
}

/**
 * Analyze multiple decks together to find overarching patterns
 */
export async function analyzeMultipleDecks(
  decks: ExtractedDeck[]
): Promise<DeckAnalysisResult | null> {
  if (decks.length === 0) return null

  // First, analyze each deck individually
  const narratives: DeckNarrative[] = []
  for (const deck of decks) {
    const narrative = await analyzeDeck(deck)
    if (narrative) {
      narratives.push(narrative)
    }
  }

  if (narratives.length === 0) return null

  // Then, find patterns across all decks
  const narrativeSummary = narratives
    .map(
      (n, i) =>
        `DECK ${i + 1}: ${n.mainTheme}\nKey Points: ${n.keyPoints.join(', ')}\nStyle: ${n.storytellingStyle}`
    )
    .join('\n\n')

  const prompt = `Analyze these presentation decks to understand this person's overall content voice and expertise.

${narrativeSummary}

Return a JSON object:
{
  "overallVoice": {
    "presentationStyle": "<how they typically present ideas across all decks>",
    "coreBelief": "<what fundamental belief drives their work?>",
    "contentDNA": "<recurring themes that appear across multiple decks>"
  },
  "suggestedPillars": [
    {
      "name": "<pillar name, 2-4 words>",
      "confidence": <0-100>,
      "evidence": [<quotes or examples from decks that support this pillar>]
    }
  ]
}

GUIDELINES:
- Look for patterns ACROSS decks, not within a single deck
- Identify 3-5 pillars that represent their expertise areas
- Focus on what makes THEIR approach unique
- Confidence based on how frequently theme appears`

  const result = await generateJSON<{
    overallVoice: DeckAnalysisResult['overallVoice']
    suggestedPillars: DeckAnalysisResult['suggestedPillars']
  }>(prompt, {
    temperature: 0.3,
    maxTokens: 4096,
  })

  if (!result) return null

  return {
    narratives,
    ...result,
  }
}

/**
 * Combine deck analysis with post analysis for richer pillar discovery
 */
export async function enrichPillarsWithDecks(
  postBasedPillars: Array<{ name: string; description: string; confidence: number; example_topics: string[]; post_count: number }>,
  deckAnalysis: DeckAnalysisResult
): Promise<
  Array<{
    name: string
    description: string
    confidence: number
    example_topics: string[]
    post_count: number
    sources: string[] // e.g., ["posts", "decks"]
    deckEvidence?: string[] // Quotes from decks
  }>
> {
  const enrichedPillars = [...postBasedPillars].map((p) => ({ ...p, sources: ['posts'] as string[], deckEvidence: undefined as string[] | undefined }))

  // Match deck pillars to post pillars and enrich
  for (const deckPillar of deckAnalysis.suggestedPillars) {
    const matchingPostPillar = enrichedPillars.find(
      (pp) =>
        pp.name.toLowerCase().includes(deckPillar.name.toLowerCase()) ||
        deckPillar.name.toLowerCase().includes(pp.name.toLowerCase())
    )

    if (matchingPostPillar) {
      // Boost confidence and add deck evidence
      matchingPostPillar.confidence = Math.min(
        100,
        Math.round((matchingPostPillar.confidence + deckPillar.confidence) / 2 + 10)
      )
      matchingPostPillar.sources.push('decks')
      matchingPostPillar.deckEvidence = deckPillar.evidence
    } else {
      // Add as new pillar if confidence is high enough
      if (deckPillar.confidence >= 60) {
        enrichedPillars.push({
          name: deckPillar.name,
          description: `Identified from presentation decks: ${deckPillar.evidence[0] || 'recurring theme'}`,
          confidence: deckPillar.confidence,
          example_topics: [], // No example topics from decks alone
          post_count: 0, // Not from posts
          sources: ['decks'],
          deckEvidence: deckPillar.evidence,
        })
      }
    }
  }

  // Sort by confidence
  return enrichedPillars.sort((a, b) => b.confidence - a.confidence)
}
