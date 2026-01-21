# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ContentTwin is an AI-driven content creation SaaS that learns individual writing styles and creates authentic content that sounds exactly like the user. The tool becomes a user's "content twin" - understanding their voice, opinions, and patterns to generate content matching their unique style.

## Commands

### Development
```bash
npm install          # Install dependencies
npm run dev          # Run development server (http://localhost:3000)
npm run build        # Build for production
npm start            # Start production server
npm run lint         # Run ESLint
```

## Tech Stack

- **Framework**: Next.js 16 (App Router), React 19, TypeScript 5
- **Database**: Supabase (PostgreSQL with RLS)
- **AI**: Anthropic Claude API (`@anthropic-ai/sdk`)
- **Styling**: Tailwind CSS 4
- **Email**: Resend (transactional emails)
- **Deployment**: Vercel with cron jobs

## Architecture

### Core Concept: Multi-Persona Voice Learning

ContentTwin is built around a hierarchical content generation system:

```
User Account
  └── Personas (e.g., "LinkedIn - Business", "Instagram - Personal")
       ├── Voice Profile (versioned, JSONB)
       │    ├── Structural patterns (sentence length, hooks, CTAs)
       │    ├── Linguistic patterns (vocabulary, tone, emojis)
       │    └── Content DNA (topics, opinions, frameworks)
       ├── Training Posts (user's past content + metrics)
       ├── Content Pillars (recurring themes)
       ├── Generations (3 variations per request)
       └── Calendar Items (planned content schedule)
```

### Data Flow

1. **Voice Learning**: User pastes past posts → AI extracts patterns → Versioned voice profile created
2. **Generation**: User inputs topic + creativity level → AI generates 3 variations with voice match scores
3. **Feedback Loop**: User accepts/rejects/edits → System learns → Profile evolves
4. **Calendar Planning**: AI proposes 4-week content plan based on pillars and trends

### Key Design Decisions

**Versioned Voice Profiles**
- Each profile update creates a new version (stored as JSONB)
- Current version marked with `is_current = true`
- Enables rollback if profile drifts incorrectly
- Tracks `posts_analyzed` count for confidence

**Context Overlays**
- Voice profile adjustments for specific content types
- Examples: "Educational", "Storytelling", "Thought Leadership"
- Applied on top of base profile without modifying it

**Copy-Paste Workflow**
- No API scraping - users paste content manually
- Metrics input (impressions, likes, comments) for performance analysis
- Minimum 5 posts required for initial profile creation

**Multi-Tenancy**
- Full RLS (Row Level Security) on all tables
- Data isolation per user via `user_id` checks
- Personas belong to single user, cannot be shared

## Project Structure

```
/app
  /api
    /generate         # Content generation endpoint
    /discover
      /pillars        # Discover content pillars from posts
      /topics         # Generate topic suggestions
      /trends         # Score and filter trending topics
    (auth, personas, calendar, feedback endpoints to be added)
  /generate           # Generation UI page
  /discover           # Topic discovery and learning UI
  page.tsx            # Landing/dashboard page
  layout.tsx          # Root layout

/lib
  /ai
    claude-client.ts       # Anthropic SDK wrapper
    content-generator.ts   # Main generation logic
    voice-analyzer.ts      # Voice profile extraction
    pillar-discovery.ts    # Pillar extraction and topic suggestions
  /trends
    scanner.ts             # Trend scanning and relevance scoring
  /supabase
    client.ts              # Supabase client singleton
    (queries.ts to be added)
  /utils
    formatting.ts          # Text utilities

/components
  /ui                      # Base components (Button, Card, etc.)
  /generate                # Generation-specific components
  (dashboard, calendar, voice components to be added)

/types
  database.ts              # Supabase database types
```

## Database Schema

All tables use `public` schema with RLS enabled:

### Core Tables
- `user_profiles` - Extended auth user data
- `personas` - Content twins (platform: linkedin, instagram)
- `voice_profiles` - Versioned JSONB voice patterns
- `voice_overlays` - Context-specific adjustments
- `posts` - Training data with metrics
- `content_pillars` - Recurring content themes
- `generations` - Generated content with variations
- `generation_feedback` - User feedback for learning
- `calendar_items` - Content schedule
- `trends` - AI-curated trends (future)

