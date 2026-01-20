import { generateJSON } from './claude-client'
import type { StructuralPatterns, LinguisticPatterns, ContentPatterns } from '@/types/database'

export interface VoiceAnalysisResult {
  structural: StructuralPatterns
  linguistic: LinguisticPatterns
  content: ContentPatterns
  summary: string
}

/**
 * Analyze a collection of posts to extract voice patterns
 */
export async function analyzeVoice(posts: string[]): Promise<VoiceAnalysisResult | null> {
  if (posts.length === 0) {
    return null
  }

  const postsText = posts.map((p, i) => `--- Post ${i + 1} ---\n${p}`).join('\n\n')

  const prompt = `Analyze the following posts written by the same person and extract their unique writing voice patterns.

${postsText}

Return a JSON object with this exact structure:
{
  "structural": {
    "avg_sentence_length": <number of words>,
    "avg_paragraph_length": <number of sentences>,
    "uses_lists": <boolean>,
    "list_frequency": <0-1 how often they use lists>,
    "hook_patterns": [<array of 3-5 common opening line patterns they use>],
    "cta_patterns": [<array of 2-3 common closing/call-to-action patterns>],
    "post_structure": [<array describing their typical post flow, e.g. ["hook", "story", "lesson", "cta"]>]
  },
  "linguistic": {
    "common_words": [{"word": "<word>", "frequency": <0-1>}], // top 10 distinctive words they use often
    "common_phrases": [{"phrase": "<phrase>", "frequency": <0-1>}], // top 5 phrases they repeat
    "tone_markers": {
      "formal": <0-1>,
      "casual": <0-1>,
      "humorous": <0-1>
    },
    "emoji_usage": {
      "uses_emoji": <boolean>,
      "common_emoji": [<top emojis if used>],
      "frequency": <0-1 how often per post>
    },
    "punctuation_style": {
      "uses_ellipsis": <boolean>,
      "uses_dashes": <boolean>,
      "exclamation_frequency": <0-1>
    }
  },
  "content": {
    "topics": [<array of 5-10 main topics they write about>],
    "opinions": [{"topic": "<topic>", "stance": "<their position>"}], // 3-5 clear opinions
    "recurring_stories": [<themes or personal stories they reference>],
    "frameworks": [<mental models or frameworks they use>],
    "values": [<core values that come through in their writing>]
  },
  "summary": "<2-3 sentence natural language description of their writing voice>"
}

Be specific and concrete. Extract actual patterns from the text, not generic observations.`

  return generateJSON<VoiceAnalysisResult>(prompt, {
    temperature: 0.3, // Lower temp for analysis
  })
}

/**
 * Quick analysis for a small number of posts (used during onboarding)
 */
export async function quickAnalyzeVoice(posts: string[]): Promise<string | null> {
  if (posts.length === 0) return null

  const postsText = posts.slice(0, 5).map((p, i) => `Post ${i + 1}: ${p.slice(0, 500)}...`).join('\n\n')

  const prompt = `Based on these posts, write a 2-3 sentence description of this person's writing voice and style:

${postsText}

Focus on: tone, sentence structure, vocabulary level, and any distinctive patterns.`

  const result = await generateJSON<{ summary: string }>(prompt, { temperature: 0.5 })
  return result?.summary || null
}
