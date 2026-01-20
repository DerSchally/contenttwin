# ContentTwin - Feature Roadmap

## Overview
This document outlines the feature roadmap for ContentTwin, organized by development phases. Each phase builds on the previous, with clear dependencies noted.

---

## Phase 1: Foundation (MVP Core)
**Goal**: Working content generation with basic voice learning

### 1.1 Authentication & User Management
- [ ] Supabase Auth setup (email/password + magic links)
- [ ] Social login (Google, GitHub)
- [ ] LinkedIn OAuth integration
- [ ] User profile management
- [ ] Session handling with middleware

### 1.2 Persona System
- [ ] Create persona (name, platform, description)
- [ ] Platform types: LinkedIn, Instagram
- [ ] Persona switching in dashboard
- [ ] Persona-specific settings

### 1.3 Content Input (Copy-Paste Workflow)
- [ ] Paste post content form
- [ ] Metrics input (impressions, likes, comments, profile views)
- [ ] Post date picker
- [ ] Content type selector (short-form, long-form)
- [ ] Bulk import via JSON/CSV

### 1.4 Basic Voice Profile
- [ ] Extract structural patterns from posts
  - Average sentence length
  - Paragraph structure
  - Use of lists/bullets
  - Hook patterns (first line analysis)
  - CTA patterns (last line analysis)
- [ ] Extract linguistic patterns
  - Common vocabulary
  - Phrase frequency
  - Tone markers (formal/casual indicators)
  - Emoji usage patterns
- [ ] Store as versioned JSONB profile

### 1.5 Content Generation (Core MVP Feature)
- [ ] Topic input form
- [ ] Creativity slider (0-100)
- [ ] Generate 3 variations
- [ ] Voice profile integration in prompts
- [ ] Short-form vs long-form templates
- [ ] Loading states and error handling

### 1.6 Basic Dashboard
- [ ] Persona overview cards
- [ ] Recent generations list
- [ ] Quick stats (posts added, generations this week)
- [ ] Mobile-responsive design

---

## Phase 2: Learning & Feedback
**Goal**: Iterative improvement through user feedback

### 2.1 Feedback System
- [ ] Accept/Reject/Edit actions on generations
- [ ] Rejection reason categories
  - Tone wrong
  - Too long/short
  - Off-topic
  - Doesn't sound like me
  - Other (free text)
- [ ] Track edits (diff between generated and final)
- [ ] Feedback history per persona

### 2.2 Conversational Refinement
- [ ] Chat interface for "almost there" content
- [ ] Refinement commands ("make it punchier", "add a story", etc.)
- [ ] Maintain context across refinement turns
- [ ] Apply learnings to future generations

### 2.3 Voice Profile Evolution
- [ ] Incorporate accepted content into profile
- [ ] Weight recent content higher
- [ ] Learn from explicit rejection feedback
- [ ] Profile version snapshots (manual + automatic)
- [ ] Profile diff visualization

### 2.4 Voice Match Scoring
- [ ] Analyze generated content against profile
- [ ] Display match percentage (0-100%)
- [ ] Breakdown by category (structure, tone, vocabulary)
- [ ] Flag low-match generations

---

## Phase 3: Planning & Calendar
**Goal**: Proactive content planning workflow

### 3.1 Content Pillar Discovery
- [ ] AI analyzes all posts to identify themes
- [ ] Suggest 3-5 content pillars
- [ ] User can accept/modify pillars
- [ ] Pillar-based categorization of past posts

### 3.2 4-Week Calendar
- [ ] Calendar view (week/month toggle)
- [ ] AI proposes topics for 4 weeks
- [ ] Topics distributed across pillars
- [ ] Drag-and-drop rescheduling
- [ ] Post status: Planned → Draft → Ready → Published

### 3.3 Topic Suggestions
- [ ] On-demand topic generation
- [ ] Based on pillars + past performance
- [ ] Include "why this topic" reasoning
- [ ] Save/dismiss suggestions

### 3.4 Content Queue
- [ ] Ready-to-post drafts queue
- [ ] Manual reordering
- [ ] "Generate next" action
- [ ] Archive/delete drafts

---

## Phase 4: Trends & Freshness
**Goal**: Keep content timely and prevent staleness

### 4.1 Trend Scanning
- [ ] Configure news sources per persona
- [ ] AI-curated daily trend digest
- [ ] Relevance scoring to persona's pillars
- [ ] Manual trend input option

### 4.2 Trend-Aware Generation
- [ ] Inject relevant trends into generation context
- [ ] "React to trend" content type
- [ ] Conflict detection (trend vs established voice)
- [ ] Flag conflicts for user decision

### 4.3 Freshness Mechanisms
- [ ] Track structural patterns in recent outputs
- [ ] Diversity enforcement (different hooks, formats)
- [ ] Periodic "voice refresh" prompts
- [ ] Staleness warnings

