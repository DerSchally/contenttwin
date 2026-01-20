# ContentTwin - Technical Specification

## Overview
This document provides detailed technical specifications for implementing ContentTwin, including database schema, API endpoints, component architecture, and user flows.

---

## Database Schema

### Core Tables

```sql
-- Users (managed by Supabase Auth, extended)
CREATE TABLE public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'business')),
  subscription_status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Personas (content twins)
CREATE TABLE public.personas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- e.g., "LinkedIn - Business Sebastian"
  platform TEXT NOT NULL CHECK (platform IN ('linkedin', 'instagram')),
  description TEXT, -- What this persona is about
  settings JSONB DEFAULT '{}', -- Platform-specific settings
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- Voice Profiles (versioned)
CREATE TABLE public.voice_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  persona_id UUID NOT NULL REFERENCES public.personas(id) ON DELETE CASCADE,
  version INTEGER NOT NULL DEFAULT 1,
  is_current BOOLEAN DEFAULT true,

  -- Structural patterns
  structural_patterns JSONB NOT NULL DEFAULT '{}',
  -- {
  --   avg_sentence_length: number,
  --   avg_paragraph_length: number,
  --   uses_lists: boolean,
  --   list_frequency: number,
  --   hook_patterns: string[],
  --   cta_patterns: string[],
  --   post_structure: string[] // e.g., ["hook", "story", "insight", "cta"]
  -- }

  -- Linguistic fingerprint
  linguistic_patterns JSONB NOT NULL DEFAULT '{}',
  -- {
  --   common_words: {word: string, frequency: number}[],
  --   common_phrases: {phrase: string, frequency: number}[],
  --   tone_markers: {formal: number, casual: number, humorous: number},
  --   emoji_usage: {uses_emoji: boolean, common_emoji: string[], frequency: number},
  --   punctuation_style: {uses_ellipsis: boolean, uses_dashes: boolean, exclamation_frequency: number}
  -- }

  -- Content DNA
  content_patterns JSONB NOT NULL DEFAULT '{}',
  -- {
  --   topics: string[],
  --   opinions: {topic: string, stance: string}[],
  --   recurring_stories: string[],
  --   frameworks: string[],
  --   values: string[]
  -- }

  -- AI-generated summary
  voice_summary TEXT, -- Natural language description of the voice

  -- Metadata
  posts_analyzed INTEGER DEFAULT 0,
  last_updated_from_post_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(persona_id, version)
);

-- Context Overlays (for different content types)
CREATE TABLE public.voice_overlays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  voice_profile_id UUID NOT NULL REFERENCES public.voice_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- e.g., "Educational", "Storytelling", "Thought Leadership"
  adjustments JSONB NOT NULL DEFAULT '{}',
  -- {
  --   tone_shift: number, -- -1 to 1 (more casual to more formal)
  --   length_preference: "shorter" | "longer" | "same",
  --   structure_override: string[],
  --   additional_patterns: {...}
  -- }
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(voice_profile_id, name)
);

-- User's past posts (training data)
CREATE TABLE public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  persona_id UUID NOT NULL REFERENCES public.personas(id) ON DELETE CASCADE,

  -- Content
  content TEXT NOT NULL,
  content_encrypted TEXT, -- Encrypted version for sensitive storage
  content_type TEXT NOT NULL CHECK (content_type IN ('short', 'long', 'article')),

  -- Metrics (from copy-paste input)
  impressions INTEGER,
  likes INTEGER,
  comments INTEGER,
  reposts INTEGER,
  profile_views INTEGER,

  -- Calculated metrics
  engagement_rate DECIMAL(5,4), -- (likes + comments + reposts) / impressions
  performance_score DECIMAL(5,2), -- Normalized 0-100 score
  performance_tier TEXT CHECK (performance_tier IN ('top', 'above_average', 'average', 'below_average', 'underperforming')),

  -- Metadata
  posted_at TIMESTAMPTZ,
  platform_post_id TEXT, -- Original post ID if available
  source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'import', 'api')),

  -- AI analysis
  extracted_topics TEXT[],
  extracted_patterns JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Content Pillars
CREATE TABLE public.content_pillars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  persona_id UUID NOT NULL REFERENCES public.personas(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  example_topics TEXT[],
  post_count INTEGER DEFAULT 0,
  avg_performance DECIMAL(5,2),
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(persona_id, name)
);

-- Link posts to pillars
CREATE TABLE public.post_pillars (
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  pillar_id UUID REFERENCES public.content_pillars(id) ON DELETE CASCADE,
  confidence DECIMAL(3,2), -- AI confidence in categorization
  PRIMARY KEY (post_id, pillar_id)
);

-- Generated content
CREATE TABLE public.generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  persona_id UUID NOT NULL REFERENCES public.personas(id) ON DELETE CASCADE,
  voice_profile_id UUID REFERENCES public.voice_profiles(id),

  -- Input
  topic TEXT NOT NULL,
  creativity_level INTEGER NOT NULL CHECK (creativity_level BETWEEN 0 AND 100),
  content_type TEXT NOT NULL CHECK (content_type IN ('short', 'long')),
  pillar_id UUID REFERENCES public.content_pillars(id),
  overlay_id UUID REFERENCES public.voice_overlays(id),

  -- Context used (for debugging/learning)
  context_used JSONB,
  -- {
  --   similar_posts: uuid[],
  --   recent_posts: uuid[],
  --   trends_included: string[],
  --   voice_profile_version: number
  -- }

  -- Output
  variations JSONB NOT NULL,
  -- [
  --   {
  --     id: string,
  --     content: string,
  --     voice_match_score: number,
  --     voice_match_breakdown: {structure: number, tone: number, vocabulary: number}
  --   }
  -- ]

  -- Status
  status TEXT DEFAULT 'generated' CHECK (status IN ('generating', 'generated', 'accepted', 'rejected', 'refined')),
  selected_variation_id TEXT, -- Which variation was chosen
  final_content TEXT, -- After any edits

  -- Timing
  generation_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Feedback on generations
CREATE TABLE public.generation_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  generation_id UUID NOT NULL REFERENCES public.generations(id) ON DELETE CASCADE,
  variation_id TEXT NOT NULL, -- Which variation this feedback is for

  -- Feedback type
  action TEXT NOT NULL CHECK (action IN ('accept', 'reject', 'edit')),

  -- Rejection details (only if rejected)
  rejection_reasons TEXT[], -- Array of: 'tone', 'length', 'off_topic', 'not_me', 'other'
  rejection_note TEXT,

  -- Edit details (only if edited)
  original_content TEXT,
  edited_content TEXT,
  edit_diff JSONB, -- Structured diff for learning

  -- Refinement history
  refinement_messages JSONB,
  -- [
  --   {role: "user", content: "make it punchier"},
  --   {role: "assistant", content: "...revised content..."}
  -- ]

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Content Calendar
CREATE TABLE public.calendar_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  persona_id UUID NOT NULL REFERENCES public.personas(id) ON DELETE CASCADE,

  -- Scheduling
  scheduled_date DATE NOT NULL,
  scheduled_time TIME, -- Optional specific time

  -- Content
  topic TEXT NOT NULL,
  pillar_id UUID REFERENCES public.content_pillars(id),
  content_type TEXT NOT NULL CHECK (content_type IN ('short', 'long')),

  -- Status flow: planned -> draft -> ready -> published
  status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'draft', 'ready', 'published', 'skipped')),

  -- Link to generation when created
  generation_id UUID REFERENCES public.generations(id),

  -- AI reasoning
  topic_reasoning TEXT, -- Why AI suggested this topic

  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trends
CREATE TABLE public.trends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Content
  title TEXT NOT NULL,
  summary TEXT,
  source_url TEXT,
  source_name TEXT,

  -- Categorization
  category TEXT,
  relevance_keywords TEXT[],

  -- Scoring
  trending_score DECIMAL(5,2), -- How "hot" is this trend

  -- Timing
  discovered_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ, -- When this trend is no longer relevant

  is_active BOOLEAN DEFAULT true
);

-- Link trends to personas (relevance)
CREATE TABLE public.persona_trends (
  persona_id UUID REFERENCES public.personas(id) ON DELETE CASCADE,
  trend_id UUID REFERENCES public.trends(id) ON DELETE CASCADE,
  relevance_score DECIMAL(3,2), -- How relevant to this persona
  has_conflict BOOLEAN DEFAULT false, -- Conflicts with persona's voice
  conflict_reason TEXT,
  is_used BOOLEAN DEFAULT false,
  PRIMARY KEY (persona_id, trend_id)
);

-- Indexes for performance
CREATE INDEX idx_personas_user ON public.personas(user_id);
CREATE INDEX idx_voice_profiles_persona ON public.voice_profiles(persona_id);
CREATE INDEX idx_voice_profiles_current ON public.voice_profiles(persona_id) WHERE is_current = true;
CREATE INDEX idx_posts_persona ON public.posts(persona_id);
CREATE INDEX idx_posts_performance ON public.posts(persona_id, performance_tier);
CREATE INDEX idx_generations_persona ON public.generations(persona_id);
CREATE INDEX idx_calendar_persona_date ON public.calendar_items(persona_id, scheduled_date);
CREATE INDEX idx_trends_active ON public.trends(is_active, discovered_at DESC);

-- Row Level Security
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_overlays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_pillars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_pillars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generation_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.persona_trends ENABLE ROW LEVEL SECURITY;

-- RLS Policies (user can only access their own data)
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "Users can manage own personas" ON public.personas
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Users can manage own voice profiles" ON public.voice_profiles
  FOR ALL USING (
    persona_id IN (SELECT id FROM public.personas WHERE user_id = auth.uid())
  );

-- (Similar policies for all other tables)
```

