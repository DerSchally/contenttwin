import { generateJSON } from './claude-client'
import type { VoiceAnalysisResult } from './voice-analyzer'
import type { ContentType, GeneratedVariation } from '@/types/database'

export interface GenerationInput {
  topic: string
  contentType: ContentType
  creativityLevel: number // 0-100
  voiceProfile?: VoiceAnalysisResult | null
  samplePosts?: string[] // Recent posts for context
  trends?: string[] // Optional trending topics to incorporate
}

export interface GenerationOutput {
  variations: GeneratedVariation[]
  generationTimeMs: number
}

/**
 * Generate content variations based on topic and voice profile
 */
export async function generateContent(input: GenerationInput): Promise<GenerationOutput> {
  const startTime = Date.now()

  const {
    topic,
    contentType,
    creativityLevel,
    voiceProfile,
    samplePosts = [],
    trends = [],
  } = input

  // Build context sections
  const voiceContext = voiceProfile
    ? buildVoiceContext(voiceProfile)
    : 'No voice profile available. Write in a professional, engaging LinkedIn style.'

  const sampleContext = samplePosts.length > 0
    ? `\n\nHere are examples of their recent posts for reference:\n${samplePosts.slice(0, 3).map((p, i) => `Example ${i + 1}:\n${p}`).join('\n\n')}`
    : ''

  const trendContext = trends.length > 0
    ? `\n\nConsider incorporating these relevant trends if appropriate: ${trends.join(', ')}`
    : ''

  const lengthGuidance = contentType === 'short'
    ? 'Keep it under 500 characters. Punchy and direct.'
    : 'Aim for 1000-2500 characters. Include a hook, body with value, and call-to-action.'

  const creativityGuidance = getCreativityGuidance(creativityLevel)

  const prompt = `You are a content ghostwriter who perfectly mimics a specific person's writing voice.

VOICE PROFILE:
${voiceContext}
${sampleContext}

TASK:
Write 3 different variations of a ${contentType === 'short' ? 'short-form' : 'long-form'} LinkedIn post about: "${topic}"
${trendContext}

CONSTRAINTS:
- ${lengthGuidance}
- ${creativityGuidance}
- Each variation should take a different angle or approach
- Match the voice profile's tone, structure, and vocabulary
- Make it sound authentically like this person, not generic AI

Return a JSON object with this structure:
{
  "variations": [
    {
      "id": "var-1",
      "content": "<the full post text>",
      "approach": "<1 sentence describing the angle taken>"
    },
    {
      "id": "var-2",
      "content": "<the full post text>",
      "approach": "<1 sentence describing the angle taken>"
    },
    {
      "id": "var-3",
      "content": "<the full post text>",
      "approach": "<1 sentence describing the angle taken>"
    }
  ]
}`

  const result = await generateJSON<{
    variations: Array<{
      id: string
      content: string
      approach: string
    }>
  }>(prompt, {
    temperature: 0.7 + (creativityLevel / 200), // 0.7-1.2 based on creativity
    maxTokens: 4096,
  })

  if (!result || !result.variations) {
    throw new Error('Failed to generate content variations')
  }

  // Score each variation against the voice profile
  const scoredVariations = await Promise.all(
    result.variations.map(async (v) => {
      const score = voiceProfile
        ? await scoreVoiceMatch(v.content, voiceProfile)
        : { overall: 75, breakdown: { structure: 75, tone: 75, vocabulary: 75 } }

      return {
        id: v.id,
        content: v.content,
        voice_match_score: score.overall,
        voice_match_breakdown: score.breakdown,
      }
    })
  )

  return {
    variations: scoredVariations,
    generationTimeMs: Date.now() - startTime,
  }
}

/**
 * Build voice context string from analysis
 */
function buildVoiceContext(profile: VoiceAnalysisResult): string {
  const { structural, linguistic, content, summary } = profile

  return `SUMMARY: ${summary}

WRITING STRUCTURE:
- Average sentence length: ${structural.avg_sentence_length} words
- Uses lists: ${structural.uses_lists ? 'Yes' : 'Rarely'}
- Typical hook patterns: ${structural.hook_patterns.join(', ')}
- Post structure: ${structural.post_structure.join(' → ')}
- CTA style: ${structural.cta_patterns.join(', ')}

LANGUAGE & TONE:
- Tone: ${linguistic.tone_markers.formal > 0.5 ? 'Formal' : 'Casual'}${linguistic.tone_markers.humorous > 0.3 ? ', with humor' : ''}
- Common words/phrases: ${linguistic.common_phrases.map(p => `"${p.phrase}"`).join(', ')}
- Emoji usage: ${linguistic.emoji_usage.uses_emoji ? `Yes (${linguistic.emoji_usage.common_emoji.join(', ')})` : 'No'}
- Punctuation: ${linguistic.punctuation_style.uses_ellipsis ? 'Uses ellipsis...' : ''}${linguistic.punctuation_style.uses_dashes ? ' Uses dashes—' : ''}

CONTENT THEMES:
- Main topics: ${content.topics.join(', ')}
- Core values: ${content.values.join(', ')}
- Frameworks they use: ${content.frameworks.join(', ')}
- Known opinions: ${content.opinions.map(o => `${o.topic}: ${o.stance}`).join('; ')}`
}

/**
 * Get creativity guidance based on level
 */
function getCreativityGuidance(level: number): string {
  if (level < 20) {
    return 'Stick very close to their proven patterns. Safe and consistent.'
  } else if (level < 50) {
    return 'Follow their core style but you can experiment with the angle or hook.'
  } else if (level < 80) {
    return 'Be creative with the approach while maintaining their voice. Try new formats.'
  } else {
    return 'Push boundaries. Experiment boldly while keeping their core voice recognizable.'
  }
}

/**
 * Score how well content matches the voice profile
 */
async function scoreVoiceMatch(
  content: string,
  voiceProfile: VoiceAnalysisResult
): Promise<{ overall: number; breakdown: { structure: number; tone: number; vocabulary: number } }> {
  const prompt = `Score how well this content matches the author's voice profile.

VOICE PROFILE:
${voiceProfile.summary}
- Tone: ${voiceProfile.linguistic.tone_markers.formal > 0.5 ? 'Formal' : 'Casual'}
- Common phrases: ${voiceProfile.linguistic.common_phrases.slice(0, 3).map(p => p.phrase).join(', ')}
- Hook style: ${voiceProfile.structural.hook_patterns[0]}
- Topics: ${voiceProfile.content.topics.slice(0, 5).join(', ')}

CONTENT TO SCORE:
${content}

Return a JSON object:
{
  "structure": <0-100 how well it matches their structural patterns>,
  "tone": <0-100 how well it matches their tone and style>,
  "vocabulary": <0-100 how well it uses their vocabulary/phrases>,
  "overall": <0-100 weighted average>
}

Be critical but fair. 70+ means it sounds like them. 85+ means it's very close.`

  const result = await generateJSON<{
    structure: number
    tone: number
    vocabulary: number
    overall: number
  }>(prompt, { temperature: 0.2 })

  if (!result) {
    return { overall: 70, breakdown: { structure: 70, tone: 70, vocabulary: 70 } }
  }

  return {
    overall: result.overall,
    breakdown: {
      structure: result.structure,
      tone: result.tone,
      vocabulary: result.vocabulary,
    },
  }
}
