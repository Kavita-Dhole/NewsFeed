# Architecture Document — NewsFeed

## 1. What This System Does

NewsFeed is a TikTok-style global news aggregator. It automatically scrapes 150+ RSS feeds from every major world region, translates and summarises non-English articles via OpenAI, and delivers a personalised vertical-scroll feed through both a React web app and an Expo iOS/Android app.

---

## 2. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        USER INTERFACES                              │
│                                                                     │
│   ┌──────────────────────┐        ┌───────────────────────────┐    │
│   │   Web App            │        │   Mobile App              │    │
│   │   React + Vite       │        │   Expo (iOS / Android)    │    │
│   │   /news-app          │        │   /news-mobile            │    │
│   │                      │        │                           │    │
│   │  Home   → feed       │        │  Feed tab  → swipe feed   │    │
│   │  Discover → filters  │        │  Discover  → filters      │    │
│   └────────┬─────────────┘        └──────────┬────────────────┘    │
│            │  GET /api/news?region=…&topics=… │                     │
└────────────┼─────────────────────────────────┼─────────────────────┘
             │                                 │
             ▼                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    API SERVER  (Express 5 / Node 24)                │
│                    /api-server  —  port 8080                        │
│                                                                     │
│  ┌──────────┐  ┌──────────────┐  ┌────────────┐  ┌─────────────┐  │
│  │  routes  │  │   storage    │  │  scraper   │  │  scheduler  │  │
│  │  index   │  │  (Drizzle)   │  │  (OpenAI)  │  │  (daily 4AM)│  │
│  └──────────┘  └──────┬───────┘  └─────┬──────┘  └─────────────┘  │
└────────────────────────┼───────────────┼─────────────────────────-─┘
                         │               │
                         ▼               ▼
              ┌──────────────────┐   ┌────────────────────────────────┐
              │  PostgreSQL DB   │   │   External Services            │
              │  (Drizzle ORM)   │   │                                │
              │  table: news     │   │  RSS Feeds (150+ sources)      │
              └──────────────────┘   │  OpenAI gpt-4o-mini            │
                                     └────────────────────────────────┘
```

---

## 3. Technology Choices

| Layer | Technology | Why |
|---|---|---|
| Monorepo | pnpm workspaces | Shared types/schema between server, web, mobile without duplication |
| Language | TypeScript 5.9 (strict) | Single language across all three artifacts; compile-time safety |
| API Server | Express 5 + Node 24 | Minimal, fast, battle-tested; Express 5 brings async error handling |
| Database | PostgreSQL + Drizzle ORM | Type-safe queries; schema-as-code; no migration file drift |
| Validation | Zod v4 + drizzle-zod | Schema is the single source of truth for both DB types and runtime validation |
| API Contract | OpenAPI 3.1 (Orval codegen) | Frontend hooks generated from spec; prevents client/server drift |
| Web Frontend | React 18 + Vite + TanStack Query | Fast HMR; Query handles caching/loading/error states |
| Mobile | Expo SDK 53 + Expo Router | File-based routing; runs on iOS, Android and Web from one codebase |
| AI | OpenAI gpt-4o-mini | Fast and cheap for bulk translation/summarisation |
| Logging | Pino | Structured JSON logs; negligible overhead |

---

## 4. Repository Layout

```
artifacts-monorepo/
├── artifacts/
│   ├── api-server/          # Express backend
│   │   └── src/
│   │       ├── app.ts       # Express setup + startup sequence
│   │       ├── routes/      # HTTP route handlers
│   │       ├── scraper.ts   # RSS ingestion + AI processing
│   │       ├── scheduler.ts # Daily 4 AM cron
│   │       ├── storage.ts   # DB abstraction (Drizzle)
│   │       └── db.ts        # Drizzle client
│   ├── news-app/            # React / Vite web app
│   │   └── src/
│   │       ├── pages/
│   │       │   ├── Home.tsx     # Vertical scroll feed
│   │       │   └── Discover.tsx # Region/topic filters
│   │       ├── components/
│   │       │   ├── NewsCard.tsx  # Full-screen card + drawer
│   │       │   └── BottomNav.tsx # Tab navigation
│   │       └── hooks/
│   │           └── use-news.ts  # TanStack Query hooks
│   └── news-mobile/         # Expo mobile app
│       ├── app/(tabs)/
│       │   ├── index.tsx    # Feed tab (FlatList)
│       │   └── discover.tsx # Discover tab
│       ├── components/
│       │   └── NewsCard.tsx # Native card component
│       ├── context/
│       │   └── FiltersContext.tsx  # Global state + AsyncStorage
│       └── hooks/
│           ├── useNews.ts   # API fetch hook
│           └── useColors.ts # Dark-theme tokens
├── lib/
│   ├── db/                  # Shared DB schema + types
│   │   └── src/schema/schema.ts  # news table + getDbRegions()
│   └── api-spec/
│       └── openapi.yaml     # Source-of-truth API contract
└── pnpm-workspace.yaml      # Catalog + overrides
```

---

## 5. Component Deep-Dives

### 5a. Scraper (`artifacts/api-server/src/scraper.ts`)

The heart of the ingestion pipeline. Called on startup and daily at 4 AM UTC.

```typescript
// Each source has a name, RSS URL, region tag, and source language
const SOURCES = [
  { name: "VRT NWS", url: "https://www.vrt.be/vrtnws/nl.rss.articles.xml", region: "Belgium", language: "nl" },
  { name: "The Local Sweden", url: "https://www.thelocal.se/feed/", region: "North Europe", language: "en" },
  { name: "Al Jazeera", url: "https://www.aljazeera.com/xml/rss/all.xml", region: "Middle East", language: "en" },
  // ... 150+ more
];

