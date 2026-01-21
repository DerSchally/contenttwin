import { NextRequest, NextResponse } from 'next/server'
import { discoverPillars } from '@/lib/ai/pillar-discovery'
import { analyzeMultipleDecks, enrichPillarsWithDecks } from '@/lib/ai/deck-analyzer'
import { parsePastedDeckText } from '@/lib/decks/extractor'
import type { ApiResponse } from '@/types/database'

export const runtime = 'edge'
export const maxDuration = 60 // Allow up to 60 seconds for AI processing

interface DiscoverPillarsRequest {
  postLinks?: string[] // LinkedIn/social media post URLs
  posts?: string[] // Fallback: direct text content (legacy)
  decks?: string[] // Optional: pasted deck content
}

/**
 * Scrape content from a LinkedIn URL using Firecrawl
 */
async function scrapeLinkedInPost(url: string): Promise<string | null> {
  try {
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.FIRECRAWL_API_KEY}`,
      },
      body: JSON.stringify({
        url,
        formats: ['markdown'],
        onlyMainContent: true,
      }),
    })

    if (!response.ok) {
      console.error(`[Scrape] Failed to fetch ${url}: ${response.statusText}`)
      return null
    }

    const data = await response.json()
    return data.data?.markdown || null
  } catch (error) {
    console.error(`[Scrape] Error scraping ${url}:`, error)
    return null
  }
}

/**
 * POST /api/discover/pillars
 * Analyze user's posts and discover content pillars
 */
export async function POST(request: NextRequest) {
  try {
    const body: DiscoverPillarsRequest = await request.json()

    let postsContent: string[] = []

    // Handle postLinks (new method: scrape from URLs)
    if (body.postLinks && Array.isArray(body.postLinks) && body.postLinks.length > 0) {
      const validLinks = body.postLinks.filter((link) => {
        try {
          const url = new URL(link)
          return url.hostname.includes('linkedin.com')
        } catch {
          return false
        }
      })

      if (validLinks.length < 3) {
        return NextResponse.json<ApiResponse<null>>(
          {
            data: null,
            error: 'Please provide at least 3 valid LinkedIn post URLs',
          },
          { status: 400 }
        )
      }

      // Scrape content from URLs (limit to first 20)
      const linksToScrape = validLinks.slice(0, 20)
      const scrapePromises = linksToScrape.map((link) => scrapeLinkedInPost(link))
      const scrapedContent = await Promise.all(scrapePromises)

      // Filter out failed scrapes
      postsContent = scrapedContent.filter((content): content is string =>
        content !== null && content.trim().length > 50
      )

      if (postsContent.length < 3) {
        return NextResponse.json<ApiResponse<null>>(
          {
            data: null,
            error: 'Could not fetch enough content from the provided URLs. Please check the links and try again.',
          },
          { status: 400 }
        )
      }
    }
    // Handle posts (legacy method: direct text content)
    else if (body.posts && Array.isArray(body.posts) && body.posts.length > 0) {
      const validPosts = body.posts.filter((p) => p.trim().length > 50)

      if (validPosts.length < 3) {
        return NextResponse.json<ApiResponse<null>>(
          {
            data: null,
            error: 'Posts are too short. Each post should be at least 50 characters.',
          },
          { status: 400 }
        )
      }

      postsContent = validPosts.slice(0, 20)
    }
    // No valid input provided
    else {
      return NextResponse.json<ApiResponse<null>>(
        {
          data: null,
          error: 'Please provide at least 3 post links or post content',
        },
        { status: 400 }
      )
    }

    // Limit to first 20 posts for performance
    const postsToAnalyze = postsContent.slice(0, 20)

    // Discover pillars from posts
    const result = await discoverPillars(postsToAnalyze)

    if (!result) {
      return NextResponse.json<ApiResponse<null>>(
        {
          data: null,
          error: 'Failed to discover pillars. Please try again.',
        },
        { status: 500 }
      )
    }

    // If decks provided, analyze and enrich pillars
    if (body.decks && body.decks.length > 0) {
      const parsedDecks = body.decks
        .map((deckText, i) => parsePastedDeckText(deckText, `Deck ${i + 1}`))
        .filter((d) => d.extractedText.length > 100)

      if (parsedDecks.length > 0) {
        const deckAnalysis = await analyzeMultipleDecks(parsedDecks)

        if (deckAnalysis) {
          const enrichedPillars = await enrichPillarsWithDecks(result.pillars, deckAnalysis)

          // Update summary to include deck insights
          const enrichedSummary = `${result.summary}\n\nDeck Analysis: ${deckAnalysis.overallVoice.contentDNA}`

          return NextResponse.json<ApiResponse<typeof result>>(
            {
              data: {
                pillars: enrichedPillars,
                summary: enrichedSummary,
              },
              error: null,
            },
            { status: 200 }
          )
        }
      }
    }

    return NextResponse.json<ApiResponse<typeof result>>(
      {
        data: result,
        error: null,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[DiscoverPillars]', error)
    return NextResponse.json<ApiResponse<null>>(
      {
        data: null,
        error: 'Failed to discover pillars. Please try again.',
      },
      { status: 500 }
    )
  }
}
