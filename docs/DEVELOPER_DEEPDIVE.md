# Developer Deep-Dive — NewsFeed

This document is a thorough walkthrough of the application logic for developers who want to understand, extend, or maintain this codebase. It assumes TypeScript/React familiarity.

---

## 1. Running the Project

```bash
# Install all workspace dependencies
pnpm install

# Run the API server (port 8080 — proxied to /api)
pnpm --filter @workspace/api-server run dev

# Run the web app (Vite dev server)
pnpm --filter @workspace/news-app run dev

# Run the mobile app (Expo)
pnpm --filter @workspace/news-mobile run dev

# Push DB schema changes (dev only — requires DATABASE_URL)
pnpm --filter @workspace/db run push

# Regenerate API client hooks from openapi.yaml
pnpm --filter @workspace/api-spec run codegen

# Full typecheck across all packages
pnpm run typecheck
```

**Required env vars:**
- `DATABASE_URL` — PostgreSQL connection string
- `AI_INTEGRATIONS_OPENAI_API_KEY` — OpenAI API key (via Replit integration)
- `AI_INTEGRATIONS_OPENAI_BASE_URL` — OpenAI base URL (via Replit integration)

---

## 2. Monorepo Structure

This is a **pnpm workspace** monorepo. Packages are in two categories:

- `lib/*` — **composite** TypeScript packages (emit declarations via `tsc --build`). They are shared across artifacts.
- `artifacts/*` — **leaf** packages (checked with `tsc --noEmit`). They import from `lib/*` but never from each other.

```
lib/db          → @workspace/db        — Drizzle schema, types, getDbRegions()
lib/api-spec    → @workspace/api-spec  — openapi.yaml + Orval codegen output
artifacts/api-server   → @workspace/api-server   — Express backend
artifacts/news-app     → @workspace/news-app     — React/Vite web frontend
artifacts/news-mobile  → @workspace/news-mobile  — Expo mobile app
```

**Key rule:** If you change a `lib/*` package, run `pnpm run typecheck:libs` before checking leaf packages. This rebuilds declaration files so cross-package imports resolve correctly.

---

## 3. The API Server

### Startup Sequence (`app.ts`)

```typescript
// 1. Middleware stack
app.use(pinoHttp({ logger, ... }));
app.use(cors());
app.use(express.json());

// 2. Replit AI integration routes (chat, image)
registerChatRoutes(app);
registerImageRoutes(app);

// 3. News API routes mounted at /api
app.use("/api", router);

// 4. Bootstrap: seed sample data (only if DB is empty), then scrape
storage.seedNews();
fetchAndProcessNews();  // runs immediately on startup
startScheduler();       // schedules next 4 AM UTC run
```

The scraper runs on **every server startup** (not just on schedule). This means a fresh deployment always has current news before the first user request arrives.

### Route Handlers (`routes/routes.ts`)

```
GET  /api/news            filters: ?region=Germany&topics=Tech,Politics
GET  /api/news/:id        single article lookup by numeric ID
POST /api/news            body: InsertNews (Zod-validated)
POST /api/news/refresh    fires fetchAndProcessNews() in background, returns 202
GET  /api/healthz         returns { status: "ok" }
```

### Logging

**Never use `console.log` in route handlers.** The server uses Pino structured logging:
- `req.log.info(...)` inside route handlers
- `logger.error(...)` everywhere else (imported from `./lib/logger`)

---

## 4. The Scraper

**File:** `artifacts/api-server/src/scraper.ts`

### Source List

All RSS sources are in a single `SOURCES` constant array. Each entry has:

```typescript
{ name: string, url: string, region: string, language: string }
```

- `region` must be one of the valid region strings in `lib/db/src/schema/schema.ts`
- `language` tells the AI what the source language is for translation

### Processing Pipeline

For each source, the scraper fetches up to **10 items** from the RSS feed, then for each item:

```
1. Parse RSS XML with rss-parser
2. Check storage.getNewsByExternalId(item.link) → skip if already stored
3. Send to translateAndSummarize(title, content, language)
   → gpt-4o-mini JSON mode response:
     { translatedTitle, translatedContent, summary, topic }
4. Extract image:
   a. item.enclosure?.url  (RSS media tag)
   b. item.media?.content?.[0]?.url
   c. Fetch article page → jsdom → meta[property="og:image"]
   d. Fallback: Unsplash photo URL
5. INSERT INTO news
```

### AI Prompt

The model is called in `json_object` mode with a single prompt that does all four tasks (translate, expand trending keywords, summarise, categorise) in one API call to minimise latency and cost.

Topics the model can assign: `Politics | Business | Tech | Science | Health | Sports | Entertainment`

