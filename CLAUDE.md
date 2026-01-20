# ContentTwin - Project Context

## Project Vision
ContentTwin is an AI-driven content creation SaaS that learns individual writing styles and creates content as if it were the user. The tool becomes a user's "content twin" - understanding their voice, opinions, and patterns to generate authentic content that sounds genuinely like them.

## Core Value Proposition
- **Voice Learning**: Analyzes user's past content to build a comprehensive voice profile
- **Authentic Generation**: Creates content that matches the user's unique style, not generic AI output
- **Iterative Improvement**: Gets smarter with every interaction through feedback loops
- **Multi-Persona Support**: Handles different personas for different platforms (business vs personal)

---

## Tech Stack

### Framework & Runtime
- **Next.js 15** (App Router) - React framework with server components
- **React 19** - Latest React with concurrent features
- **TypeScript 5** - Strict mode enabled

### Styling
- **Tailwind CSS 3.4** - Utility-first CSS
- **CSS Variables** - For theming and dark mode support

### Database & Auth
- **Supabase** - PostgreSQL database + authentication + real-time
  - `@supabase/supabase-js` - Client library
  - `@supabase/ssr` - Server-side rendering support
  - Row Level Security (RLS) for multi-tenant data isolation
  - Encrypted columns for sensitive content

### AI Integration
- **Anthropic Claude API** (`@anthropic-ai/sdk`) - Primary LLM for all AI features
  - Voice analysis
  - Content generation
  - Trend curation
  - Similarity scoring

### Email (Future)
- **Resend** - Transactional emails for notifications

### Deployment
- **Vercel** - Hosting and deployment
- **Vercel Cron** - Scheduled jobs for trend scanning

---

## Architecture Decisions

### Multi-Tenancy Model
- Full multi-tenant SaaS architecture from day one
- Each user has isolated data via Supabase RLS
- Users can have multiple "personas" (LinkedIn business, Instagram personal)
- Personas are completely separate voice profiles under one account

### Voice Profile Architecture
```
User
├── Persona (LinkedIn - Business)
│   ├── Voice Profile (base)
│   │   ├── Structural patterns
│   │   ├── Linguistic fingerprint
│   │   └── Content DNA
│   ├── Context Overlays
│   │   ├── Educational content
│   │   ├── Storytelling
│   │   └── Thought leadership
│   └── Version History
│       ├── v1 (initial)
│       ├── v2 (after 50 posts)
│       └── v3 (current)
└── Persona (Instagram - Personal)
    └── ... (same structure)
```

### Content Flow
1. **Input**: User pastes past content with metrics (copy-paste workflow)
2. **Analysis**: AI extracts patterns, builds/updates voice profile
3. **Planning**: AI proposes 4-week content calendar based on pillars
4. **Generation**: AI creates 3 variations per topic with creativity slider
5. **Refinement**: User accepts/rejects/refines via chat
6. **Feedback**: System learns from explicit feedback on rejections
7. **Evolution**: Profile updates, freshness mechanisms prevent staleness

### Data Privacy
- Voice profiles and content stored with encryption at rest
- User owns their data - export/delete capabilities
- No training on user data without explicit consent

---

## Development Guidelines

### Project Structure (mirrors YoutubeMonitor)
```
/app                      # Next.js App Router
  /api                    # Backend API routes
    /auth                 # Authentication endpoints
    /content              # Content generation
    /profile              # Voice profile management
    /calendar             # Content calendar
    /feedback             # Feedback collection
    /trends               # Trend scanning
  /(dashboard)            # Dashboard pages (protected)
  /(marketing)            # Public marketing pages
  /login                  # Auth pages
/lib                      # Shared utilities
  /ai                     # Claude integration
    /voice-analyzer.ts    # Voice profile extraction
    /content-generator.ts # Content generation
    /trend-curator.ts     # Trend scanning
    /similarity-scorer.ts # Voice match validation
  /supabase               # Database client & queries
  /utils                  # Helpers
/components               # React components
  /ui                     # Basic UI components
  /dashboard              # Dashboard-specific
  /editor                 # Content editing
  /calendar               # Calendar views
/types                    # TypeScript definitions
/contexts                 # React contexts
```

### API Route Patterns
```typescript
// Standard response format
return NextResponse.json({ data, error: null }, { status: 200 })
return NextResponse.json({ data: null, error: 'message' }, { status: 400 })

// Auth check pattern
const session = await getSession(request)
if (!session) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

// Tenant isolation
const { data } = await supabase
  .from('personas')
  .select('*')
  .eq('user_id', session.user.id) // RLS handles this too
```

### Component Patterns
- Use `'use client'` only when necessary (interactivity, hooks)
- Prefer Server Components for data fetching
- Keep business logic in `/lib`, not components
- Use React Context sparingly (auth state only)

### AI Integration Patterns
```typescript
// Always include voice profile in generation context
const context = {
  voiceProfile: await getVoiceProfile(personaId),
  recentPosts: await getRecentPosts(personaId, 5),
  similarPosts: await getSimilarPosts(personaId, topic, 5),
  trends: await getRelevantTrends(personaId),
  creativityLevel: request.creativityLevel // 0-100
}

// Parse AI responses safely
const response = await claude.messages.create({...})
const content = extractJSON(response.content[0].text)
```

### Database Patterns
- Use point-in-time snapshots for metrics (enables historical analysis)
- Soft delete where appropriate (rejected content still valuable)
- Version everything that evolves (voice profiles, overlays)
- Use JSONB for flexible schema (AI-extracted patterns)

---

## MCP Integrations

### Available Tools
- **GitHub MCP** - Repository management, code deployment
- **Supabase MCP** - Database operations, migrations, edge functions
- **Vercel MCP** - Deployment management
- **Firecrawl MCP** - Web scraping for trend detection
- **Resend MCP** - Email notifications

### Usage Guidelines
- Use Supabase MCP for schema migrations and SQL operations
- Use GitHub MCP for repository setup and CI/CD
- Use Firecrawl for trend/news scanning (AI-curated news feature)

---

## Coding Standards

### TypeScript
- Strict mode always
- No `any` types - use `unknown` and type guards
- Export types from `/types` directory
- Use Zod for runtime validation of external data

### Naming Conventions
- Files: `kebab-case.ts`
- Components: `PascalCase.tsx`
- Functions: `camelCase`
- Database tables: `snake_case`
- Environment variables: `SCREAMING_SNAKE_CASE`

### Error Handling
```typescript
// Always wrap AI calls
try {
  const result = await generateContent(...)
  return { data: result, error: null }
} catch (error) {
  console.error('[ContentGenerator]', error)
  return { data: null, error: 'Content generation failed' }
}
```

### Testing Philosophy
- Critical paths must have tests
- AI outputs are non-deterministic - test structure, not content
- Use Supabase local for integration tests

---

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Anthropic
ANTHROPIC_API_KEY=

# Encryption
ENCRYPTION_KEY=  # For sensitive content encryption

# Vercel (auto-injected)
VERCEL_URL=

# Optional
RESEND_API_KEY=
FIRECRAWL_API_KEY=
```

---

## Key Metrics to Track

### User Engagement
- Posts generated per user per week
- Acceptance rate (accepted / generated)
- Refinement iterations before acceptance
- Voice match scores over time

### System Health
- AI response times
- Generation success rate
- Profile update frequency
- Trend freshness

### Business Metrics
- User retention
- Feature adoption (calendar, feedback, etc.)
- Upgrade conversion (if tiered pricing)
