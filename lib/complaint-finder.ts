/* Keyword complaint finder — fetch helpers for Reddit search, App Store
 * reviews, Hacker News, and the whole web (Tavily). Server-only (called from
 * actions/complaint-finder.ts). No DB. Every function fails soft:
 * network/parse errors return an empty list plus an error message so one dead
 * source never breaks the whole search.
 *
 * Reddit: uses the official OAuth API (client_credentials) ONLY. When
 * REDDIT_CLIENT_ID/REDDIT_CLIENT_SECRET are unset the source is disabled with
 * a friendly note — the unauthenticated public-endpoint fallback was removed
 * (July 2026, founder decision) so every source is an official API or a
 * licensed provider.
 * Hacker News: Algolia search API — free, no key or approval needed.
 * Web (M30): Tavily search API (TAVILY_API_KEY) finds complaint-shaped pages
 * across the whole indexed web; Gemini then EXTRACTS verbatim complaint
 * passages from those pages (lib/web-complaint-extract.ts — isolated from the
 * clustering prompt in lib/ai.ts).
 */

import { logger } from "@/lib/logger";
import {
  extractComplaintsFromPages,
  type WebPageText,
} from "@/lib/web-complaint-extract";

export interface FoundComplaint {
  title: string;
  body: string;
  sourceDate: string | null; // ISO string when known
  source:
    | "reddit"
    | "appstore"
    | "hackernews"
    | "web"
    | "youtube"
    | "stackexchange"
    | "github";
  // M31a — receipt: URL of the original public post/page, when the source
  // provides one. Sanitised again before persisting (lib/complaint-sources.ts).
  sourceUrl: string | null;
}

export interface SourceResult {
  complaints: FoundComplaint[];
  error?: string;
}

const FETCH_TIMEOUT_MS = 10_000;
const WEB_EXTRACTION_TIMEOUT_MS = 60_000;
const USER_AGENT = "rift-app/0.1 (complaint research; contact via app)";

const REDDIT_TOKEN_URL = "https://www.reddit.com/api/v1/access_token";
const REDDIT_OAUTH_SEARCH_URL = "https://oauth.reddit.com/search";
const TOKEN_EXPIRY_MARGIN_MS = 60_000;

/** Words that make a Reddit search surface frustration posts. */
const COMPLAINT_TERMS =
  '(frustrating OR annoying OR "so bad" OR problem OR hate OR "wish there was" OR broken)';

async function fetchJson(
  url: string,
  extraHeaders?: Record<string, string>
): Promise<unknown> {
  const res = await fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "application/json",
      ...extraHeaders,
    },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function cleanText(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

/** HN Algolia returns comment/story text as HTML — strip tags and decode the
 * entities that actually occur in HN content. `&amp;` last to avoid
 * double-decoding. */
function stripHtml(s: string): string {
  return s
    .replace(/<[^>]*>/g, " ")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, "/")
    .replace(/&quot;/g, '"')
    .replace(/&gt;/g, ">")
    .replace(/&lt;/g, "<")
    .replace(/&amp;/g, "&");
}

/* ---------------------------------------------------------------- Reddit */

interface RedditChild {
  data?: {
    title?: string;
    selftext?: string;
    created_utc?: number;
    over_18?: boolean;
    stickied?: boolean;
    permalink?: string;
  };
}

/** Reddit requires a descriptive, unique User-Agent (see .env.example). */
function redditUserAgent(): string {
  return process.env.REDDIT_USER_AGENT?.trim() || USER_AGENT;
}

function getRedditCredentials(): {
  clientId: string;
  clientSecret: string;
} | null {
  const clientId = process.env.REDDIT_CLIENT_ID?.trim();
  const clientSecret = process.env.REDDIT_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) return null;
  return { clientId, clientSecret };
}

// App-only OAuth token, cached for the lifetime of the server process (warm
// serverless invocations reuse it; cold starts just fetch a fresh one).
let redditToken: { value: string; expiresAt: number } | null = null;

