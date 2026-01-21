import { generateJSON } from './claude-client'
import type { ContentPillar } from '@/types/database'

export interface DiscoveredPillar {
  name: string
  description: string
  example_topics: string[]
  confidence: number // 0-100
  post_count: number // How many posts matched this pillar
}

export interface PillarDiscoveryResult {
  pillars: DiscoveredPillar[]
  summary: string // Overall content strategy summary
}

/**
 * Analyze user's past posts to discover content pillars (recurring themes)
 * Returns 3-5 core themes that define their content strategy
 */
export async function discoverPillars(posts: string[]): Promise<PillarDiscoveryResult | null> {
  if (posts.length < 3) {
    return null // Need at least 3 posts to identify patterns
  }

  const postsText = posts.map((p, i) => `--- Post ${i + 1} ---\n${p}`).join('\n\n')

  const prompt = `Analyze these posts written by the same person and identify their core content pillars.

A "content pillar" is a recurring theme or topic area they consistently write about. These pillars define their content strategy and expertise areas.

${postsText}

Return a JSON object with this structure:
{
  "pillars": [
    {
      "name": "<short pillar name, 2-4 words>",
      "description": "<1-2 sentence description of this pillar>",
      "example_topics": ["<topic 1>", "<topic 2>", "<topic 3>"], // Specific topics within this pillar
      "confidence": <0-100, how confident you are this is a real pillar>,
      "post_count": <number of posts that matched this pillar>
    }
  ],
  "summary": "<2-3 sentence summary of their overall content strategy>"
}

IMPORTANT:
- Identify 3-5 pillars (not more, not less)
- Each pillar should be distinct and meaningful
- Name pillars concretely (not generic like "Personal Growth")
- Focus on what makes THEM unique, not generic content categories
- Order pillars by post_count (most common first)

Examples of GOOD pillar names:
- "Startup Hiring Challenges"
- "Remote Team Management"
- "Product-Led Growth"
- "Engineering Leadership"

Examples of BAD pillar names:
- "Success" (too vague)
- "Tips" (not a theme)
- "Motivation" (too generic)`

  return generateJSON<PillarDiscoveryResult>(prompt, {
    temperature: 0.3, // Lower for analytical task
  })
}

/**
 * Categorize a single post into existing pillars
 * Returns pillar IDs with confidence scores
 */
export async function categorizePosts(
  posts: string[],
  pillars: { id: string; name: string; description: string }[]
): Promise<
  Array<{
    postIndex: number
    matches: Array<{ pillarId: string; confidence: number }>
  }>
> {
  if (posts.length === 0 || pillars.length === 0) return []

  const postsText = posts.map((p, i) => `Post ${i}: ${p.slice(0, 500)}...`).join('\n\n')
  const pillarsText = pillars
    .map((p) => `- ID: ${p.id}\n  Name: ${p.name}\n  Description: ${p.description}`)
    .join('\n\n')

  const prompt = `Match each post to the most relevant content pillar(s).

POSTS:
${postsText}

PILLARS:
${pillarsText}

Return a JSON object:
{
  "categorizations": [
    {
      "postIndex": 0,
      "matches": [
        {"pillarId": "<pillar id>", "confidence": <0-100>}
      ]
    }
  ]
}

A post can match 1-2 pillars (primary + optional secondary). Only include matches with confidence > 50.`

  const result = await generateJSON<{
    categorizations: Array<{
      postIndex: number
      matches: Array<{ pillarId: string; confidence: number }>
    }>
  }>(prompt, { temperature: 0.2 })

  return result?.categorizations || []
}

/**
 * Generate topic suggestions based on pillars and voice profile
 * This is the "what should I write about next?" feature
 */
export async function suggestTopics(
  pillars: Array<{ name: string; description: string; example_topics: string[] }>,
  voiceSummary: string,
  recentTopics: string[] = [], // Topics they've written about recently (to avoid duplicates)
  count: number = 10
): Promise<
  Array<{
    topic: string
    pillar: string
    reasoning: string
    relevanceScore: number // 0-100
    trendinessScore: number // 0-100
    overallScore: number // 0-100
  }>
