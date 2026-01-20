# ContentTwin

An AI-driven content creation SaaS that learns your unique writing style and creates authentic content that sounds exactly like you.

## Features

- **Voice Learning** - Paste your existing content and AI builds a comprehensive profile of your writing style
- **Content Generation** - Get 3 variations for any topic, each scored for voice match
- **4-Week Calendar** - AI proposes content calendar based on your pillars and trending topics
- **Iterative Learning** - Give feedback to continuously improve with every interaction
- **Multi-Persona** - Manage different voices for different platforms (LinkedIn, Instagram)

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **UI**: React 19, Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **AI**: Anthropic Claude API
- **Deployment**: Vercel

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/DerSchally/contenttwin.git
cd contenttwin
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
# Edit .env.local with your API keys
```

4. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Documentation

- [CLAUDE.md](./CLAUDE.md) - Project context and coding guidelines
- [PLAN.md](./PLAN.md) - Feature roadmap and priorities
- [SPEC.md](./SPEC.md) - Technical specification and database schema

## License

Private - All rights reserved
