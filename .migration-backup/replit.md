# .replit.md

## Overview

A TikTok-style news aggregator application that scrapes news from multiple RSS feeds (Belgian and international sources), translates/summarizes content using OpenAI, and presents articles in a vertical-swipe feed format. Users can customize their feed by selecting preferred topics and regions.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript, built using Vite
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state caching and synchronization
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming (dark mode by default for immersive media experience)
- **Animations**: Framer Motion for page transitions and micro-interactions
- **User Preferences**: LocalStorage for persisting topic/region selections

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript (ESM modules)
- **API Design**: RESTful endpoints defined in shared/routes.ts with Zod validation
- **News Scraping**: RSS Parser library fetches from multiple sources (BRUZZ, VRT NWS, DW, BBC)
- **AI Processing**: OpenAI API for translating Dutch content to English, summarizing articles, and categorizing by topic

### Data Storage
- **Database**: PostgreSQL with Drizzle ORM
- **Schema Location**: shared/schema.ts contains all table definitions
- **Migrations**: Drizzle Kit manages schema migrations (output to /migrations folder)
- **Key Tables**: 
  - `news` - stores scraped and processed news articles
  - `conversations` and `messages` - chat functionality for AI integrations

### AI Integrations
- **Chat Routes**: `/api/conversations` endpoints for AI chat functionality
- **Image Generation**: `/api/generate-image` endpoint using OpenAI's image generation
- **Batch Processing**: Utility module for rate-limited LLM batch operations with automatic retries

### Build System
- **Development**: Vite dev server with HMR, proxied through Express
- **Production**: esbuild bundles server code, Vite builds client to dist/public
- **Path Aliases**: `@/` maps to client/src, `@shared/` maps to shared folder

## External Dependencies

### Database
- PostgreSQL (connection via DATABASE_URL environment variable)
- Drizzle ORM with node-postgres driver

### AI Services
- OpenAI API (via Replit AI Integrations)
  - Environment variables: `AI_INTEGRATIONS_OPENAI_API_KEY`, `AI_INTEGRATIONS_OPENAI_BASE_URL`
  - Used for: news translation/summarization, chat, image generation

### News Sources (RSS Feeds)
- BRUZZ (Belgian, Dutch)
- VRT NWS (Belgian, Dutch)
- DW (European, English)
- BBC World News (International, English)

### Key NPM Packages
- `rss-parser` - RSS feed parsing
- `jsdom` - HTML content extraction
- `openai` - OpenAI API client
- `p-limit` and `p-retry` - Rate limiting and retry logic for batch processing