async function getRedditAccessToken(
  clientId: string,
  clientSecret: string
): Promise<string> {
  if (
    redditToken &&
    Date.now() < redditToken.expiresAt - TOKEN_EXPIRY_MARGIN_MS
  ) {
    return redditToken.value;
  }

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const res = await fetch(REDDIT_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": redditUserAgent(),
    },
    body: "grant_type=client_credentials",
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    cache: "no-store",
  });
  // Error strings name env vars and statuses only — never the secret/token.
  if (!res.ok) {
    throw new Error(
      `auth HTTP ${res.status} (check REDDIT_CLIENT_ID/REDDIT_CLIENT_SECRET)`
    );
  }
  const json = (await res.json()) as {
    access_token?: string;
    expires_in?: number;
    error?: string;
  };
  // Reddit's token endpoint can answer 200 with { error } and no token.
  if (!json.access_token) {
    throw new Error(
      `auth rejected (${json.error ?? "no token in response"}), check REDDIT_CLIENT_ID/REDDIT_CLIENT_SECRET`
    );
  }
  const ttlSec =
    typeof json.expires_in === "number" && json.expires_in > 0
      ? json.expires_in
      : 3600;
  redditToken = {
    value: json.access_token,
    expiresAt: Date.now() + ttlSec * 1000,
  };
  logger.info("reddit.token_refreshed", { ttlSec });
  return json.access_token;
}

function parseRedditListing(json: unknown): FoundComplaint[] {
  const children =
    (json as { data?: { children?: RedditChild[] } })?.data?.children ?? [];

  const complaints: FoundComplaint[] = [];
  for (const child of children) {
    const d = child?.data;
    if (!d || d.over_18 || d.stickied) continue;
    const title = cleanText(d.title ?? "");
    const text = cleanText(d.selftext ?? "");
    // Require some real body text so we import complaints, not link posts.
    const body = text.length >= 30 ? `${title}. ${text}` : title;
    if (body.length < 30) continue;
    complaints.push({
      title: title.slice(0, 200) || body.slice(0, 80),
      body: body.slice(0, 5000),
      sourceDate: d.created_utc
        ? new Date(d.created_utc * 1000).toISOString()
        : null,
      source: "reddit",
      sourceUrl: d.permalink ? `https://www.reddit.com${d.permalink}` : null,
    });
  }
  return complaints;
}

async function searchRedditOAuth(
  params: string,
  creds: { clientId: string; clientSecret: string }
): Promise<unknown> {
  const url = `${REDDIT_OAUTH_SEARCH_URL}?${params}`;
  const doFetch = async () => {
    const token = await getRedditAccessToken(creds.clientId, creds.clientSecret);
    return fetchJson(url, {
      Authorization: `Bearer ${token}`,
      "User-Agent": redditUserAgent(),
    });
  };
  try {
    return await doFetch();
  } catch (err) {
    if (err instanceof Error && err.message === "HTTP 401") {
      // Cached token expired or was revoked — refresh and retry once.
      redditToken = null;
      return doFetch();
    }
    throw err;
  }
}

export async function fetchRedditComplaints(
  keyword: string,
  limit = 25
): Promise<SourceResult> {
  const creds = getRedditCredentials();
  // Official API only. Without approved credentials the source sits out
  // (fail-soft, like an unconfigured Tavily) instead of hitting Reddit's
  // public endpoint unauthenticated.
  if (!creds) {
    logger.info("reddit.disabled_no_credentials", {});
    return {
      complaints: [],
      error:
        "Reddit is temporarily unavailable (waiting for Reddit API approval). Results below come from the other sources.",
    };
  }
  const q = encodeURIComponent(`${keyword} ${COMPLAINT_TERMS}`);
  const params = `q=${q}&sort=relevance&t=year&limit=${limit}&raw_json=1`;
  try {
    const json = await searchRedditOAuth(params, creds);
    return { complaints: parseRedditListing(json) };
  } catch (err) {
    let msg = err instanceof Error ? err.message : "unknown error";
    if (msg === "HTTP 429") {
      msg += ", Reddit rate limit, try again in a minute";
    }
    return {
      complaints: [],
      error: `Reddit search failed (${msg}).`,
    };
  }
}

/* ------------------------------------------------------------- App Store */

interface ITunesApp {
  trackId?: number;
  trackName?: string;
  trackViewUrl?: string;
}

interface AppStoreReviewEntry {
  "im:rating"?: { label?: string };
  title?: { label?: string };
  content?: { label?: string };
  updated?: { label?: string };
}