---

## API Endpoints

### Authentication
```
POST   /api/auth/signup          - Create account
POST   /api/auth/login           - Email/password login
POST   /api/auth/logout          - End session
GET    /api/auth/session         - Get current session
POST   /api/auth/callback        - OAuth callback
```

### Personas
```
GET    /api/personas             - List user's personas
POST   /api/personas             - Create persona
GET    /api/personas/:id         - Get persona details
PATCH  /api/personas/:id         - Update persona
DELETE /api/personas/:id         - Delete persona (soft)
```

### Posts (Training Data)
```
GET    /api/personas/:id/posts           - List posts
POST   /api/personas/:id/posts           - Add single post
POST   /api/personas/:id/posts/bulk      - Bulk import posts
GET    /api/personas/:id/posts/:postId   - Get post details
DELETE /api/personas/:id/posts/:postId   - Delete post
```

### Voice Profile
```
GET    /api/personas/:id/voice                    - Get current voice profile
POST   /api/personas/:id/voice/analyze            - Trigger voice analysis
GET    /api/personas/:id/voice/versions           - List profile versions
GET    /api/personas/:id/voice/versions/:version  - Get specific version
POST   /api/personas/:id/voice/overlays           - Create overlay
PATCH  /api/personas/:id/voice/overlays/:overlayId - Update overlay
```

