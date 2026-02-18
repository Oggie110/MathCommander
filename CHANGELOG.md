# Changelog

## v0.6.0 (2026-02-10)

### Added
- **PWA support** — App manifest, favicons (16/32), apple-touch-icon, and 192/512 PWA icons
- **Anonymous analytics** — Game start counter via `/api/track` using Upstash Redis (daily + all-time)
- **Rate limiting** — Per-IP sliding window (10 req/min) on the tracking endpoint via `@upstash/ratelimit`
- **404 handling** — Catch-all route redirects unknown paths to home

### Changed
- Replaced Vercel Analytics with lightweight `sendBeacon`-based tracking (production only)
- Hardened all `localStorage` reads/writes with try/catch and safe fallbacks
- Daily Redis stat keys now expire after 90 days

### Removed
- `/audio-test` route and `AudioTestPage`
- External stardust texture dependency (all assets are now local)
- Duplicate Google Fonts import

### Fixed
- Lint blockers across battle screens, hooks, and utility files
- Random-choice purity issues in `gameLogic.ts`

### Setup Required
To enable analytics, add **Redis (Upstash)** to the Vercel project under Storage. Vercel auto-injects `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`.
