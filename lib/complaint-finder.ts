/* Keyword complaint finder — fetch helpers for Reddit search, App Store
 * reviews, Hacker News, and the whole web (Tavily). Server-only (called from
 * actions/complaint-finder.ts). No DB. Every function fails soft:
 * network/parse errors return an empty list plus an error message so one dead
 * source never breaks the whole search.
 *
 * Reddit: uses the official OAuth API (client_credentials) when
 * REDDIT_CLIENT_ID/REDDIT_CLIENT_SECRET are set; otherwise falls back to the
 * public endpoint, which Reddit often blocks (403) from server IPs.
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
  source: "reddit" | "appstore" | "hackernews" | "web";
}

export interface SourceResult {
  complaints: FoundComplaint[];
  error?: string;
}

const FETCH_TIMEOUT_MS = 10_000;
const USER_AGENT = "rift-app/0.1 (complaint research; contact via app)";

const REDDIT_TOKEN_URL = "https://www.reddit.com/api/v1/access_token";
const REDDIT_OAUTH_SEARCH_URL = "https://oauth.reddit.com/search";
const REDDIT_PUBLIC_SEARCH_URL = "https://www.reddit.com/search.json";
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
      `auth HTTP ${res.status} — check REDDIT_CLIENT_ID/REDDIT_CLIENT_SECRET`
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
      `auth rejected (${json.error ?? "no token in response"}) — check REDDIT_CLIENT_ID/REDDIT_CLIENT_SECRET`
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
  const q = encodeURIComponent(`${keyword} ${COMPLAINT_TERMS}`);
  const params = `q=${q}&sort=relevance&t=year&limit=${limit}&raw_json=1`;
  try {
    if (!creds) {
      logger.warn("reddit.no_credentials_using_public", {});
      const json = await fetchJson(`${REDDIT_PUBLIC_SEARCH_URL}?${params}`);
      return { complaints: parseRedditListing(json) };
    }
    const json = await searchRedditOAuth(params, creds);
    return { complaints: parseRedditListing(json) };
  } catch (err) {
    let msg = err instanceof Error ? err.message : "unknown error";
    if (!creds && msg === "HTTP 403") {
      msg +=
        " — set REDDIT_CLIENT_ID and REDDIT_CLIENT_SECRET (see .env.example) to use Reddit's official API";
    }
    if (msg === "HTTP 429") {
      msg += " — Reddit rate limit, try again in a minute";
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
        "Web search is not configured (set TAVILY_API_KEY — see .env.example).",
    };
  }

  let results: TavilyResult[];
  try {
    const res = await fetch(TAVILY_SEARCH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: apiKey,
        query: `"${keyword}" complaints problems frustrating`,
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
    results = json.results ?? [];
  } catch (err) {
    let msg = err instanceof Error ? err.message : "unknown error";
    if (msg === "HTTP 401" || msg === "HTTP 403") {
      msg += " — check TAVILY_API_KEY";
    }
    return { complaints: [], error: `Web search failed (${msg}).` };
  }

  const pages: WebPageText[] = results
    .map((r) => ({
      url: r.url ?? "",
      title: cleanText(r.title ?? ""),
      text: cleanText(r.raw_content || r.content || "").slice(
        0,
        TAVILY_PAGE_TEXT_CAP
      ),
    }))
    .filter((p) => p.text.length >= 100);

  if (pages.length === 0) {
    return { complaints: [], error: "Web search found no readable pages." };
  }

  try {
    const extracted = await extractComplaintsFromPages(keyword, pages);
    const publishedByIndex = results.find((r) => r.published_date)?.published_date;
    const complaints: FoundComplaint[] = extracted.complaints.map((c) => ({
      title: cleanText(c.title).slice(0, 200),
      body: cleanText(c.body).slice(0, 5000),
      // Page-level dates rarely map to individual passages; only use one when
      // Tavily supplied it, otherwise leave null (import date is used).
      sourceDate: publishedByIndex ?? null,
      source: "web",
    }));
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
      error: "Web extraction failed — try again in a moment.",
    };
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