### Content Generation
```
POST   /api/personas/:id/generate                 - Generate content (returns 3 variations)
POST   /api/personas/:id/generate/:genId/refine   - Refine with chat
GET    /api/personas/:id/generations              - List past generations
GET    /api/personas/:id/generations/:genId       - Get generation details
```

### Feedback
```
POST   /api/generations/:id/feedback              - Submit feedback (accept/reject/edit)
GET    /api/personas/:id/feedback/stats           - Feedback statistics
```

### Calendar
```
GET    /api/personas/:id/calendar                 - Get calendar items
POST   /api/personas/:id/calendar/plan            - AI generates 4-week plan
POST   /api/personas/:id/calendar                 - Add calendar item
PATCH  /api/personas/:id/calendar/:itemId         - Update item
DELETE /api/personas/:id/calendar/:itemId         - Remove item
POST   /api/personas/:id/calendar/:itemId/generate - Generate draft for item
```

### Content Pillars
```
GET    /api/personas/:id/pillars                  - List pillars
POST   /api/personas/:id/pillars/discover         - AI discovers pillars
POST   /api/personas/:id/pillars                  - Create pillar manually
PATCH  /api/personas/:id/pillars/:pillarId        - Update pillar
DELETE /api/personas/:id/pillars/:pillarId        - Delete pillar
```

