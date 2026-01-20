import { NextResponse } from 'next/server'
import { generateContent } from '@/lib/ai/content-generator'
import { analyzeVoice } from '@/lib/ai/voice-analyzer'
import type { ContentType } from '@/types/database'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      topic,
      contentType = 'long',
      creativityLevel = 30,
      samplePosts = [],
      trends = [],
    } = body as {
      topic: string
      contentType?: ContentType
      creativityLevel?: number
      samplePosts?: string[]
      trends?: string[]
    }

    if (!topic || topic.trim().length === 0) {
      return NextResponse.json(
        { data: null, error: 'Topic is required' },
        { status: 400 }
      )
    }

    // Analyze voice from sample posts if provided
    let voiceProfile = null
    if (samplePosts.length > 0) {
      voiceProfile = await analyzeVoice(samplePosts)
    }

    // Generate content variations
    const result = await generateContent({
      topic: topic.trim(),
      contentType,
      creativityLevel,
      voiceProfile,
      samplePosts,
      trends,
    })

    return NextResponse.json({
      data: {
        variations: result.variations,
        generationTimeMs: result.generationTimeMs,
        voiceProfileUsed: !!voiceProfile,
      },
      error: null,
    })
  } catch (error) {
    console.error('[Generate API Error]', error)
    return NextResponse.json(
      { data: null, error: 'Failed to generate content' },
      { status: 500 }
    )
  }
}