export async function fetchAndProcessNews() {
  await storage.cleanupOldNews();          // purge articles older than 12 h

  for (const source of SOURCES) {
    const feed = await parser.parseURL(source.url);   // rss-parser

    for (const item of feed.items.slice(0, 10)) {
      if (await storage.getNewsByExternalId(item.link)) continue;  // dedup

      const processed = await translateAndSummarize(      // gpt-4o-mini
        item.title, item.contentSnippet, source.language
      );

      // Try RSS enclosure → og:image fallback via jsdom
      const imageUrl = item.enclosure?.url ?? await scrapeOgImage(item.link);

      await storage.createNews({ ...processed, region: source.region });
    }
  }
}
```

**AI prompt contract** — `translateAndSummarize()` sends one JSON-mode request per article asking the model to:
1. Translate title + body to natural English
2. Expand trending-search keywords into a 2-3 sentence news snippet
3. Return a one-sentence summary
4. Assign exactly one topic from `Politics | Business | Tech | Science | Health | Sports | Entertainment`

### 5b. Region Mapping (`lib/db/src/schema/schema.ts`)

The `getDbRegions()` function translates a UI region selection into the exact DB region values to query against. This is the key to making "Belgium" show Euronews and "UAE" show Al Jazeera.

```typescript
export function getDbRegions(region: string): string[] {
  const expansions: Record<string, string[]> = {
    // Continent selections → expand to all sub-regions
    "Europe":        ["Europe", "Belgium", "Netherlands", "France", "Germany", "South Europe", "North Europe"],
    "Middle East":   ["Middle East", "UAE"],
    "South America": ["South America", "Brazil", "Mexico"],

    // Country selections → also include pan-regional content
    "Belgium":       ["Belgium", "Europe"],   // gets Euronews, DW, France 24...
    "Germany":       ["Germany", "Europe"],
    "UAE":           ["UAE", "Middle East"],  // gets Al Jazeera, Gulf News...
    "Mexico":        ["Mexico", "South America"],
  };
  return expansions[region] ?? [region];
}
```

### 5c. Storage Layer (`artifacts/api-server/src/storage.ts`)

Translates API filter parameters into Drizzle WHERE conditions. Applies the region expansion and a 12-hour freshness window.

```typescript
async getNews(filters?: { topics?: string[]; region?: string }) {
  const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);
  let conditions = [gte(news.createdAt, twelveHoursAgo)];

  // Topic filter — "Trending" is sort-only, never a WHERE clause
  const realTopics = (filters?.topics ?? []).filter(t => t !== "Trending" && t !== "All");
  if (realTopics.length > 0) conditions.push(inArray(news.topic, realTopics));

  // Region expansion
  const dbRegions = filters?.region ? getDbRegions(filters.region) : undefined;
  if (dbRegions?.length === 1) conditions.push(eq(news.region, dbRegions[0]));
  else if (dbRegions?.length > 1) conditions.push(inArray(news.region, dbRegions));

  return db.select().from(news).where(and(...conditions)).orderBy(desc(news.createdAt));
}
```

### 5d. API Routes (`artifacts/api-server/src/routes/`)

```
GET  /api/news            → returns filtered articles (12 h window)
GET  /api/news/:id        → single article by ID
POST /api/news            → manually inject article (Zod-validated)
POST /api/news/refresh    → triggers scraper run in background
GET  /api/healthz         → liveness probe
```

### 5e. Web Feed (`artifacts/news-app/src/pages/Home.tsx`)

Full-screen vertical scroll using native CSS scroll-snap. Each card occupies 100vh with `snap-start`.

```tsx
<div className="w-full h-full overflow-y-scroll snap-y-mandatory no-scrollbar">
  {news.map((item) => (
    <div key={item.id} className="w-full h-full snap-start relative">
      <NewsCard item={item} isActive={true} />
    </div>
  ))}