> {
  if (pillars.length === 0) return []

  const pillarsText = pillars
    .map((p) => `- ${p.name}: ${p.description}\n  Examples: ${p.example_topics.join(', ')}`)
    .join('\n\n')

  const recentContext =
    recentTopics.length > 0
      ? `\n\nRECENT TOPICS (avoid duplicating these):\n${recentTopics.map((t) => `- ${t}`).join('\n')}`
      : ''

  const prompt = `Generate ${count} specific topic ideas for content creation based on these pillars.

CONTENT PILLARS:
${pillarsText}

VOICE PROFILE:
${voiceSummary}
${recentContext}

Return a JSON object:
{
  "topics": [
    {
      "topic": "<specific, concrete topic - a statement or question they could write about>",
      "pillar": "<which pillar this belongs to>",
      "reasoning": "<1 sentence explaining why this topic fits their voice and pillar>",
      "relevanceScore": <0-100, how well this matches their voice and pillars>,
      "trendinessScore": <0-100, how timely/trending this topic is>,
      "overallScore": <0-100, combined score for ranking>
    }
  ]
}

GUIDELINES:
- Topics should be specific and actionable (not vague)
- Mix of evergreen and timely topics
- Topics should sound like something THEY would write about
- Vary the approach: some controversial, some educational, some storytelling
- Each pillar should get at least 1-2 topics
- Order by overallScore (highest first)

GOOD topic examples:
- "Why most startups fail at hiring senior engineers"
- "The hidden cost of remote work nobody talks about"
- "How I rebuilt my team's trust after a failed launch"

BAD topic examples:
- "Leadership tips" (too vague)
- "How to be successful" (generic)
- "Monday motivation" (not personal)`

  const result = await generateJSON<{
    topics: Array<{
      topic: string
      pillar: string
      reasoning: string
      relevanceScore: number
      trendinessScore: number
      overallScore: number
    }>
  }>(prompt, {
    temperature: 0.7, // Higher for creative topic generation
    maxTokens: 4096,
  })

  return result?.topics || []
}

/**
 * Score how relevant a trend/news item is to a persona's pillars
 * Used for filtering trending topics
 */
export async function scoreTrendRelevance(
  trendTitle: string,
  trendSummary: string,
  pillars: Array<{ name: string; description: string }>,
  voiceSummary: string
): Promise<{
  relevanceScore: number // 0-100
  matchedPillars: string[]
  hasConflict: boolean
  conflictReason: string | null
  suggestedAngle: string | null // How they could approach this trend
}> {
  const pillarsText = pillars.map((p) => `- ${p.name}: ${p.description}`).join('\n')

  const prompt = `Evaluate if this trending topic is relevant to this person's content strategy.

TREND:
Title: ${trendTitle}
Summary: ${trendSummary}

PERSON'S VOICE PROFILE:
${voiceSummary}

THEIR CONTENT PILLARS:
${pillarsText}

Return a JSON object:
{
  "relevanceScore": <0-100, how relevant is this trend to their pillars and voice>,
  "matchedPillars": [<array of pillar names this trend relates to>],
  "hasConflict": <boolean, does this trend conflict with their values or voice?>,
  "conflictReason": <string or null, why it conflicts if true>,
  "suggestedAngle": <string or null, how they could uniquely approach this trend>
}

SCORING GUIDE:
- 80-100: Highly relevant, perfect fit for their content
- 60-79: Relevant, could write about with their angle
- 40-59: Somewhat relevant, but may need strong angle
- 20-39: Loosely related, probably skip
- 0-19: Not relevant to their content

CONFLICT DETECTION:
- Check if trend contradicts their known opinions
- Check if tone/topic is incompatible with their voice
- Check if trend is outside their expertise area`

  const result = await generateJSON<{
    relevanceScore: number
    matchedPillars: string[]
    hasConflict: boolean
    conflictReason: string | null
    suggestedAngle: string | null
  }>(prompt, { temperature: 0.3 })

  return (
    result || {
      relevanceScore: 0,
      matchedPillars: [],
      hasConflict: false,
      conflictReason: null,
      suggestedAngle: null,
    }
  )
}