export async function fetchAppStoreComplaints(
  keyword: string,
  maxApps = 3
): Promise<SourceResult> {
  try {
    const searchUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(keyword)}&entity=software&limit=${maxApps}`;
    const search = (await fetchJson(searchUrl)) as { results?: ITunesApp[] };
    const apps = (search.results ?? []).filter((a) => a.trackId);
    if (apps.length === 0) {
      return { complaints: [], error: "No matching apps found on the App Store." };
    }

    const perApp = await Promise.all(
      apps.map(async (app) => {
        try {
          const rssUrl = `https://itunes.apple.com/us/rss/customerreviews/page=1/id=${app.trackId}/sortby=mostrecent/json`;
          const rss = (await fetchJson(rssUrl)) as {
            feed?: { entry?: AppStoreReviewEntry | AppStoreReviewEntry[] };
          };
          const raw = rss?.feed?.entry;
          const entries = Array.isArray(raw) ? raw : raw ? [raw] : [];
          // Per-review RSS links are unreliable (often dead-end at the app
          // anyway), so the receipt is the app's REVIEWS section.
          const appBase =
            app.trackViewUrl ?? `https://apps.apple.com/app/id${app.trackId}`;
          const appUrl = appBase.includes("?")
            ? `${appBase}&see-all=reviews`
            : `${appBase}?see-all=reviews`;
          const out: FoundComplaint[] = [];
          for (const e of entries) {
            const rating = Number(e["im:rating"]?.label ?? "5");
            if (rating > 3) continue; // keep 1–3 star reviews (complaints)
            const title = cleanText(e.title?.label ?? "");
            const content = cleanText(e.content?.label ?? "");
            if (content.length < 20) continue;
            const appName = app.trackName ? ` [${app.trackName}]` : "";
            out.push({
              title: (title || content.slice(0, 80)).slice(0, 200),
              body: `${content}${appName}`.slice(0, 5000),
              sourceDate: e.updated?.label ?? null,
              source: "appstore",
              sourceUrl: appUrl,
            });
          }
          return out;
        } catch {
          return [] as FoundComplaint[]; // one app failing is fine
        }
      })
    );

    return { complaints: perApp.flat() };
  } catch (err) {
    return {
      complaints: [],
      error: `App Store search failed (${err instanceof Error ? err.message : "unknown error"}).`,
    };
  }
}

/* ---------------------------------------------------------------- Web (Tavily) */

const TAVILY_SEARCH_URL = "https://api.tavily.com/search";
const TAVILY_MAX_RESULTS = 8;
const TAVILY_PAGE_TEXT_CAP = 4000;
const TAVILY_MAX_PAGES = 12;

/** Three search angles per niche — different phrasings surface different
 * complaint-rich pages. NOTE: 3 Tavily calls per finder search (~330 searches
 * per month on Tavily's free tier) — fine at beta scale. */
function tavilyQueries(keyword: string): string[] {
  return [
    `"${keyword}" complaints problems frustrating`,
    `"${keyword}" "so frustrating" OR "i hate" review`,
    `why I stopped using "${keyword}" alternatives`,
  ];
}

interface TavilyResult {
  title?: string;
  url?: string;
  content?: string;
  raw_content?: string | null;
  published_date?: string;
}

/**
 * M30 — whole-web source. Tavily searches the entire indexed web for
 * complaint-shaped pages about the keyword; Gemini extracts the verbatim
 * complaint passages. Requires TAVILY_API_KEY; without it (or on any
 * failure) this fails soft with a per-source error like the other sources.
 */