### Trends
```
GET    /api/personas/:id/trends                   - Get relevant trends
POST   /api/trends/scan                           - Trigger trend scan (cron)
POST   /api/personas/:id/trends/:trendId/use      - Mark trend as used
```

---

## API Request/Response Examples

### Generate Content
```typescript
// POST /api/personas/:id/generate
// Request
{
  "topic": "Why most startups fail at hiring",
  "contentType": "long",
  "creativityLevel": 40,
  "pillarId": "uuid-optional",
  "overlayId": "uuid-optional"
}

// Response
{
  "data": {
    "id": "gen-uuid",
    "variations": [
      {
        "id": "var-1",
        "content": "Most founders I talk to...",
        "voiceMatchScore": 87,
        "voiceMatchBreakdown": {
          "structure": 92,
          "tone": 85,
          "vocabulary": 84
        }
      },
      {
        "id": "var-2",
        "content": "Here's what nobody tells you about hiring...",
        "voiceMatchScore": 82,
        "voiceMatchBreakdown": {...}
      },
      {
        "id": "var-3",
        "content": "I've made every hiring mistake in the book...",
        "voiceMatchScore": 91,
        "voiceMatchBreakdown": {...}
      }
    ],
    "contextUsed": {
      "similarPosts": ["post-uuid-1", "post-uuid-2"],
      "recentPosts": ["post-uuid-3"],
      "trendsIncluded": ["Tech layoffs 2024"],
      "voiceProfileVersion": 3
    },
    "generationTimeMs": 4521
  },
  "error": null
}
```

### Submit Feedback
```typescript
// POST /api/generations/:id/feedback
// Request (rejection with reason)
{
  "variationId": "var-2",
  "action": "reject",
  "rejectionReasons": ["tone", "not_me"],
  "rejectionNote": "Too formal, I never start posts with 'Here's what'"
}

// Request (acceptance with edits)
{
  "variationId": "var-3",
  "action": "edit",
  "originalContent": "I've made every hiring mistake in the book...",
  "editedContent": "I've made every hiring mistake possible..."
}

// Response
{
  "data": {
    "id": "feedback-uuid",
    "learned": true,
    "profileUpdated": false // true if major learning occurred
  },
  "error": null
}
```

---

## Component Architecture

### Page Structure
```
/app
├── (marketing)                    # Public pages
│   ├── page.tsx                   # Landing page
│   ├── pricing/page.tsx
│   └── layout.tsx
├── (auth)                         # Auth pages
│   ├── login/page.tsx
│   ├── signup/page.tsx
│   └── layout.tsx
├── (dashboard)                    # Protected app pages
│   ├── layout.tsx                 # Dashboard layout with sidebar
│   ├── page.tsx                   # Dashboard home
│   ├── personas/
│   │   ├── page.tsx               # Persona list
│   │   ├── new/page.tsx           # Create persona
│   │   └── [id]/
│   │       ├── page.tsx           # Persona detail/overview
│   │       ├── posts/page.tsx     # Training posts
│   │       ├── voice/page.tsx     # Voice profile view
│   │       ├── generate/page.tsx  # Content generation
│   │       ├── calendar/page.tsx  # Content calendar
│   │       └── settings/page.tsx  # Persona settings
│   └── settings/page.tsx          # User settings
└── api/                           # API routes
```

