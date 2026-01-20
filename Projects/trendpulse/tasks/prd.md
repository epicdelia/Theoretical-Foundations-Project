# TrendPulse - AI Trend Intelligence for Tech Creators

## Overview
A daily trend intelligence system that finds trending Tech + AI topics relevant to software developers, ranks them, and generates ready-to-post content in the user's voice.

## Tech Stack Decision

### Why This Stack:
- **Next.js 14 (App Router)**: Full-stack in one repo, API routes, server components, Vercel-native
- **Supabase**: Postgres + Auth + Edge Functions + Realtime - no separate DB setup
- **OpenAI API**: GPT-4 for content generation, embeddings for voice matching
- **Vercel Cron**: Simple scheduled jobs, no separate queue infra
- **TailwindCSS + shadcn/ui**: Fast, clean UI components
- **Resend**: Email delivery (better than SendGrid for devs)

### ToS-Compliant Data Sources:
| Source | Method | Status |
|--------|--------|--------|
| Hacker News | Official API (free) | ✅ Safe |
| Reddit | Official API (free tier) | ✅ Safe |
| GitHub Trending | Public page parsing (allowed) | ✅ Safe |
| Product Hunt | Official API | ✅ Safe |
| TechCrunch/Verge | RSS feeds (public) | ✅ Safe |
| YouTube | Data API v3 (quota: 10k/day) | ✅ Safe |
| X/Twitter | Official API (Basic $100/mo) | ⚠️ Optional |
| LinkedIn | No API - manual paste only | ❌ Skip scraping |
| Instagram | No API - skip | ❌ Skip |

## Database Schema

```sql
-- Users
users: id, email, timezone, created_at

-- Voice profiles (brand voice)
voice_profiles: id, user_id, name, sample_posts[], extracted_patterns JSONB, created_at

-- Trend sources
sources: id, name, type (api|rss|scrape), config JSONB, last_fetched, is_active

-- Raw trend data (daily)
trend_items: id, source_id, external_id, title, url, content,
             raw_metrics JSONB, fetched_at, date

-- Scored trends (processed)
daily_trends: id, user_id, date, rank, title, summary,
              why_it_matters, signals JSONB, sources[],
              video_ideas[], score, score_breakdown JSONB

-- Generated content
content_drafts: id, trend_id, user_id, platform (linkedin|twitter|reel),
                angle (hot_take|tutorial|founder_story|meme),
                content TEXT, created_at

-- Reply bank
reply_bank: id, trend_id, replies TEXT[], created_at

-- Digest history
digests: id, user_id, date, trends_json JSONB, email_sent_at, viewed_at
```

## Trend Scoring Algorithm

```python
def calculate_trend_score(item, existing_trends):
    score = 0
    breakdown = {}

    # 1. Velocity Score (0-30 points)
    # Growth rate over 24h vs 7d average
    velocity = (item.mentions_24h / max(item.mentions_7d_avg, 1)) - 1
    velocity_score = min(velocity * 10, 30)
    breakdown['velocity'] = velocity_score
    score += velocity_score

    # 2. Cross-Platform Score (0-25 points)
    # Appears on multiple sources
    platform_count = len(item.sources)
    cross_platform = min(platform_count * 8, 25)
    breakdown['cross_platform'] = cross_platform
    score += cross_platform

    # 3. Relevance Score (0-25 points)
    # Keyword matching: AI, dev tools, startups, coding, etc.
    relevance_keywords = ['ai', 'llm', 'developer', 'api', 'startup',
                         'coding', 'github', 'open source', 'saas']
    matches = sum(1 for kw in relevance_keywords if kw in item.title.lower())
    relevance = min(matches * 5, 25)
    breakdown['relevance'] = relevance
    score += relevance

    # 4. Novelty Score (0-20 points)
    # Penalize topics seen in last 7 days
    days_since_last_seen = get_days_since_topic(item.title, existing_trends)
    novelty = min(days_since_last_seen * 3, 20)
    breakdown['novelty'] = novelty
    score += novelty

    return score, breakdown
```

## User Stories

### US-1: Project Setup & Database
**As a** developer
**I want to** have a working Next.js project with Supabase
**So that** I can build the trend intelligence features

**Acceptance Criteria:**
- [ ] Initialize Next.js 14 with App Router
- [ ] Set up TailwindCSS and shadcn/ui
- [ ] Configure Supabase client
- [ ] Create database migrations for all tables
- [ ] Set up environment variables template
- [ ] Add basic auth with magic link (Supabase Auth)

### US-2: Data Source Connectors
**As a** user
**I want to** pull trends from multiple sources
**So that** I get comprehensive trend coverage

