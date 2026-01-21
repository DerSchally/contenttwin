import { NextRequest, NextResponse } from 'next/server'
import { discoverPillars } from '@/lib/ai/pillar-discovery'
import type { ApiResponse } from '@/types/database'

export const runtime = 'edge'
export const maxDuration = 60 // Allow up to 60 seconds for AI processing

interface DiscoverPillarsRequest {
  posts: string[]
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
