import { NextRequest, NextResponse } from 'next/server'
import { suggestTopics } from '@/lib/ai/pillar-discovery'
import type { ApiResponse } from '@/types/database'

export const runtime = 'edge'
export const maxDuration = 60

interface SuggestTopicsRequest {
  pillars: Array<{
    name: string
    description: string
    example_topics: string[]
  }>
  voiceSummary: string
  recentTopics?: string[]
  count?: number
}

/**
 * POST /api/discover/topics
 * Generate topic suggestions based on pillars and voice
 */
export async function POST(request: NextRequest) {
  try {
    const body: SuggestTopicsRequest = await request.json()

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

    const topics = await suggestTopics(
      body.pillars,
      body.voiceSummary,
      body.recentTopics || [],
      body.count || 10
    )

    return NextResponse.json<ApiResponse<typeof topics>>(
      {
        data: topics,
        error: null,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[SuggestTopics]', error)
    return NextResponse.json<ApiResponse<null>>(
      {
        data: null,
        error: 'Failed to generate topic suggestions. Please try again.',
      },
      { status: 500 }
    )
  }
}
