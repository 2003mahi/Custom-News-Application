# 📰 The Daily — Personalized Newspaper

> A premium digital newspaper that reshapes itself around your interests. Real live news, delivered with the typographic weight of a broadsheet — styled exactly how you like to read.

---

## ✨ Features

- **Personalized feed** — Choose your topics (Tech, AI, Cricket, Finance, Climate, Space, and more) or type your own
- **4 reading styles** — Serious, Punchy, Casual, or Gen Z — every headline and summary is rewritten server-side to match your voice
- **Real broadsheet layout** — Bold serif masthead, section dividers, hero articles with pull quotes, secondary article grid
- **Live news** — Pulled from NewsAPI.org and cached for 6 hours per topic set
- **Manual refresh** — Force-refresh your feed anytime from the header
- **Remembers you** — Preferences stored in `localStorage`, no account needed
- **Fully responsive** — Mobile and desktop layouts
- **Dark mode** — Late-night reading under a lamp

---

## 🖥️ Screenshots

| Setup Screen | Newspaper Feed |
|:---:|:---:|
| Pick topics & reading style | Full broadsheet layout with pull quotes |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + Tailwind CSS + shadcn/ui |
| Backend | Node.js 24 + Express 5 |
| API Contract | OpenAPI 3.1 → Orval codegen (React Query hooks + Zod schemas) |
| Routing | Wouter |
| News Source | [NewsAPI.org](https://newsapi.org) |
| Caching | In-memory (6-hour TTL per topic set + style) |
| Type Safety | TypeScript 5.9 throughout |
| Monorepo | pnpm workspaces |

---

## 🗂️ Project Structure

```
├── artifacts/
│   ├── api-server/          # Express 5 API — news fetching, caching, style transforms
│   │   └── src/routes/
│   │       └── news.ts      # /news, /news/status, /news/trending endpoints
│   └── newsroom/            # React + Vite frontend
│       └── src/
│           ├── pages/       # home, setup, feed, settings
│           └── hooks/
│               └── use-preferences.ts   # localStorage preference management
├── lib/
│   ├── api-spec/
│   │   └── openapi.yaml     # OpenAPI contract (source of truth)
│   ├── api-client-react/    # Generated React Query hooks
│   └── api-zod/             # Generated Zod validation schemas
└── scripts/                 # Workspace utility scripts
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js 24](https://nodejs.org/)
- [pnpm](https://pnpm.io/) (`npm install -g pnpm`)
- A free [NewsAPI.org](https://newsapi.org/register) API key

### 1. Clone the repo

```bash
git clone https://github.com/2003mahi/Custom-News-Application-.git
cd Custom-News-Application-
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Set your API key

Create a `.env` file in `artifacts/api-server/`:

```env
NEWS_API_KEY=your_newsapi_key_here
SESSION_SECRET=any_random_string
```

### 4. Run the app

In two terminals:

```bash
# Terminal 1 — API server (port 8080)
pnpm --filter @workspace/api-server run dev

# Terminal 2 — Frontend (port 23519)
pnpm --filter @workspace/newsroom run dev
```

Open [http://localhost:23519](http://localhost:23519) in your browser.

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/news?topics=tech,ai&style=casual` | Fetch personalized news feed |
| `GET` | `/api/news/status?topics=tech,ai` | Cache status + last refresh time |
| `GET` | `/api/news/trending` | Suggested topic chips for setup screen |
| `GET` | `/api/healthz` | Health check |

### Reading Styles

| Style | Effect |
|---|---|
| `serious` | Headlines as-is. Authoritative tone. |
| `punchy` | Strips filler phrases. Tight and sharp. |
| `casual` | Adds conversational openers. Plain language. |
| `genz` | Appends "no cap", "fr fr", "it's giving" and more. |

---

## ⚙️ Development Commands

```bash
# Full typecheck across all packages
pnpm run typecheck

# Regenerate API hooks + Zod schemas from OpenAPI spec
pnpm --filter @workspace/api-spec run codegen

# Build all packages
pnpm run build
```

---

## 🏗️ Architecture Decisions

- **No database** — User preferences in `localStorage`; news cached in-memory on the server. Keeps the stack simple and stateless.
- **Server-side style transforms** — No AI API required. Rule-based string transforms per style applied to titles and descriptions.
- **One cache entry per sorted topic set + style** — `tech,ai` and `ai,tech` hit the same cache key.
- **Parallel topic fetching** — `Promise.all` fetches all topics simultaneously to minimize latency.
- **Pull quotes extracted server-side** — A compelling sentence is picked from article content and surfaced as a blockquote callout in the UI.

---

## ⚠️ Known Limitations

- **NewsAPI free tier is localhost-only.** For a publicly deployed app, you'll need a [paid NewsAPI plan](https://newsapi.org/pricing) or swap to a free alternative like [GNews](https://gnews.io) (100 req/day) or [Currents API](https://currentsapi.services) (600 req/day).
- In-memory cache resets on server restart. A Redis or file-based cache would fix this for production.

---

## 📄 License

MIT — free to use, modify, and distribute.

---

<p align="center">Built with ❤️ using React, Express, and NewsAPI</p>
