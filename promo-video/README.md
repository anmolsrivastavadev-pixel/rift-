# Rift promo video

A ~32-second promo video for Rift, built with [Remotion](https://www.remotion.dev/) (video made from React code). It uses Rift's exact brand colors, font, and landing-page messaging.

This folder is **completely separate from the Rift app** — it has its own dependencies and nothing here affects the app, the database, or deployments.

## The finished video

After rendering, the video is at:

```
promo-video/out/rift-promo.mp4
```

Double-click it to watch. It's 1920×1080 (widescreen, good for YouTube, Twitter/X, LinkedIn, or embedding on the landing page).

## Watch and edit it live (easiest way)

1. Open a terminal in this `promo-video` folder.
2. Run:

   ```
   pnpm run studio
   ```

3. A visual editor opens in your browser with a play button and timeline. You can scrub through the video and see changes instantly when the text in `src/scenes/` is edited.

## Re-render the MP4 after changes

```
pnpm run render
```

The new video replaces `out/rift-promo.mp4`.

## What each scene is (if you want copy changed)

| Scene | File | What it shows |
|---|---|---|
| 1. Intro | `src/scenes/Intro.tsx` | Rift logo + "Turn complaints into business ideas worth testing." |
| 2. Complaints | `src/scenes/Complaints.tsx` | Three customer complaint cards |
| 3. Clustering | `src/scenes/Clustering.tsx` | AI grouping repeated problems |
| 4. Idea + score | `src/scenes/IdeaScore.tsx` | A business idea with the 0–100 score animating |
| 5. Compare | `src/scenes/Compare.tsx` | Pursue / Park / Reject decision badges |
| 6. Outro | `src/scenes/Outro.tsx` | Logo + "Free to start · Pro is $9/month" |

Scene lengths are set in `src/RiftPromo.tsx`. Brand colors live in `src/theme.ts`.
