# The Daily — Personalized Newspaper

A personalized digital newspaper that reshapes itself around your interests — premium broadsheet aesthetics, real live news, and a reading style tuned to how you like it.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/newsroom run dev` — run the newspaper frontend (port 23519)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- Required env: `NEWS_API_KEY` — from newsapi.org (free tier)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: Not used (news is fetched live + in-memory cache)
- Validation: Zod (`zod/v4`), generated from OpenAPI
- API codegen: Orval (from OpenAPI spec)
- Frontend: React + Vite + Tailwind + shadcn/ui
- News source: NewsAPI.org

## Where things live

- `lib/api-spec/openapi.yaml` — API contract (source of truth)
- `artifacts/api-server/src/routes/news.ts` — news fetching, caching, style transformation logic
- `artifacts/newsroom/src/` — React frontend (newspaper UI)
- `artifacts/newsroom/src/hooks/use-preferences.ts` — localStorage preference management
- `artifacts/newsroom/src/pages/` — setup, feed, settings, home pages

## Architecture decisions

- **No database** — user preferences stored in localStorage; news cached in-memory on the server (6h TTL per topic+style key). Keeps deployment simple and stateless.
- **Style transformation is server-side rule-based** — no AI API required. Simple string transforms applied per style (serious/punchy/casual/genz) on titles and descriptions.
- **One cache entry per sorted-topic-set + style** — cache key normalizes topic order so `tech,ai` and `ai,tech` hit the same cache.
- **Parallel topic fetching** — `Promise.all` fetches all topics simultaneously to minimize latency.
- **Pull quotes extracted from content** — server picks a compelling sentence from article content/description to surface as a blockquote callout.

## Product

- **Setup screen** — Pick topics from chips or type custom ones. Choose reading style (Serious / Punchy / Casual / Gen Z).
- **Newspaper feed** — Broadsheet layout: bold masthead, section dividers, hero articles with images, pull quotes, secondary article grid. Feed styled per preference.
- **Settings** — Edit topics + style anytime from gear icon.
- **6-hour refresh** — News auto-refreshes every 6 hours; manual refresh button available.
- **Fully responsive** — Mobile and desktop layouts.
- **Remembers you** — Preferences stored in localStorage, no login required.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- NewsAPI free tier only works for development (localhost). For production deployment, needs a paid NewsAPI plan or alternative (GNews, Currents, etc.).
- `NEWS_API_KEY` must be set in Replit Secrets.
- After any OpenAPI spec change, run codegen before editing routes or frontend.
