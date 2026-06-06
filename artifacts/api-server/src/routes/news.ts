import { Router, type IRouter } from "express";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const NEWS_API_KEY = process.env.NEWS_API_KEY;
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

interface CacheEntry {
  feed: NewsFeedData;
  fetchedAt: number;
}

interface RawArticle {
  title: string;
  description: string | null;
  content: string | null;
  url: string;
  urlToImage: string | null;
  source: { name: string };
  author: string | null;
  publishedAt: string;
}

interface ArticleData {
  id: string;
  title: string;
  styledTitle: string;
  description: string;
  styledDescription: string;
  content: string | null;
  url: string;
  urlToImage: string | null;
  source: string;
  author: string | null;
  publishedAt: string;
  topic: string;
  pullQuote: string | null;
}

interface ArticleSectionData {
  topic: string;
  headline: string;
  articles: ArticleData[];
}

interface NewsFeedData {
  sections: ArticleSectionData[];
  masthead: string;
  lastRefreshed: string;
  nextRefresh: string;
  style: string;
  edition: string;
  totalArticles: number;
}

const feedCache = new Map<string, CacheEntry>();

const TRENDING_TOPICS = [
  { name: "Technology", category: "Tech", emoji: "💻" },
  { name: "Artificial Intelligence", category: "Tech", emoji: "🤖" },
  { name: "Cricket", category: "Sports", emoji: "🏏" },
  { name: "Finance", category: "Business", emoji: "📈" },
  { name: "Politics", category: "World", emoji: "🗳️" },
  { name: "Climate", category: "Science", emoji: "🌍" },
  { name: "Space", category: "Science", emoji: "🚀" },
  { name: "Sports", category: "Sports", emoji: "⚽" },
  { name: "Health", category: "Lifestyle", emoji: "❤️" },
  { name: "Science", category: "Science", emoji: "🔬" },
  { name: "Entertainment", category: "Culture", emoji: "🎬" },
  { name: "Gaming", category: "Tech", emoji: "🎮" },
  { name: "Business", category: "Business", emoji: "💼" },
  { name: "Startups", category: "Tech", emoji: "🚀" },
  { name: "Music", category: "Culture", emoji: "🎵" },
  { name: "Football", category: "Sports", emoji: "🏈" },
];

function getCacheKey(topics: string, style: string): string {
  const sorted = topics
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .sort()
    .join(",");
  return `${sorted}::${style}`;
}

function applyStyle(text: string, style: string, isTitle: boolean): string {
  if (!text) return text;

  switch (style) {
    case "serious":
      return text;

    case "punchy": {
      if (isTitle) {
        // Remove filler phrases, keep it tight
        let t = text
          .replace(/^(Here's|This is|The latest|Breaking:|Update:|Report:)\s*/i, "")
          .replace(/\s+says\s+report$/i, "")
          .replace(/\s+according to.*$/i, "")
          .trim();
        if (t.length > 80) t = t.slice(0, 77) + "...";
        return t;
      }
      // Descriptions: drop hedging language
      return text
        .replace(/it (has been|is being) (reported|said|claimed) that\s*/gi, "")
        .replace(/\bapparently\b/gi, "")
        .replace(/\bseems to\b/gi, "")
        .trim();
    }

    case "casual": {
      if (isTitle) {
        // Soften capitals, add conversational opener
        const openers = ["So,", "Heads up —", "Big news:", "Just in:", "Check this:"];
        const opener = openers[Math.abs(hashStr(text)) % openers.length];
        return `${opener} ${text.charAt(0).toLowerCase() + text.slice(1)}`;
      }
      return text
        .replace(/\bfurthermore\b/gi, "also")
        .replace(/\bsubsequently\b/gi, "then")
        .replace(/\butilize\b/gi, "use")
        .replace(/\bcommenced\b/gi, "started")
        .trim();
    }

    case "genz": {
      if (isTitle) {
        const tags = [
          "no cap",
          "lowkey wild",
          "this is giving everything",
          "slay",
          "it's giving",
          "fr fr",
          "bestie this is huge",
          "not me shook",
          "ok but this slaps",
        ];
        const tag = tags[Math.abs(hashStr(text)) % tags.length];
        return `${text} (${tag})`;
      }
      return (
        text
          .replace(/\bvery\b/gi, "SO")
          .replace(/\bextremely\b/gi, "literally so")
          .replace(/\bsignificant\b/gi, "lowkey massive")
          .replace(/\bimportant\b/gi, "kinda huge ngl")
          .replace(/\bsaid\b/gi, "literally said")
          .trim() + " No cap."
      );
    }

    default:
      return text;
  }
}

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return h;
}

function extractPullQuote(
  content: string | null,
  description: string | null
): string | null {
  const source = content || description;
  if (!source) return null;

  // Split on sentence boundaries, pick a meaty one
  const sentences = source
    .replace(/\[\+\d+ chars\]/, "")
    .split(/(?<=[.!?])\s+/)
    .filter((s) => s.length > 60 && s.length < 200);

  if (sentences.length === 0) return null;

  // Prefer sentences with strong language
  const strong = sentences.find(
    (s) => /\b(record|historic|unprecedented|first|largest|major|critical|key)\b/i.test(s)
  );
  return strong || sentences[0];
}

function getSectionHeadline(topic: string, style: string): string {
  const base = topic.toUpperCase();
  switch (style) {
    case "serious":
      return `${base} REPORT`;
    case "punchy":
      return `${base}: WHAT YOU NEED TO KNOW`;
    case "casual":
      return `What's up in ${topic}`;
    case "genz":
      return `${base} dropped something ✨`;
    default:
      return base;
  }
}

function getEditionLabel(): string {
  const now = new Date();
  const hour = now.getHours();
  let period = "Morning";
  if (hour >= 12 && hour < 17) period = "Afternoon";
  else if (hour >= 17 && hour < 21) period = "Evening";
  else if (hour >= 21 || hour < 5) period = "Late Night";

  const formatted = now.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  return `${period} Edition · ${formatted}`;
}

async function fetchTopicNews(topic: string): Promise<RawArticle[]> {
  if (!NEWS_API_KEY) {
    throw new Error("NEWS_API_KEY is not configured");
  }

  const url = new URL("https://newsapi.org/v2/everything");
  url.searchParams.set("q", topic);
  url.searchParams.set("apiKey", NEWS_API_KEY);
  url.searchParams.set("language", "en");
  url.searchParams.set("pageSize", "8");
  url.searchParams.set("sortBy", "publishedAt");

  const resp = await fetch(url.toString());
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`NewsAPI error ${resp.status}: ${text}`);
  }

  const data = (await resp.json()) as {
    status: string;
    articles: RawArticle[];
    message?: string;
  };

  if (data.status !== "ok") {
    throw new Error(`NewsAPI returned status: ${data.status} — ${data.message}`);
  }

  return (data.articles || []).filter(
    (a) =>
      a.title &&
      a.title !== "[Removed]" &&
      a.description &&
      a.description !== "[Removed]"
  );
}