export async function fetchWebComplaints(keyword: string): Promise<SourceResult> {
  const apiKey = process.env.TAVILY_API_KEY?.trim();
  if (!apiKey) {
    return {
      complaints: [],
      error:
        "Web search is not configured (set TAVILY_API_KEY, see .env.example).",
    };
  }

  async function tavilySearch(query: string): Promise<TavilyResult[]> {
    const res = await fetch(TAVILY_SEARCH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        search_depth: "basic",
        max_results: TAVILY_MAX_RESULTS,
        include_raw_content: true,
      }),
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      cache: "no-store",
    });
    // Error strings name statuses and env vars only — never the key.
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = (await res.json()) as { results?: TavilyResult[] };
    return json.results ?? [];
  }

  // Three angles in parallel; one failed query is ignored, all failing
  // fails soft with the first error (same pattern as the HN per-term search).
  const settled = await Promise.allSettled(
    tavilyQueries(keyword).map((q) => tavilySearch(q))
  );
  const succeeded = settled.filter(
    (s): s is PromiseFulfilledResult<TavilyResult[]> => s.status === "fulfilled"
  );
  if (succeeded.length === 0) {
    const first = settled[0] as PromiseRejectedResult;
    let msg =
      first.reason instanceof Error ? first.reason.message : "unknown error";
    if (msg === "HTTP 401" || msg === "HTTP 403") {
      msg += " (check TAVILY_API_KEY)";
    }
    return { complaints: [], error: `Web search failed (${msg}).` };
  }

  // Merge across angles, dedupe by URL, keep first occurrence.
  const seenUrls = new Set<string>();
  const results: TavilyResult[] = [];
  for (const s of succeeded) {
    for (const r of s.value) {
      const url = r.url ?? "";
      if (url && seenUrls.has(url)) continue;
      if (url) seenUrls.add(url);
      results.push(r);
    }
  }

  const pages: WebPageText[] = results
    .map((r) => ({
      url: r.url ?? "",
      title: cleanText(r.title ?? ""),
      text: cleanText(r.raw_content || r.content || "").slice(
        0,
        TAVILY_PAGE_TEXT_CAP
      ),
      publishedDate: r.published_date ?? null,
    }))
    .filter((p) => p.text.length >= 100)
    .slice(0, TAVILY_MAX_PAGES);

  if (pages.length === 0) {
    return { complaints: [], error: "Web search found no readable pages." };
  }

  try {
    const extracted = await Promise.race([
      extractComplaintsFromPages(keyword, pages),
      new Promise<"timeout">((resolve) =>
        setTimeout(() => resolve("timeout"), WEB_EXTRACTION_TIMEOUT_MS)
      ),
    ]);
    if (extracted === "timeout") {
      logger.warn("web_finder.extract_timed_out", { keyword, pages: pages.length });
      return { complaints: [], error: "Web extraction timed out." };
    }
    // M31a — the extractor echoes a 1-based pageIndex per passage, so each
    // complaint gets ITS page's URL (receipt) and published date. A missing or
    // out-of-range index degrades to no receipt / no date, never a failure.
    const complaints: FoundComplaint[] = extracted.complaints.map((c) => {
      const page = c.pageIndex ? pages[c.pageIndex - 1] : undefined;
      return {
        title: cleanText(c.title).slice(0, 200),
        body: cleanText(c.body).slice(0, 5000),
        sourceDate: page?.publishedDate ?? null,
        source: "web",
        sourceUrl: page?.url || null,
      };
    });
    logger.info("web_finder.done", {
      keyword,
      pages: pages.length,
      complaints: complaints.length,
    });
    return { complaints };
  } catch (err) {
    logger.error("web_finder.extract_failed", {
      keyword,
      error: err instanceof Error ? err.message : String(err),
    });
    return {
      complaints: [],
      error: "Web extraction failed. Try again in a moment.",
    };
  }
}

/* ---------------------------------------------------------------- YouTube */

const YT_SEARCH_URL = "https://www.googleapis.com/youtube/v3/search";
const YT_COMMENTS_URL = "https://www.googleapis.com/youtube/v3/commentThreads";

/** Deterministic complaint markers for YouTube comments (no AI call —
 * comment volume is high and most comments are praise/noise). */
const YT_COMPLAINT_MARKERS = [
  "frustrating",
  "annoying",
  "problem",
  "hate",
  "broken",
  "wish",
  "stopped using",
  "doesn't work",
  "does not work",
  "terrible",
  "worst",
  "issue",
];

interface YTCommentThread {
  snippet?: {
    topLevelComment?: {
      id?: string;
      snippet?: {
        textDisplay?: string;
        publishedAt?: string;
      };
    };
  };
}

/**
 * Comments under "review of X" videos — official YouTube Data API v3,
 * key-gated on YOUTUBE_API_KEY (free key, see .env.example). Without the key
 * the source silently sits out (no per-search nag). Receipt is a per-comment
 * deep link (watch?v=…&lc=…) that lands on the exact comment.
 * Quota: ~105 of the free 10,000 daily units per finder run.
 */
