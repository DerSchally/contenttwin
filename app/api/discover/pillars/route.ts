import { NextRequest, NextResponse } from 'next/server'
import { discoverPillars } from '@/lib/ai/pillar-discovery'
import { analyzeMultipleDecks, enrichPillarsWithDecks } from '@/lib/ai/deck-analyzer'
import { parsePastedDeckText } from '@/lib/decks/extractor'
import type { ApiResponse } from '@/types/database'

export const runtime = 'edge'
export const maxDuration = 60 // Allow up to 60 seconds for AI processing

interface DiscoverPillarsRequest {
  posts: string[]
  decks?: string[] // Optional: pasted deck content
}

/**
 * POST /api/discover/pillars
 * Analyze user's posts and discover content pillars
 */
export async function POST(request: NextRequest) {
  try {
    const body: DiscoverPillarsRequest = await request.json()

    if (!body.posts || !Array.isArray(body.posts) || body.posts.length < 3) {
      return NextResponse.json<ApiResponse<null>>(
        {
          data: null,
          error: 'Please provide at least 3 posts for pillar discovery',
        },
        { status: 400 }
      )
    }

    // Filter out empty posts
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

    // Limit to first 20 posts for performance
    const postsToAnalyze = validPosts.slice(0, 20)

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