### Component Hierarchy
```
/components
├── ui/                            # Base UI components
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── Input.tsx
│   ├── Textarea.tsx
│   ├── Select.tsx
│   ├── Slider.tsx                 # Creativity slider
│   ├── Badge.tsx
│   ├── Avatar.tsx
│   ├── Spinner.tsx
│   ├── Toast.tsx
│   └── Modal.tsx
├── layout/
│   ├── Sidebar.tsx
│   ├── Header.tsx
│   ├── PersonaSwitcher.tsx
│   └── MobileNav.tsx
├── persona/
│   ├── PersonaCard.tsx
│   ├── PersonaForm.tsx
│   └── PersonaStats.tsx
├── posts/
│   ├── PostForm.tsx               # Add single post
│   ├── PostList.tsx
│   ├── PostCard.tsx
│   ├── BulkImport.tsx
│   └── MetricsInput.tsx
├── voice/
│   ├── VoiceProfileCard.tsx
│   ├── VoicePatternViz.tsx        # Visual representation
│   ├── VoiceVersionHistory.tsx
│   └── OverlayManager.tsx
├── generate/
│   ├── GenerationForm.tsx         # Topic + settings input
│   ├── VariationCard.tsx          # Single variation display
│   ├── VariationList.tsx          # All 3 variations
│   ├── VoiceMatchBadge.tsx        # Score display
│   ├── RefinementChat.tsx         # Chat interface
│   └── FeedbackActions.tsx        # Accept/Reject/Edit
├── calendar/
│   ├── CalendarView.tsx           # Week/month calendar
│   ├── CalendarItem.tsx
│   ├── PlanningWizard.tsx         # 4-week planning
│   └── TopicSuggestion.tsx
├── pillars/
│   ├── PillarList.tsx
│   ├── PillarCard.tsx
│   └── PillarDiscovery.tsx
└── trends/
    ├── TrendList.tsx
    ├── TrendCard.tsx
    └── TrendConflictAlert.tsx
```

---

## User Flows

### Flow 1: Onboarding (New User)
```
1. User signs up (email or social)
2. Welcome screen → "Create your first Content Twin"
3. Create Persona form:
   - Name (e.g., "LinkedIn - Business")
   - Platform selection
   - Brief description
4. "Add your existing content" screen
   - Option A: Paste individual posts
   - Option B: Bulk import (JSON/CSV)
   - Minimum: 5 posts to start (10+ recommended)
5. For each post:
   - Content textarea
   - Metrics inputs (impressions, likes, comments)
   - Date posted
6. "Building your voice profile..." (loading with progress)
7. Voice profile preview:
   - Show extracted patterns
   - "Does this sound like you?" confirmation
8. First generation:
   - Suggest a topic based on pillars
   - Generate 3 variations
   - User selects favorite → "Your Content Twin is ready!"
```

### Flow 2: Daily Content Generation
```
1. User opens dashboard
2. See "Today's suggestion" or navigate to Generate
3. Enter topic (or accept suggestion)
4. Adjust creativity slider (default: 30)
5. Click "Generate"
6. View 3 variations with voice match scores
7. Option A: Accept variation → Copy to clipboard
   Option B: Reject → Select reason → AI learns
   Option C: Edit → Make changes → Save
   Option D: Refine → Chat to improve → Accept final
8. Update calendar item to "Published" (if from calendar)
```

### Flow 3: Weekly Planning
```
1. Navigate to Calendar
2. Click "Plan Next 4 Weeks"
3. AI proposes topics:
   - Week 1: "Leadership lesson from recent failure" (Pillar: Leadership)
   - Week 2: "Hot take on [trend]" (Pillar: Industry)
   - ...etc
4. Review each suggestion:
   - See reasoning
   - Accept / Modify / Replace
5. Finalize plan
6. Each item becomes a calendar entry with "Planned" status
7. As posting day approaches, generate drafts
```

### Flow 4: Voice Profile Refinement
```
1. Navigate to Voice Profile
2. See current profile with visualizations
3. Option A: "Add more content" → Import flow
4. Option B: "Review patterns" →
   - Show extracted patterns
   - User can confirm/correct
5. Option C: "Create overlay" →
   - Name the context (e.g., "Technical deep-dive")
   - Adjust tone, length preferences
6. View version history
7. Compare versions if needed
8. Rollback if profile drifted wrong
```

