/* Keyword complaint finder — fetch helpers for Reddit search and App Store
 * reviews. Server-only (called from actions/complaint-finder.ts). No Gemini,
 * no DB. Every function fails soft: network/parse errors return an empty list
 * plus an error message so one dead source never breaks the whole search.
 */

export interface FoundComplaint {
  title: string;
  body: string;
  sourceDate: string | null; // ISO string when known
  source: "reddit" | "appstore";
}

export interface SourceResult {
  complaints: FoundComplaint[];
  error?: string;
}

const FETCH_TIMEOUT_MS = 10_000;
const USER_AGENT = "rift-app/0.1 (complaint research; contact via app)";

/** Words that make a Reddit search surface frustration posts. */
const COMPLAINT_TERMS =
  '(frustrating OR annoying OR "so bad" OR problem OR hate OR "wish there was" OR broken)';

async function fetchJson(url: string): Promise<unknown> {
  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function cleanText(s: string): string {
  return s.replace(/\s+/g, " ").trim();
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

export async function fetchRedditComplaints(
  keyword: string,
  limit = 25
): Promise<SourceResult> {
  try {
    const q = encodeURIComponent(`${keyword} ${COMPLAINT_TERMS}`);
    const url = `https://www.reddit.com/search.json?q=${q}&sort=relevance&t=year&limit=${limit}&raw_json=1`;
    const json = (await fetchJson(url)) as {
      data?: { children?: RedditChild[] };
    };
    const children = json?.data?.children ?? [];

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
    return { complaints };
  } catch (err) {
    return {
      complaints: [],
      error: `Reddit search failed (${err instanceof Error ? err.message : "unknown error"}).`,
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