See [SPEC.md](SPEC.md) for complete schema with field details.

## API Patterns

### Standard Response Format
```typescript
// Success
return NextResponse.json({ data: result, error: null }, { status: 200 })

// Error
return NextResponse.json({ data: null, error: 'Message' }, { status: 400 })
```

### Authentication Check
```typescript
const session = await getSession(request)
if (!session) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
```

### Tenant Isolation
```typescript
// RLS handles filtering, but always explicit in queries
const { data } = await supabase
  .from('personas')
  .select('*')
  .eq('user_id', session.user.id)
```

## AI Integration

### Voice Profile Context
Always include comprehensive context when generating:
```typescript
const context = {
  voiceProfile: await getVoiceProfile(personaId),
  recentPosts: await getRecentPosts(personaId, 5),
  similarPosts: await getSimilarPosts(personaId, topic, 5),
  creativityLevel: request.creativityLevel // 0-100
}
```

### Content Generation
- Always generate **3 variations** per request
- Include voice match score (0-100) for each variation
- Breakdown scores by: structure, tone, vocabulary
- Store full context in `context_used` JSONB for debugging

### Error Handling
```typescript
try {
  const result = await generateContent(...)
  return { data: result, error: null }
} catch (error) {
  console.error('[ContentGenerator]', error)
  return { data: null, error: 'Content generation failed' }
}
```

## Development Guidelines

### Component Architecture
- Use `'use client'` only when necessary (state, effects, interactions)
- Prefer Server Components for data fetching
- Keep business logic in `/lib`, not components
- Use React Context sparingly (auth state only)

### TypeScript Standards
- Strict mode enabled
- No `any` types - use `unknown` and type guards
- Export types from `/types` directory
- Use Zod for runtime validation of external data (AI responses, API inputs)

### Naming Conventions
- Files: `kebab-case.ts`
- Components: `PascalCase.tsx`
- Functions: `camelCase`
- Database tables: `snake_case`
- Environment variables: `SCREAMING_SNAKE_CASE`

### Database Patterns
- Use JSONB for flexible AI-extracted patterns
- Version everything that evolves (voice profiles, overlays)
- Soft delete where appropriate (rejected content has learning value)
- Indexes on all foreign keys and common query patterns

### Security
- All API routes validate session and ownership
- RLS policies enforce data isolation
- Optional content encryption for sensitive user data
- Rate limiting per-user (to be implemented)

## Environment Variables

```env
# Supabase (required)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Anthropic (required)
ANTHROPIC_API_KEY=

# Encryption (required)
ENCRYPTION_KEY=  # Generate with: openssl rand -base64 32

# Optional
RESEND_API_KEY=
FIRECRAWL_API_KEY=
```

## Implementation Status

### ✅ Completed (Phase 1 - Foundation)
- Basic Next.js setup with Tailwind
- Supabase client configuration
- Claude API client wrapper
- Content generation endpoint (`/api/generate`)
- Basic generation UI page
- **Topic discovery system** (`/api/discover/pillars`, `/api/discover/topics`, `/api/discover/trends`)
- **Full discovery UI** (`/discover` page with 3-step workflow)

### 🚧 In Progress
- Voice analyzer implementation
- Database schema setup
- Authentication flow
- Persona management

### 📋 Planned (See PLAN.md)
- Phase 2: Feedback system and learning
- Phase 3: Calendar and planning
- Phase 4: Trends and freshness
- Phase 5: Multi-platform support

## Key Metrics to Track

### User Engagement
- Posts generated per user per week
- Acceptance rate (accepted / generated)
- Refinement iterations before acceptance
- Voice match scores over time

### System Health
- AI response times (p50, p95, p99)
- Generation success rate
- Profile update frequency
- API error rates

## MCP Integrations

Available tools for this project:
- **Supabase MCP** - Database migrations, SQL operations
- **GitHub MCP** - Repository management
- **Vercel MCP** - Deployment management
- **Firecrawl MCP** - Web scraping for trend detection
- **Resend MCP** - Email notifications

## Additional Documentation

- [SPEC.md](SPEC.md) - Complete technical specification with database schema, API endpoints, and user flows
- [PLAN.md](PLAN.md) - Feature roadmap organized by development phases
- [README.md](README.md) - Project overview and quick start guide