</div>
```

Preferences are read from `localStorage` on mount and sent as query parameters to the API.

### 5f. Mobile Feed (`artifacts/news-mobile/app/(tabs)/index.tsx`)

Uses React Native `FlatList` with `pagingEnabled` — each item is exactly `SCREEN_HEIGHT` tall for snap behaviour.

```tsx
<FlatList
  data={news}
  pagingEnabled
  snapToInterval={SCREEN_HEIGHT}
  snapToAlignment="start"
  decelerationRate="fast"
  getItemLayout={(_, index) => ({
    length: SCREEN_HEIGHT,
    offset: SCREEN_HEIGHT * index,
    index,
  })}
/>
```

### 5g. Mobile State Management (`artifacts/news-mobile/context/FiltersContext.tsx`)

`FiltersContext` is a React Context that persists region and topic selections to device storage.

```typescript
const setRegion = useCallback(async (r: string) => {
  setRegionState(r);
  await AsyncStorage.setItem("news_region", r);  // persists across app restarts
}, []);
```

---

## 6. End-to-End Data Flow

```
1. SCRAPE (on startup + daily 4 AM UTC)
   RSS XML → rss-parser → dedup check (externalId) → OpenAI gpt-4o-mini
   → { translatedTitle, translatedContent, summary, topic }
   → image: RSS enclosure OR jsdom og:image fallback
   → INSERT INTO news (title, summary, content, imageUrl, source, topic, region, externalId)

2. REQUEST (user opens app)
   User preference: region="Germany", topics=["Tech"]
   → GET /api/news?region=Germany&topics=Tech
   → getDbRegions("Germany") → ["Germany", "Europe"]
   → WHERE region IN ("Germany","Europe") AND topic = "Tech"
   → ORDER BY createdAt DESC

3. RENDER
   Web:    CSS scroll-snap full-screen cards with Vaul drawer for full text
   Mobile: FlatList pagingEnabled, LinearGradient overlay, haptic feedback
```

---

## 7. Database Schema

```sql
CREATE TABLE news (
  id          SERIAL PRIMARY KEY,
  title       TEXT NOT NULL,         -- AI-translated English headline
  summary     TEXT NOT NULL,         -- 1-sentence AI summary
  content     TEXT NOT NULL,         -- full AI-translated body
  image_url   TEXT NOT NULL,         -- og:image or Unsplash fallback
  source      TEXT NOT NULL,         -- e.g. "Le Soir", "Al Jazeera"
  topic       TEXT NOT NULL,         -- Politics | Business | Tech | Science | Health | Sports | Entertainment
  region      TEXT NOT NULL,         -- e.g. "Belgium", "Europe", "UAE"
  external_id TEXT UNIQUE,           -- original article URL (deduplication key)
  created_at  TIMESTAMP DEFAULT NOW()
);
```

Articles older than 12 hours are deleted on each scrape cycle to keep the feed fresh.

---

## 8. Scheduler

```typescript
// Calculates milliseconds until the next 4:00 AM UTC
function msUntilNext4amUTC(): number { ... }

// On startup: schedules the first run, then each run reschedules the next
export function startScheduler() {
  scheduleDailyRefresh();  // → setTimeout(runDailyRefresh, msUntilNext4am)
}
```

The scheduler is a lightweight `setTimeout` chain — no external cron dependency. The scraper also runs immediately on server startup so the DB is populated before the first user request.

---

## 9. Proxy & Routing

All artifacts are served through a shared reverse proxy at port 80. The API is mounted at `/api`; the web app at `/`; the mobile app uses `$REPLIT_EXPO_DEV_DOMAIN` for development.

```toml
# artifacts/api-server/.replit-artifact/artifact.toml
[[services]]
localPort = 8080
name = "API Server"
paths = ["/api"]
```

Client code uses relative URLs (`/api/news`) — the proxy handles routing without any Vite proxy config or hardcoded ports in application code.
