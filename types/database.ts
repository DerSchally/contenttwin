// Database types for ContentTwin

export type Platform = 'linkedin' | 'instagram'
export type ContentType = 'short' | 'long' | 'article'
export type SubscriptionTier = 'free' | 'pro' | 'business'
export type PerformanceTier = 'top' | 'above_average' | 'average' | 'below_average' | 'underperforming'
export type GenerationStatus = 'generating' | 'generated' | 'accepted' | 'rejected' | 'refined'
export type FeedbackAction = 'accept' | 'reject' | 'edit'
export type CalendarStatus = 'planned' | 'draft' | 'ready' | 'published' | 'skipped'
export type RejectionReason = 'tone' | 'length' | 'off_topic' | 'not_me' | 'other'

// User Profile
export interface UserProfile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  subscription_tier: SubscriptionTier
  subscription_status: string
  created_at: string
  updated_at: string
}

// Persona (Content Twin)
export interface Persona {
  id: string
  user_id: string
  name: string
  platform: Platform
  description: string | null
  settings: Record<string, unknown>
  is_active: boolean
  created_at: string
  updated_at: string
}

// Structural patterns in voice profile
export interface StructuralPatterns {
  avg_sentence_length: number
  avg_paragraph_length: number
  uses_lists: boolean
  list_frequency: number
  hook_patterns: string[]
  cta_patterns: string[]
  post_structure: string[]
}

// Linguistic patterns in voice profile
export interface LinguisticPatterns {
  common_words: { word: string; frequency: number }[]
  common_phrases: { phrase: string; frequency: number }[]
  tone_markers: { formal: number; casual: number; humorous: number }
  emoji_usage: { uses_emoji: boolean; common_emoji: string[]; frequency: number }
  punctuation_style: {
    uses_ellipsis: boolean
    uses_dashes: boolean
    exclamation_frequency: number
  }
}

// Content patterns in voice profile
export interface ContentPatterns {
  topics: string[]
  opinions: { topic: string; stance: string }[]
  recurring_stories: string[]
  frameworks: string[]
  values: string[]
}

// Voice Profile
export interface VoiceProfile {
  id: string
  persona_id: string
  version: number
  is_current: boolean
  structural_patterns: StructuralPatterns
  linguistic_patterns: LinguisticPatterns
  content_patterns: ContentPatterns
  voice_summary: string | null
  posts_analyzed: number
  last_updated_from_post_id: string | null
  created_at: string
}

// Voice Overlay (context-specific adjustments)
export interface VoiceOverlay {
  id: string
  voice_profile_id: string
  name: string
  adjustments: {
    tone_shift: number // -1 to 1
    length_preference: 'shorter' | 'longer' | 'same'
    structure_override?: string[]
    additional_patterns?: Record<string, unknown>
  }
  is_active: boolean
  created_at: string
}

// Post (training data)
export interface Post {
  id: string
  persona_id: string
  content: string
  content_encrypted: string | null
  content_type: ContentType
  impressions: number | null
  likes: number | null
  comments: number | null
  reposts: number | null
  profile_views: number | null
  engagement_rate: number | null
  performance_score: number | null
  performance_tier: PerformanceTier | null
  posted_at: string | null
  platform_post_id: string | null
  source: 'manual' | 'import' | 'api'
  extracted_topics: string[] | null
  extracted_patterns: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

// Content Pillar
export interface ContentPillar {
  id: string
  persona_id: string
  name: string
  description: string | null
  example_topics: string[] | null
  post_count: number
  avg_performance: number | null
  is_active: boolean
  sort_order: number
  created_at: string
}

// Voice Match Breakdown
export interface VoiceMatchBreakdown {
  structure: number
  tone: number
  vocabulary: number
}

// Generated Variation
export interface GeneratedVariation {
  id: string
  content: string
  voice_match_score: number
  voice_match_breakdown: VoiceMatchBreakdown
}

// Generation Context
export interface GenerationContext {
  similar_posts: string[]
  recent_posts: string[]
  trends_included: string[]
  voice_profile_version: number
}

// Generation
export interface Generation {
  id: string
  persona_id: string
  voice_profile_id: string | null
  topic: string
  creativity_level: number
  content_type: ContentType
  pillar_id: string | null
  overlay_id: string | null
  context_used: GenerationContext | null
  variations: GeneratedVariation[]
  status: GenerationStatus
  selected_variation_id: string | null
  final_content: string | null
  generation_time_ms: number | null
  created_at: string
}

// Refinement Message
export interface RefinementMessage {
  role: 'user' | 'assistant'
  content: string
}

// Generation Feedback
export interface GenerationFeedback {
  id: string
  generation_id: string
  variation_id: string
  action: FeedbackAction
  rejection_reasons: RejectionReason[] | null
  rejection_note: string | null
  original_content: string | null
  edited_content: string | null
  edit_diff: Record<string, unknown> | null
  refinement_messages: RefinementMessage[] | null
  created_at: string
}

// Calendar Item
export interface CalendarItem {
  id: string
  persona_id: string
  scheduled_date: string
  scheduled_time: string | null
  topic: string
  pillar_id: string | null
  content_type: ContentType
  status: CalendarStatus
  generation_id: string | null
  topic_reasoning: string | null
  sort_order: number
  created_at: string
  updated_at: string
}

// Trend
export interface Trend {
  id: string
  title: string
  summary: string | null
  source_url: string | null
  source_name: string | null
  category: string | null
  relevance_keywords: string[] | null
  trending_score: number | null
  discovered_at: string
  expires_at: string | null
  is_active: boolean
}

// Persona-Trend relationship
export interface PersonaTrend {
  persona_id: string
  trend_id: string
  relevance_score: number | null
  has_conflict: boolean
  conflict_reason: string | null
  is_used: boolean
}

// API Response types
export interface ApiResponse<T> {
  data: T | null
  error: string | null
}

// Generation Request
export interface GenerateRequest {
  topic: string
  contentType: ContentType
  creativityLevel: number
  pillarId?: string
  overlayId?: string
}

// Feedback Request
export interface FeedbackRequest {
  variationId: string
  action: FeedbackAction
  rejectionReasons?: RejectionReason[]
  rejectionNote?: string
  originalContent?: string
  editedContent?: string
}