**Acceptance Criteria:**
- [ ] Hacker News connector (official API)
- [ ] Reddit connector (r/programming, r/MachineLearning)
- [ ] GitHub Trending connector (parse public page)
- [ ] RSS connector for TechCrunch, Verge, Ars Technica
- [ ] Product Hunt connector (API)
- [ ] Rate limiting and caching for all connectors
- [ ] Error handling with fallbacks
- [ ] Connector status dashboard

### US-3: Trend Scoring Engine
**As a** user
**I want to** see trends ranked by relevance
**So that** I focus on the most important topics

**Acceptance Criteria:**
- [ ] Implement scoring algorithm (velocity, cross-platform, relevance, novelty)
- [ ] Aggregate trends from all sources
- [ ] Deduplicate similar topics (fuzzy matching)
- [ ] Store scored trends in database
- [ ] API endpoint to get daily top 5 trends
- [ ] Score breakdown visible in UI

### US-4: Voice Profile System
**As a** user
**I want to** train the AI on my writing style
**So that** generated content sounds like me

**Acceptance Criteria:**
- [ ] UI to paste 10-30 sample posts
- [ ] Extract patterns: tone, structure, emoji usage, CTAs, phrases
- [ ] Store voice profile in database
- [ ] Use profile in content generation prompts
- [ ] Allow multiple profiles (LinkedIn voice vs Twitter voice)

### US-5: Content Generation Pipeline
**As a** user
**I want to** get ready-to-post drafts for each trend
**So that** I can post quickly without writing from scratch

**Acceptance Criteria:**
- [ ] LinkedIn post generator (long-form, professional)
- [ ] Twitter thread generator (hook + 5-8 tweets)
- [ ] Instagram Reel script generator (30-45s, hook/body/CTA/loop)
- [ ] Angle selector: hot take, tutorial, founder story, meme
- [ ] Reply bank generator (5 spicy replies per trend)
- [ ] No hallucinated facts - cite sources
- [ ] Loading states and regenerate button

### US-6: Dashboard UI
**As a** user
**I want to** see my daily trends in a clean dashboard
**So that** I can browse and use the content easily

**Acceptance Criteria:**
- [ ] Daily digest page with 5 ranked trends
- [ ] Each trend shows: summary, why it matters, signals, links
- [ ] Expandable sections for video ideas and drafts
- [ ] Platform tabs (LinkedIn/Twitter/Reel) for each trend
- [ ] Copy button for each draft
- [ ] Mobile responsive
- [ ] Dark mode

### US-7: Export & Integrations
**As a** user
**I want to** export my trends and content
**So that** I can use them in other tools

**Acceptance Criteria:**
- [ ] Export to CSV (trends + content)
- [ ] Export to Notion (create database entries)
- [ ] Copy as plain text (Buffer/Metricool ready)
- [ ] Email digest (daily at 7 AM user timezone)

### US-8: Scheduled Jobs
**As a** user
**I want to** receive fresh trends every morning
**So that** I don't have to manually trigger updates

**Acceptance Criteria:**
- [ ] Vercel Cron job to fetch sources (every 2 hours)
- [ ] Daily scoring job (6 AM UTC)
- [ ] Daily email digest job (per user timezone)
- [ ] Job status logging
- [ ] Manual trigger button in dashboard

## API Endpoints

```
GET  /api/trends/daily          - Get today's top 5 trends
GET  /api/trends/[id]           - Get single trend with drafts
POST /api/trends/generate       - Regenerate content for a trend
GET  /api/sources/status        - Check connector health
POST /api/voice/create          - Create voice profile
GET  /api/voice/[id]            - Get voice profile
POST /api/export/csv            - Export trends as CSV
POST /api/export/notion         - Export to Notion
POST /api/cron/fetch            - Manual source fetch trigger
POST /api/cron/score            - Manual scoring trigger
```

## Pages

```
/                    - Landing page
/login               - Magic link auth
/dashboard           - Main trend dashboard
/dashboard/trends    - All trends list
/dashboard/voice     - Voice profile management
/dashboard/settings  - User settings (timezone, email prefs)
/dashboard/sources   - Data source status
```

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# OpenAI
OPENAI_API_KEY=

# Email (Resend)
RESEND_API_KEY=

# Optional APIs
REDDIT_CLIENT_ID=
REDDIT_CLIENT_SECRET=
YOUTUBE_API_KEY=
TWITTER_BEARER_TOKEN=
PRODUCT_HUNT_TOKEN=

# App
CRON_SECRET=
NEXT_PUBLIC_APP_URL=
```

## MVP Scope (Ship First)
1. Hacker News + Reddit + GitHub connectors only
2. Basic scoring (no ML)
3. OpenAI content generation with simple prompts
4. Single voice profile
5. Dashboard with copy buttons
6. CSV export only
7. Manual trigger (no cron yet)

## Future Iterations
- YouTube trending integration
- Twitter/X integration (paid API)
- Notion integration
- Advanced voice cloning
- A/B test different angles
- Analytics on which content performs