"Trending" is **never assigned by the model** — it is a client-side sort mode only.

### Adding a New RSS Source

Add one entry to `SOURCES`:

```typescript
{ name: "Your Source", url: "https://example.com/feed.rss", region: "South Europe", language: "en" },
```

Valid regions are defined in `lib/db/src/schema/schema.ts` in the `regions` array. After saving, restart the API server — the scraper runs immediately.

---

## 5. Region Expansion Logic

**File:** `lib/db/src/schema/schema.ts` → `getDbRegions()`

This is the core of personalised feeds. The UI presents region names; the DB stores flat region strings per article. The function bridges them.

```typescript
export function getDbRegions(region: string): string[] {
  const expansions: Record<string, string[]> = {
    // Continent → expand to all sub-regions
    "Europe":        ["Europe", "Belgium", "Netherlands", "France", "Germany", "South Europe", "North Europe"],
    "Middle East":   ["Middle East", "UAE"],
    "South America": ["South America", "Brazil", "Mexico"],

    // Country → exact match + pan-regional sources
    "Belgium":       ["Belgium", "Europe"],   // shows Euronews, DW, France 24 etc.
    "Germany":       ["Germany", "Europe"],
    "South Europe":  ["South Europe", "Europe"],
    "North Europe":  ["North Europe", "Europe"],
    "UAE":           ["UAE", "Middle East"],
    "Mexico":        ["Mexico", "South America"],
  };
  return expansions[region] ?? [region];  // unknown regions match exactly
}
```

**Why this matters:** An article scraped from Euronews is tagged `region: "Europe"`. Without the expansion, selecting "Germany" in the UI would return zero Euronews articles. With it, selecting "Germany" generates `WHERE region IN ('Germany', 'Europe')`.

**Adding a new sub-region:** Add the region string to the parent's expansion array and create a country-level entry that includes the parent. Example — adding Portugal:

```typescript
"Europe":   [...existing..., "Portugal"],
"Portugal": ["Portugal", "Europe"],
```

---

## 6. Storage Layer

**File:** `artifacts/api-server/src/storage.ts`

`DatabaseStorage` is the only class that touches Drizzle. All other server code imports the singleton `storage`.

```typescript
export const storage = new DatabaseStorage();
```

**Key behaviours:**

- `getNews()` always applies a **12-hour freshness window** (`gte(news.createdAt, twelveHoursAgo)`)
- "Trending" topic never adds a WHERE clause — it is stripped before query building:
  ```typescript
  const realTopics = selectedTopics.filter(t => t !== "Trending");
  ```
- Belgium region applies a priority sort (Euronews → Belga → Le Soir → De Standaard → VRT → RTBF → Brussels Times → BRUZZ) when no specific topic is selected:
  ```typescript
  if (filters?.region === "Belgium" && realTopics.length === 0) {
    return results.sort((a, b) => priorityMap[a.source] ?? 99 - priorityMap[b.source] ?? 99);
  }
  ```

---

## 7. The Scheduler

**File:** `artifacts/api-server/src/scheduler.ts`

A self-rescheduling `setTimeout` chain. No external cron daemon required.

```typescript
function scheduleDailyRefresh() {
  const ms = msUntilNext4amUTC();          // compute ms to next 4:00 AM UTC
  setTimeout(async () => {
    await storage.cleanupOldNews();        // delete articles > 12 h old
    await fetchAndProcessNews();           // scrape all sources
    scheduleDailyRefresh();               // reschedule for next day
  }, ms);
}
```

`msUntilNext4amUTC()` computes the delay by comparing `Date.now()` to the next UTC 4:00 AM boundary. If 4 AM has already passed today, it targets tomorrow's 4 AM.

---

## 8. Web Frontend

**Stack:** React 18 + Vite + TanStack Query + Wouter (routing) + Tailwind + shadcn/ui

### Data Fetching (`use-news.ts`)

```typescript
export function useNews(filters: NewsFilters = {}) {
  return useQuery<NewsItem[]>({
    queryKey: ["/api/news", filters],   // re-fetches when filters change
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.topics?.length) params.set("topics", filters.topics.join(","));
      if (filters.region) params.set("region", filters.region);
      const res = await fetch(`/api/news?${params}`, { credentials: "include" });
      return res.json();
    },
  });
}
```

### Feed Scroll (`Home.tsx`)

CSS scroll-snap is used for the full-screen vertical scroll — no JS scroll library needed:

```css
/* Applied via Tailwind utilities */
overflow-y: scroll;
scroll-snap-type: y mandatory;   /* snap-y-mandatory */
```

Each card:
```css
scroll-snap-align: start;        /* snap-start */
height: 100vh;
```

### Preference Persistence