export async function fetchYouTubeComplaints(
  keyword: string,
  maxVideos = 5
): Promise<SourceResult> {
  const apiKey = process.env.YOUTUBE_API_KEY?.trim();
  if (!apiKey) {
    logger.info("youtube.disabled_no_key", {});
    return { complaints: [] };
  }

  try {
    const q = encodeURIComponent(`${keyword} review problems`);
    const searchUrl = `${YT_SEARCH_URL}?part=snippet&type=video&maxResults=${maxVideos}&q=${q}&key=${apiKey}`;
    const search = (await fetchJson(searchUrl)) as {
      items?: { id?: { videoId?: string } }[];
    };
    const videoIds = (search.items ?? [])
      .map((i) => i.id?.videoId)
      .filter((v): v is string => Boolean(v));
    if (videoIds.length === 0) {
      return { complaints: [], error: "No matching YouTube videos found." };
    }

    const perVideo = await Promise.all(
      videoIds.map(async (videoId) => {
        try {
          const url = `${YT_COMMENTS_URL}?part=snippet&videoId=${videoId}&maxResults=25&order=relevance&textFormat=plainText&key=${apiKey}`;
          const json = (await fetchJson(url)) as { items?: YTCommentThread[] };
          const out: FoundComplaint[] = [];
          for (const item of json.items ?? []) {
            const top = item.snippet?.topLevelComment;
            const s = top?.snippet;
            const text = cleanText(s?.textDisplay ?? "");
            if (text.length < 30) continue;
            const lower = text.toLowerCase();
            if (!YT_COMPLAINT_MARKERS.some((m) => lower.includes(m))) continue;
            if (!top?.id) continue;
            out.push({
              title: text.slice(0, 80),
              body: text.slice(0, 5000),
              sourceDate: s?.publishedAt ?? null,
              source: "youtube",
              sourceUrl: `https://www.youtube.com/watch?v=${videoId}&lc=${top.id}`,
            });
          }
          return out;
        } catch {
          return [] as FoundComplaint[]; // comments disabled on a video is fine
        }
      })
    );

    return { complaints: perVideo.flat() };
  } catch (err) {
    // Error strings name statuses and env vars only — never the key.
    let msg = err instanceof Error ? err.message : "unknown error";
    if (msg === "HTTP 400" || msg === "HTTP 403") {
      msg += " (check YOUTUBE_API_KEY)";
    }
    return { complaints: [], error: `YouTube search failed (${msg}).` };
  }
}

/* --------------------------------------------------------- Stack Exchange */

const SE_SEARCH_URL = "https://api.stackexchange.com/2.3/search/advanced";
/** Complaint words that surface frustration questions (parallel per-term
 * searches, same pattern as Hacker News). */
const SE_COMPLAINT_TERMS = ["frustrating", "problem"];

interface SEQuestion {
  question_id?: number;
  title?: string;
  body?: string; // HTML
  link?: string;
  creation_date?: number; // unix seconds
}

/**
 * Questions on Stack Overflow phrased around the niche + a complaint word —
 * official Stack Exchange API, no key needed (keyless quota 300 req/day; one
 * finder run uses 2). Shines for developer/tech niches; consumer niches just
 * return few or zero results (fail-soft).
 */
export async function fetchStackExchangeComplaints(
  keyword: string,
  limit = 25
): Promise<SourceResult> {
  try {
    const perTerm = await Promise.all(
      SE_COMPLAINT_TERMS.map(async (term) => {
        try {
          const q = encodeURIComponent(`${keyword} ${term}`);
          const url = `${SE_SEARCH_URL}?order=desc&sort=relevance&q=${q}&site=stackoverflow&filter=withbody&pagesize=15`;
          const json = (await fetchJson(url)) as { items?: SEQuestion[] };
          return json.items ?? [];
        } catch {
          return [] as SEQuestion[]; // one term failing is fine
        }
      })
    );

    const seen = new Set<number>();
    const complaints: FoundComplaint[] = [];
    for (const item of perTerm.flat()) {
      if (complaints.length >= limit) break;
      if (!item?.question_id || seen.has(item.question_id)) continue;
      seen.add(item.question_id);
      const title = cleanText(stripHtml(item.title ?? ""));
      const body = cleanText(stripHtml(item.body ?? ""));
      if (body.length < 30) continue;
      complaints.push({
        title: title.slice(0, 200) || body.slice(0, 80),
        body: body.slice(0, 5000),
        sourceDate: item.creation_date
          ? new Date(item.creation_date * 1000).toISOString()
          : null,
        source: "stackexchange",
        sourceUrl: item.link ?? null,
      });
    }
    return { complaints };
  } catch (err) {
    return {
      complaints: [],
      error: `Stack Exchange search failed (${err instanceof Error ? err.message : "unknown error"}).`,
    };
  }
}

