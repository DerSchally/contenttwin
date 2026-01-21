import { scoreTrendRelevance } from '@/lib/ai/pillar-discovery'

export interface TrendSource {
  name: string
  url: string
  keywords: string[] // Keywords to search for
}

export interface ScannedTrend {
  title: string
  summary: string
  source_url: string
  source_name: string
  keywords: string[]
  discovered_at: string
  raw_content?: string
}

export interface ScoredTrend extends ScannedTrend {
  relevance_score: number
  matched_pillars: string[]
  has_conflict: boolean
  conflict_reason: string | null
  suggested_angle: string | null
  trending_score: number
}

/**
 * Scan for trends using Firecrawl MCP search
 * This will be called by a cron job or on-demand
 */
export async function scanTrends(
  sources: TrendSource[],
  firecrawlSearch: (query: string) => Promise<Array<{ title: string; summary: string; url: string }>>
): Promise<ScannedTrend[]> {
  const allTrends: ScannedTrend[] = []

  for (const source of sources) {
    try {
      // Search for each keyword
      for (const keyword of source.keywords.slice(0, 3)) {
        // Limit to 3 keywords per source
        const results = await firecrawlSearch(keyword)

        // Take top 5 results per keyword
        const trends = results.slice(0, 5).map((result) => ({
          title: result.title,
          summary: result.summary || result.title,
          source_url: result.url,
          source_name: source.name,
          keywords: [keyword],
          discovered_at: new Date().toISOString(),
        }))

        allTrends.push(...trends)
      }
    } catch (error) {
      console.error(`[TrendScanner] Failed to scan ${source.name}:`, error)
      // Continue with other sources
    }
  }

  // Deduplicate by title (case-insensitive)
  const uniqueTrends = Array.from(
    new Map(allTrends.map((t) => [t.title.toLowerCase(), t])).values()
  )

  return uniqueTrends
}

/**
 * Score and filter trends based on persona's pillars and voice
 */
export async function scoreAndFilterTrends(
  trends: ScannedTrend[],
  pillars: Array<{ name: string; description: string }>,
  voiceSummary: string,
  minRelevanceScore: number = 60 // Only return trends with score >= this
): Promise<ScoredTrend[]> {
  const scoredTrends: ScoredTrend[] = []

  for (const trend of trends) {
    try {
      const scoring = await scoreTrendRelevance(
        trend.title,
        trend.summary,
        pillars,
        voiceSummary
      )

      // Calculate trending score based on recency (simple version)
      // In production, this would use actual trend data from sources
      const trendingScore = 75 // Default for now

      if (scoring.relevanceScore >= minRelevanceScore) {
        scoredTrends.push({
          ...trend,
          ...scoring,
          trending_score: trendingScore,
        })
      }
    } catch (error) {
      console.error(`[TrendScorer] Failed to score trend "${trend.title}":`, error)
      // Skip this trend
    }
  }

  // Sort by relevance score (highest first)
  return scoredTrends.sort((a, b) => b.relevance_score - a.relevance_score)
}

/**
 * Generate trend sources from persona's pillars
 * These are the keywords we'll use to search for trends
 */
export function generateTrendSources(
  pillars: Array<{ name: string; description: string; example_topics: string[] }>,
  platform: 'linkedin' | 'instagram' = 'linkedin'
): TrendSource[] {
  // Extract keywords from pillars
  const keywords = pillars.flatMap((pillar) => {
    // Use pillar name + example topics as keywords
    return [pillar.name, ...pillar.example_topics.slice(0, 2)]
  })

  // Define default sources based on platform
  const linkedinSources: TrendSource[] = [
    {
      name: 'LinkedIn News',
      url: 'https://www.linkedin.com/news',
      keywords: keywords.slice(0, 5), // Top 5 keywords
    },
    {
      name: 'Tech News',
      url: 'https://news.ycombinator.com',
      keywords: keywords.filter((k) =>
        k.toLowerCase().includes('tech') ||
        k.toLowerCase().includes('startup') ||
        k.toLowerCase().includes('engineering')
      ),
    },
  ]

  const instagramSources: TrendSource[] = [
    {
      name: 'Instagram Trends',
      url: 'https://www.instagram.com/explore',
      keywords: keywords.slice(0, 5),
    },
  ]

  return platform === 'linkedin' ? linkedinSources : instagramSources
}

/**
 * Simple in-memory trending topics (for MVP without external APIs)
 * In production, this would be replaced with actual trend scanning
 */
export function getMockTrends(): ScannedTrend[] {
  return [
    {
      title: 'AI agents are replacing junior developers in 2026',
      summary: 'Major tech companies report 40% reduction in junior developer hiring as AI coding assistants become more capable',
      source_url: 'https://example.com/ai-developers',
      source_name: 'Tech News',
      keywords: ['AI', 'hiring', 'developers'],
      discovered_at: new Date().toISOString(),
    },
    {
      title: 'Remote work exodus: Companies mandate 4-day office returns',
      summary: 'Wave of return-to-office mandates hits tech industry, sparking debate about productivity and culture',
      source_url: 'https://example.com/remote-work',
      source_name: 'LinkedIn News',
      keywords: ['remote work', 'culture', 'productivity'],
      discovered_at: new Date().toISOString(),
    },
    {
      title: 'Startup funding hits 5-year low in Q1 2026',
      summary: 'VC funding drops 60% year-over-year as investors focus on profitability over growth',
      source_url: 'https://example.com/funding',
      source_name: 'Business News',
      keywords: ['startup', 'funding', 'VC'],
      discovered_at: new Date().toISOString(),
    },
    {
      title: 'LinkedIn introduces AI-powered content scoring',
      summary: 'New algorithm ranks content based on authenticity and expertise, not just engagement',
      source_url: 'https://example.com/linkedin-ai',
      source_name: 'LinkedIn News',
      keywords: ['LinkedIn', 'content', 'AI'],
      discovered_at: new Date().toISOString(),
    },
    {
      title: 'Four-day work week trials show 91% success rate',
      summary: 'Global study finds productivity increased while burnout decreased in 4-day week pilots',
      source_url: 'https://example.com/4-day-week',
      source_name: 'Work Culture',
      keywords: ['work culture', 'productivity', 'leadership'],
      discovered_at: new Date().toISOString(),
    },
  ]
}