Preferences are stored in `localStorage` and read on every mount of `Home.tsx`:

```typescript
useEffect(() => {
  const savedRegion = localStorage.getItem("news_region") || "Belgium";
  const savedTopics = JSON.parse(localStorage.getItem("news_topics") ?? '["Trending"]');
  setFilters({ region: savedRegion, topics: savedTopics });
}, []);
```

The Discover page writes directly to `localStorage` when the user changes settings.

---

## 9. Mobile App

**Stack:** Expo SDK 53 + Expo Router + React Native + AsyncStorage

### File-Based Routing

Expo Router maps the file system to navigation routes:

```
app/
  _layout.tsx          → root layout (SafeAreaProvider, FiltersContext)
  (tabs)/
    _layout.tsx         → bottom tab bar
    index.tsx           → "/" — Feed screen
    discover.tsx        → "/discover" — Discover screen
```

### Feed Implementation

`FlatList` with `pagingEnabled` is the native equivalent of CSS scroll-snap:

```typescript
<FlatList
  pagingEnabled                          // snaps each item to screen
  snapToInterval={SCREEN_HEIGHT}         // Dimensions.get("window").height
  snapToAlignment="start"
  decelerationRate="fast"
  getItemLayout={(_, index) => ({
    length: SCREEN_HEIGHT,
    offset: SCREEN_HEIGHT * index,       // pre-computed layout avoids measurement jank
    index,
  })}
/>
```

`getItemLayout` is critical for performance — it lets React Native skip dynamic measurement and jump directly to any index.

### State Management (`FiltersContext.tsx`)

Global filter state is a React Context wrapping `AsyncStorage`. Every update writes to storage synchronously so preferences persist across cold starts:

```typescript
const setRegion = useCallback(async (r: string) => {
  setRegionState(r);                              // update React state (immediate UI)
  await AsyncStorage.setItem("news_region", r);  // persist to device
}, []);
```

On app start, `useEffect` in `FiltersProvider` reads saved values from `AsyncStorage` and hydrates the context before the feed renders.

### Theme System (`useColors.ts`)

All components use `useColors()` instead of hardcoded hex values:

```typescript
export function useColors() {
  return {
    background:       "#090910",
    foreground:       "#F8F8FF",
    primary:          "#E8245C",   // red accent
    accent:           "#8B5CF6",   // purple accent
    card:             "#12121F",
    border:           "#1E1E30",
    mutedForeground:  "#6B7280",
  };
}
```

This single function is the source of truth for the dark theme — changing a value here updates the entire app.

---

## 10. API Contract (OpenAPI-First)

**Source of truth:** `lib/api-spec/openapi.yaml`

Client code is **never written by hand**. After modifying the spec:

```bash
pnpm --filter @workspace/api-spec run codegen
```

This runs Orval and generates:
- TanStack Query hooks → consumed by `news-app`
- Zod schemas → consumed by the API server for request/response validation

**Rule:** If you add a new query parameter or response field, update `openapi.yaml` first, run codegen, then implement the server-side logic.

---

## 11. Database Migrations

Schema is defined in `lib/db/src/schema/schema.ts` using Drizzle. To push schema changes to the development database:

```bash
pnpm --filter @workspace/db run push
```

To apply to the production database after deployment, open a database connection and run the same command with the production `DATABASE_URL`.

**Important:** `drizzle-kit push` requires an interactive terminal (TTY). It cannot be run in CI or non-interactive shells. For production schema changes, consider using `drizzle-kit generate` + `drizzle-kit migrate` for SQL-file-based migrations instead.

---

## 12. Common Extension Patterns

### Add a new region

1. Add the string to the `regions` array in `lib/db/src/schema/schema.ts`
2. Add expansion entries to `getDbRegions()` in the same file
3. Add at least one RSS source in `scraper.ts` with the new region tag
4. Add the region to `REGION_GROUPS` in `artifacts/news-mobile/types/news.ts`
5. Add it to `regionGroups` in `artifacts/news-app/src/pages/Discover.tsx`
6. Run `pnpm run typecheck:libs` to rebuild lib declarations

### Add a new topic category

1. Add the string to the `topics` array in `lib/db/src/schema/schema.ts`
2. Add it to the AI prompt in `scraper.ts` (the list after "Categorize into one of:")
3. Add it to `TOPICS` in `artifacts/news-mobile/types/news.ts`
4. Add it to the topics array in `artifacts/news-app/src/pages/Discover.tsx`

### Trigger a manual scrape

```bash
curl -X POST http://localhost:80/api/news/refresh
# Response: 202 Accepted — scraper runs in background
```

### Inspect what's in the DB

```bash
# Via Drizzle Studio
pnpm --filter @workspace/db run studio
```