/* ------------------------------------------------------------------ GitHub */

const GITHUB_SEARCH_URL = "https://api.github.com/search/issues";

interface GitHubIssue {
  title?: string;
  body?: string | null;
  html_url?: string;
  created_at?: string;
}

/**
 * Open GitHub issues mentioning the niche — official GitHub search API, no
 * key needed (unauthenticated limit 10 searches/min; one finder run uses 1).
 * Like Stack Exchange, this shines for software niches and quietly returns
 * little for consumer ones.
 */
export async function fetchGitHubComplaints(
  keyword: string,
  limit = 15
): Promise<SourceResult> {
  try {
    const q = encodeURIComponent(`"${keyword}" in:title,body type:issue`);
    const url = `${GITHUB_SEARCH_URL}?q=${q}&sort=reactions&per_page=${limit}`;
    const json = (await fetchJson(url, {
      Accept: "application/vnd.github+json",
    })) as { items?: GitHubIssue[] };

    const complaints: FoundComplaint[] = [];
    for (const item of json.items ?? []) {
      const title = cleanText(item.title ?? "");
      const body = cleanText(item.body ?? "");
      const combined = body.length >= 30 ? `${title}. ${body}` : title;
      if (combined.length < 30) continue;
      complaints.push({
        title: title.slice(0, 200) || combined.slice(0, 80),
        body: combined.slice(0, 5000),
        sourceDate: item.created_at ?? null,
        source: "github",
        sourceUrl: item.html_url ?? null,
      });
    }
    return { complaints };
  } catch (err) {
    let msg = err instanceof Error ? err.message : "unknown error";
    if (msg === "HTTP 403") {
      msg += ", GitHub rate limit, try again in a minute";
    }
    return { complaints: [], error: `GitHub search failed (${msg}).` };
  }
}

/* ------------------------------------------------------------ Hacker News */

const HN_SEARCH_URL = "https://hn.algolia.com/api/v1/search";
/** Algolia has no OR syntax in the query string, so run one search per
 * complaint word and merge. */
const HN_COMPLAINT_TERMS = ["frustrating", "annoying", "problem"];
const HN_WINDOW_SECONDS = 2 * 365 * 24 * 3600; // HN volume is lower than Reddit's

interface HNHit {
  objectID?: string;
  title?: string;
  story_title?: string;
  comment_text?: string;
  story_text?: string;
  created_at?: string;
}

export async function fetchHackerNewsComplaints(
  keyword: string,
  limit = 25
): Promise<SourceResult> {
  try {
    const since = Math.floor(Date.now() / 1000) - HN_WINDOW_SECONDS;
    const perTerm = await Promise.all(
      HN_COMPLAINT_TERMS.map(async (term) => {
        try {
          const q = encodeURIComponent(`${keyword} ${term}`);
          const url = `${HN_SEARCH_URL}?query=${q}&tags=(story,comment)&hitsPerPage=15&numericFilters=created_at_i>${since}`;
          const json = (await fetchJson(url)) as { hits?: HNHit[] };
          return json.hits ?? [];
        } catch {
          return [] as HNHit[]; // one term failing is fine
        }
      })
    );

    const seen = new Set<string>();
    const complaints: FoundComplaint[] = [];
    for (const hit of perTerm.flat()) {
      if (complaints.length >= limit) break;
      if (!hit?.objectID || seen.has(hit.objectID)) continue;
      seen.add(hit.objectID);
      const rawTitle = hit.story_title ?? hit.title ?? "";
      const title =
        rawTitle === "[dead]" || rawTitle === "[flagged]"
          ? ""
          : cleanText(stripHtml(rawTitle));
      const body = cleanText(stripHtml(hit.comment_text ?? hit.story_text ?? ""));
      // Same bar as Reddit: real body text only, no bare links/titles.
      if (body.length < 30) continue;
      complaints.push({
        title: title.slice(0, 200) || body.slice(0, 80),
        body: body.slice(0, 5000),
        sourceDate: hit.created_at ?? null,
        source: "hackernews",
        sourceUrl: `https://news.ycombinator.com/item?id=${hit.objectID}`,
      });
    }
    return { complaints };
  } catch (err) {
    return {
      complaints: [],
      error: `Hacker News search failed (${err instanceof Error ? err.message : "unknown error"}).`,
    };
  }
}
