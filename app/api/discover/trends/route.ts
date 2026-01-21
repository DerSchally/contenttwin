import { NextRequest, NextResponse } from 'next/server'
import { getMockTrends, scoreAndFilterTrends } from '@/lib/trends/scanner'
import type { ApiResponse } from '@/types/database'

export const runtime = 'edge'
export const maxDuration = 60

interface DiscoverTrendsRequest {
  pillars: Array<{
    name: string
    description: string
  }>
  voiceSummary: string
  minRelevanceScore?: number
}

/**
 * POST /api/discover/trends
 * Get trending topics scored and filtered by persona's pillars
 */
export async function POST(request: NextRequest) {
  try {
    const body: DiscoverTrendsRequest = await request.json()

    if (!body.pillars || body.pillars.length === 0) {
      return NextResponse.json<ApiResponse<null>>(
        {
          data: null,
          error: 'Please provide at least one content pillar',
        },
        { status: 400 }
      )
    }

    if (!body.voiceSummary) {
      return NextResponse.json<ApiResponse<null>>(
        {
          data: null,
          error: 'Voice summary is required',
        },
        { status: 400 }
      )
    }

    // Get trending topics (using mock data for MVP)
    // In production, this would use Firecrawl to scan real sources
    const rawTrends = getMockTrends()

    // Score and filter by relevance
    const scoredTrends = await scoreAndFilterTrends(
      rawTrends,
      body.pillars,
      body.voiceSummary,
      body.minRelevanceScore || 60
    )

    return NextResponse.json<ApiResponse<typeof scoredTrends>>(
      {
        data: scoredTrends,
        error: null,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[DiscoverTrends]', error)
    return NextResponse.json<ApiResponse<null>>(
      {
        data: null,
        error: 'Failed to discover trends. Please try again.',
      },
      { status: 500 }
    )
  }
}