---

## Edge Cases & Error Handling

### Content Input
- **Empty content**: Show validation error, require minimum 50 characters
- **Duplicate content**: Warn user, allow override
- **Missing metrics**: Allow save, but flag as incomplete for learning
- **Invalid date**: Default to today, warn user
- **Bulk import errors**: Show row-by-row errors, allow partial import

### Voice Profile
- **Insufficient data**: Require minimum 5 posts before analysis
- **Conflicting patterns**: Flag and show user, let them resolve
- **Profile drift**: Detect when new content significantly differs, prompt user
- **Version limit**: Keep last 10 versions, archive older ones

### Content Generation
- **AI timeout**: Show error, offer retry with "simpler" option
- **Rate limiting**: Queue requests, show position
- **Low voice match**: Warn user, suggest adding more training data
- **Empty output**: Retry once, then show error with context
- **Content too short/long**: Regenerate with explicit length guidance

### Feedback Loop
- **Conflicting feedback**: If user accepts then rejects similar content, flag for review
- **Feedback spam**: Rate limit feedback submissions
- **Empty rejection reason**: Require at least one reason for learning

### Calendar
- **Past date selected**: Allow but warn
- **Overlapping items**: Allow multiple items per day
- **Generation fails for item**: Mark as "needs attention"
- **Missed publishing date**: Auto-move to next available slot or mark as skipped

### Trends
- **No relevant trends**: Show message, suggest manual topic input
- **Stale trends**: Auto-expire after configured period
- **Trend conflicts**: Show conflict clearly, require user decision
- **Trend scanning fails**: Use cached trends, retry later

### System Errors
- **Database connection lost**: Retry with exponential backoff, show user-friendly message
- **Supabase RLS violation**: Log security event, show generic error
- **Encryption/decryption fails**: Log error, prevent data corruption
- **Session expired**: Redirect to login, preserve intended action

---

## Security Considerations

### Data Protection
- All post content can be stored encrypted (optional per user preference)
- Voice profiles contain aggregated patterns, not raw content
- API keys never exposed to client
- All API routes validate session and ownership

### Rate Limiting
```typescript
// Per-user limits
const LIMITS = {
  generations_per_hour: 20,
  generations_per_day: 100,
  posts_per_bulk_import: 500,
  refinement_messages_per_generation: 10,
  api_requests_per_minute: 60
}
```

### Input Validation
- All user input sanitized
- Content length limits enforced
- File uploads (if any) scanned and size-limited
- SQL injection prevented via parameterized queries (Supabase handles)

### Audit Logging
- Track all generations with context
- Log feedback for learning transparency
- Track voice profile changes
- Monitor for unusual patterns (abuse detection)

---

## Performance Considerations

### Caching Strategy
- Voice profiles cached per session (invalidate on update)
- Recent posts cached for generation context
- Trend data cached with 1-hour TTL
- Calendar items cached with optimistic updates

### Database Optimization
- Indexes on all foreign keys and common query patterns
- Partial indexes for active records only
- Consider partitioning posts table by persona_id for large users
- Archive old generations after 90 days

### AI Optimization
- Batch similar requests where possible
- Use streaming for long generations (future)
- Cache embeddings for similarity search (future)
- Consider fine-tuning for heavy users (future)

---

## Monitoring & Observability

### Key Metrics
```typescript
// Track these in production
const METRICS = {
  // User engagement
  'generation.count': 'counter',
  'generation.duration_ms': 'histogram',
  'generation.acceptance_rate': 'gauge',
  'feedback.submission_rate': 'gauge',

  // System health
  'api.latency_ms': 'histogram',
  'api.error_rate': 'gauge',
  'ai.token_usage': 'counter',
  'db.connection_pool': 'gauge',

  // Business
  'user.signup': 'counter',
  'user.retention_7d': 'gauge',
  'persona.created': 'counter',
  'posts.imported': 'counter'
}
```

### Alerting
- AI generation failure rate > 5%
- API latency p95 > 5s
- Database connection errors
- Unusual usage patterns (potential abuse)