### 4.4 Performance Tracking
- [ ] Input actual post performance after publishing
- [ ] Link generations to performance data
- [ ] Performance analytics dashboard
- [ ] "What's working" insights

---

## Phase 5: Multi-Platform
**Goal**: Full support for Instagram Stories alongside LinkedIn

### 5.1 Instagram Stories Format
- [ ] Stories-specific templates (shorter, casual)
- [ ] Story sequence planning (multi-part)
- [ ] Emoji-heavy tone option
- [ ] Story-specific voice overlay

### 5.2 Platform-Specific Optimizations
- [ ] LinkedIn best practices integration
- [ ] Instagram hashtag suggestions
- [ ] Platform-specific character limits
- [ ] Format validation

### 5.3 Cross-Platform Content
- [ ] Repurpose LinkedIn → Instagram
- [ ] Maintain persona separation
- [ ] Cross-post suggestions

---

## Phase 6: Advanced Features
**Goal**: Power user features and polish

### 6.1 A/B Testing
- [ ] Generate alternative versions for testing
- [ ] Track which versions perform better
- [ ] Learn from A/B results

### 6.2 Content Series
- [ ] Multi-part content planning
- [ ] Series templates
- [ ] Continuation generation

### 6.3 Collaboration (Future)
- [ ] Invite team members
- [ ] Approval workflows
- [ ] Comments on drafts

### 6.4 Analytics Dashboard
- [ ] Voice profile evolution over time
- [ ] Generation quality trends
- [ ] Engagement correlation analysis
- [ ] Export reports

### 6.5 API Access
- [ ] Public API for power users
- [ ] Webhook integrations
- [ ] Zapier/Make integration

---

## Phase 7: SaaS Polish
**Goal**: Production-ready SaaS

### 7.1 Subscription & Billing
- [ ] Stripe integration
- [ ] Tiered plans (Free, Pro, Business)
- [ ] Usage tracking
- [ ] Overage handling

### 7.2 Onboarding
- [ ] Guided setup wizard
- [ ] Sample content import
- [ ] Voice profile bootstrap
- [ ] Tutorial tooltips

### 7.3 Email Notifications
- [ ] Weekly content reminders
- [ ] Trend alerts
- [ ] Performance summaries
- [ ] Calendar reminders

### 7.4 Admin Dashboard
- [ ] User management
- [ ] Usage analytics
- [ ] System health monitoring
- [ ] Feature flags

---

## Technical Dependencies

```
Phase 1 (Foundation)
    │
    ├── Phase 2 (Learning & Feedback)
    │       │
    │       └── Phase 3 (Planning & Calendar)
    │               │
    │               └── Phase 4 (Trends & Freshness)
    │
    └── Phase 5 (Multi-Platform) [can start after Phase 1]
            │
            └── Phase 6 (Advanced Features)
                    │
                    └── Phase 7 (SaaS Polish)
```

---

## MVP Definition (Phase 1)

The MVP is complete when a user can:
1. Sign up and create a LinkedIn persona
2. Paste 10+ past posts with basic metrics
3. Have AI build an initial voice profile
4. Generate 3 variations of a new post on a given topic
5. See generated content that demonstrably matches their style

**Success Criteria**:
- User says "this sounds like me" on at least 1 of 3 generations
- Generation time < 10 seconds
- No critical bugs in core flow

---

## Suggested Additional Features (Backlog)

### Content Ideas Bank
- Save interesting ideas/quotes for later
- AI suggests when to use saved ideas
- Tag and categorize ideas

### Competitor Analysis
- Monitor competitor content (manual input)
- Identify gaps in your content
- Differentiation suggestions

### Voice Profile Templates
- Pre-built voice templates (Thought Leader, Storyteller, etc.)
- Use as starting point before learning

### Content Recycling
- Surface old high-performing posts
- Suggest refresh/update opportunities
- Seasonal content reminders

### Writing Assistant Mode
- Real-time suggestions while typing
- "Make this more like me" button
- Grammar/style corrections in your voice

### Mobile App
- Quick capture of ideas
- Review/approve drafts on mobile
- Push notifications for reminders

---

## Priority Matrix

| Feature | Impact | Effort | Priority |
|---------|--------|--------|----------|
| Content Generation | High | Medium | P0 - MVP |
| Voice Profile Basic | High | Medium | P0 - MVP |
| Auth & Users | High | Low | P0 - MVP |
| Feedback System | High | Medium | P1 |
| Calendar Planning | High | High | P1 |
| Voice Match Scoring | Medium | Medium | P1 |
| Trend Scanning | Medium | High | P2 |
| Instagram Support | Medium | Medium | P2 |
| A/B Testing | Low | High | P3 |
| API Access | Low | Medium | P3 |
| Billing | High | Medium | P2* |

*Billing becomes P1 when launching to paying users