async function buildFeed(
  topics: string[],
  style: string
): Promise<NewsFeedData> {
  const sections: ArticleSectionData[] = [];

  await Promise.all(
    topics.map(async (topic) => {
      try {
        const raw = await fetchTopicNews(topic);
        const articles: ArticleData[] = raw.slice(0, 6).map((a, i) => ({
          id: `${topic}-${i}-${Date.now()}`,
          title: a.title,
          styledTitle: applyStyle(a.title, style, true),
          description: a.description || "",
          styledDescription: applyStyle(a.description || "", style, false),
          content: a.content,
          url: a.url,
          urlToImage: a.urlToImage,
          source: a.source?.name || "Unknown",
          author: a.author,
          publishedAt: a.publishedAt,
          topic,
          pullQuote: i === 0 ? extractPullQuote(a.content, a.description) : null,
        }));

        if (articles.length > 0) {
          sections.push({
            topic,
            headline: getSectionHeadline(topic, style),
            articles,
          });
        }
      } catch (err) {
        logger.warn({ err, topic }, "Failed to fetch news for topic");
      }
    })
  );

  // Sort sections to match original topic order
  sections.sort(
    (a, b) => topics.indexOf(a.topic) - topics.indexOf(b.topic)
  );

  const now = new Date();
  const nextRefresh = new Date(now.getTime() + CACHE_TTL_MS);

  return {
    sections,
    masthead: "THE DAILY",
    lastRefreshed: now.toISOString(),
    nextRefresh: nextRefresh.toISOString(),
    style,
    edition: getEditionLabel(),
    totalArticles: sections.reduce((sum, s) => sum + s.articles.length, 0),
  };
}

// GET /news
router.get("/news", async (req, res): Promise<void> => {
  const { topics: topicsRaw, style, refresh } = req.query as {
    topics?: string;
    style?: string;
    refresh?: string;
  };

  if (!topicsRaw || !style) {
    res.status(400).json({ error: "topics and style query parameters are required" });
    return;
  }

  const validStyles = ["serious", "punchy", "casual", "genz"];
  if (!validStyles.includes(style)) {
    res.status(400).json({ error: `style must be one of: ${validStyles.join(", ")}` });
    return;
  }

  const topics = topicsRaw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  if (topics.length === 0) {
    res.status(400).json({ error: "At least one topic is required" });
    return;
  }

  const cacheKey = getCacheKey(topicsRaw, style);
  const forceRefresh = refresh === "true";

  const cached = feedCache.get(cacheKey);
  const isExpired = !cached || Date.now() - cached.fetchedAt > CACHE_TTL_MS;

  if (cached && !isExpired && !forceRefresh) {
    req.log.info({ cacheKey, cached: true }, "Serving news from cache");
    res.json(cached.feed);
    return;
  }

  try {
    req.log.info({ topics, style }, "Fetching fresh news");
    const feed = await buildFeed(topics, style);
    feedCache.set(cacheKey, { feed, fetchedAt: Date.now() });
    res.json(feed);
  } catch (err) {
    req.log.error({ err }, "Failed to build news feed");
    res.status(500).json({ error: "Failed to fetch news. Please try again." });
  }
});

// GET /news/status
router.get("/news/status", async (req, res): Promise<void> => {
  const { topics: topicsRaw } = req.query as { topics?: string };

  if (!topicsRaw) {
    res.status(400).json({ error: "topics query parameter is required" });
    return;
  }

  // Check across all styles for any cached entry
  const validStyles = ["serious", "punchy", "casual", "genz"];
  let latestEntry: CacheEntry | null = null;

  for (const style of validStyles) {
    const key = getCacheKey(topicsRaw, style);
    const entry = feedCache.get(key);
    if (entry && (!latestEntry || entry.fetchedAt > latestEntry.fetchedAt)) {
      latestEntry = entry;
    }
  }

  if (!latestEntry) {
    res.json({
      lastRefreshed: null,
      nextRefresh: null,
      isCached: false,
      topics: topicsRaw,
    });
    return;
  }

  const nextRefresh = new Date(latestEntry.fetchedAt + CACHE_TTL_MS);
  res.json({
    lastRefreshed: new Date(latestEntry.fetchedAt).toISOString(),
    nextRefresh: nextRefresh.toISOString(),
    isCached: true,
    topics: topicsRaw,
  });
});

// GET /news/trending
router.get("/news/trending", async (_req, res): Promise<void> => {
  res.json({ topics: TRENDING_TOPICS });
});

export default router;
