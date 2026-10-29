# About me
- Individual developer learning Claude Code and harnesses in general; catching up to the new industry standard.

# How I want you to communicate
- Tone: direct and concise. No preamble, no closing summaries.
- Length: short by default. Ask before writing anything over ~500 words.
- Format: prose for explanations, bullets only for steps or comparisons.
- Disagreement: push back when you think I'm wrong on idea design, architecture, or direction, and say why.
- Uncertainty: flag guesses explicitly. Don't present recall as verified fact. Ask questions and keep me in the loop.
- Avoid: hedging filler, "Great question", restating my question back to me.

# Project: CatchUp
BeReal-style social app for small family groups (5-20). Members post during 3 daily windows; missed posts land in a catch-up queue; each friend has a 30-day timeline. Goal: stop family updates getting lost in WhatsApp/camera roll. Greenfield: no application code exists yet, only docs.

Source of truth: `claude/DESIGN.md` (product spec). Execution map: GitHub issue #1 "Wayfinder: CatchUp MVP Launch Map" (srojastunjano/CatchUp), child tickets #2-#30 (see "Multi-agent plan"). Check the map before planning new work.

# Product rules (settled, don't re-litigate)
- Group-centric: all members of a group are automatically friends. Users can be in many groups. Invite codes are reusable. Admin can remove members and adjust window times; timezone is always per-user (device timezone).
- 3 windows/day (default 8-9, 1-2, 7-8 local time). 1 post per user per window, strict cutoff, no late posts.
- A post has 1-5 items, freely mixed and ordered: photo (5MB max), video (30s, 20MB max), caption. 10-minute edit window with full carousel preview; after that the post is locked forever (no edit/delete). Upload failure shows an error with manual retry.
- Display: carousel with swipe, videos autoplay muted with unmute button, exact timestamps, view-count badge only (no per-viewer list). Users don't see their own posts in friend timelines.
- Queue: posts you missed are added at midnight (user local), grouped by friend, all groups mixed, auto-cleared when viewed. Notification the next morning (push, SMS fallback), badge count, simple on/off toggle.
- Friend timeline: that friend's posts across all groups you share, newest first, 30 days.
- Retention: hard delete after 30 days. Leaving a group archives the member (posts stay visible, can rejoin). Deleted accounts become "Archived User".
- View-only in MVP: no comments, reactions, search, group timelines, DMs, or analytics.

# Technical decisions (settled)
- Platform: mobile-first PWA, falls back to plain responsive web app if iOS blocks something. Modern browsers only. WCAG 2.1 Level A. Basic first-use tooltips. Offline: cache recent posts, sync queue on reconnect.
- Monorepo with pnpm workspaces: `packages/api`, `packages/web`, `packages/shared`. Node 26 (`.nvmrc` + `engines`; chosen over Node 20, which reached EOL in April 2026), pnpm 8+ (12 installed locally). TypeScript strict everywhere (TypeScript 7).
- Backend: Express, PostgreSQL, JWT in Authorization header, pino structured logging, `ApiError` class plus error-handling middleware. Code organized by feature (`auth/`, `groups/`, `posts/` ...) with shared `middleware/` and `utils/`. Middleware order: JSON parser, CORS, logging, helmet, rate limiting, routes, 404, error handler.
- Auth (simplified vs DESIGN.md): phone OR email, 6-digit code, 5-minute expiry, stored in DB. Codes are logged to the console for now; Twilio SMS is deferred. User row is created on successful verification. No bcrypt. No rate limiting yet.
- Database: database-first, SQL migrations via node-migrate written in TypeScript, auto-run on startup. Schema order: users/auth, then groups/members, then posts/items. Seed script `packages/api/src/db/seed.ts` (`pnpm seed:dev`): 5 users (+1555000001...), 1 group, sample posts.
- Local dev: postgres/redis in docker-compose (Docker via Colima on this Mac), Node runs locally. Root `pnpm dev` runs both apps. API at `/api/v1` on port 3001, web on 5173 with proxy. Config via local `.env` only (`.env.example` committed).
- Frontend: React + Vite + vite-plugin-pwa, React Router v7, Zustand, Axios instance in `src/lib/api.ts` (JWT interceptor), TailwindCSS + HeadlessUI, plain `useState` forms, folders by feature plus shared `components/ hooks/ store/`. JWT persisted in localStorage plus Zustand. Real-time = polling every 5-10s (React Query), no websockets.
- Build order: contract first (M0 skeleton + M1 shared contracts), then backend and frontend in parallel. Frontend builds against **MSW** mocks (typed handlers per feature in `packages/web/src/mocks/handlers/<feature>.ts`, data from `packages/shared` fixtures, toggled by `VITE_USE_MOCKS`), not Zustand mocks. Integrate per feature as endpoints merge. First milestone = signup works end to end (request code, read it in the console, verify, get JWT).
- Media: compression happens client-side (photos compressed, videos limited to 30s/20MB, no transcoding). The server only validates type and size, so no sharp/ffmpeg. Storage goes through a `StorageDriver` interface (local disk in dev, OCI Object Storage in prod).
- Process: feature branches with PRs. No formal tests and no request-validation library (Zod) for the MVP. Document API as you build, no upfront OpenAPI.

# Deployment and operations (settled)
- Host: Oracle Cloud Infrastructure always-free tier (not AWS; the earlier AWS plan is superseded). I'm new to OCI, so budget time to learn it.
- CI/CD: GitHub Actions, auto-deploy to staging, manual promotion to prod. Daily automated DB backups, 7-day retention.
- Monitoring: minimal. Sentry deferred to the final phase.
- Launch target: closed beta, 5-10 families from my personal network. Feedback via weekly Google Form plus email and a weekly sync. Success = no crashes, daily use, actionable feedback. Post-beta roadmap intentionally open.

# Multi-agent plan (settled 2026-10-29)
Work is split into modules (GitHub issues #9-#30, all sub-issues of map #1, with native "blocked by" links). Harness: Claude Code only. Models: Opus 5.5, Sonnet 5.5, Haiku 4.5. Each issue carries `lane:*` and `model:*` labels; one Claude Code session per lane pulls the next unblocked issue in its lane.

| Lane | Model | Modules (in order) |
|---|---|---|
| 1 Core backend | Opus 5.5 | #9 M0 skeleton, #10 M1 contracts, #11 B1 auth, #12 B2 groups, #14 B4 posts, #16 B6 queue, #30 X1 integration+launch |
| 2 Backend services | Sonnet 5.5 (B8 Haiku) | #13 B3 media, #17 B7 push, #19 B9 profile, #15 B5 feeds, #18 B8 retention |
| 3 Frontend screens | Sonnet 5.5 (F6 Haiku) | #20 F0 shell+MSW, #21 F1 onboarding, #23 F2 groups, #25 F5 queue/timeline, #26 F6 settings |
| 4 Frontend media/PWA | Sonnet 5.5 | #22 F4 carousel, #24 F3 composer, #27 F7 PWA/offline/push |
| 5 Infra | Haiku research, Sonnet build | #2, #4, #3, #28 I5 Docker, #5 CI/CD, #29 I6 backups |
| Human | me | #6 (must close before B2/F1), #7, #8, review M1 and every contract PR |

Dependencies (A -> B means B waits for A):
- M0 -> M1 -> {B1, B3, B7 service, F0}. M1 is the only gate for parallel work.
- B1 + #6 -> B2; B2 + B3 -> B4; B4 -> {B5, B6, B8}; B6 -> B7 morning trigger; B1 + B3 -> B9.
- F0 -> {F1 (+#6), F4, F6, F7}; F4 -> {F2, F3, F5}.
- #2 -> #3 -> {#5, I6}; #4 -> #5; M0 + #2 -> I5 -> #5.
- Everything -> X1 -> beta (#6/#7/#8 run live).
- Critical path: M0 -> M1 -> B1 -> B2 -> B4 -> B6 -> B7 -> X1.

Agent rules:
- Read this file, `claude/DESIGN.md`, the issue, and map #1 before starting. Only work on issues whose blockers are closed. Stay inside your issue's scope.
- `packages/shared` is the contract. After M1 merges, change it only in a small dedicated PR (`contract:` prefix) that I review, merged before code that depends on it. Never work around contract drift locally.
- Migrations: timestamped filenames. Lane 1 owns core tables (users, auth_codes, groups, memberships, invite_codes, posts, post_items, post_views, queue_entries). Lane 2 owns media and push_subscriptions. All tables follow `packages/shared/SCHEMA.md`.
- Frontend: each feature adds its own MSW handler file and feature folder. Don't edit another feature's folder; shared components change via the owning issue (F0 primitives, F4 post display).
- Branch `lane<N>/<issue#>-<slug>`, one PR per issue into `main`, PR body `Closes #<n>`. Merging to `main` auto-deploys staging; prod is a manual promotion.
- When an issue closes with a decision, append it to "Decisions so far" in #1, and update this file and DESIGN.md if a settled decision changed.
- Blocked or unsure: comment on the issue and stop rather than guess.

# Working rules
- Don't add dependencies without asking.
- Before large changes, state the plan briefly and confirm.
- Where DESIGN.md and this file disagree, this file wins (it records later decisions). Update both when a decision changes.

# Foundation conventions (from M0 #9, done 2026-10-29)
- API runs TypeScript natively on Node 26 (type stripping, no tsx/ts-node). So: import relative files with `.ts` extensions, and no enums, namespaces or constructor parameter properties (`erasableSyntaxOnly`). `tsc` builds to `dist/` and rewrites `.ts` imports to `.js`.
- `@catchup/shared` exports `src/` under the `development` condition (Vite dev, and api via `node --conditions=development`) and `dist/` otherwise. `pnpm build` builds shared first. Web imports with the bundler resolver; api uses `nodenext`.
- Express 5 (async errors reach the error handler without wrappers). Middleware order lives in `packages/api/src/app.ts`; the rate limiter is a no-op placeholder in its slot. Errors: throw `new ApiError(status, code, message, details?)` and the response is `{ error: { code, message, details } }`. Unknown routes return 404 `NOT_FOUND`.
- Migrations: `packages/api/src/db/migrations/<timestamp>-<name>.ts` exporting `async up()` / `async down()` that use `pool` from `db/pool.ts`. They run on API startup and from `pnpm seed:dev`. node-migrate state is stored in Postgres table `migrations_state`, not a file.
- Env: `packages/api/.env` (copy from `.env.example`), loaded with Node's `--env-file-if-exists`. `DATABASE_URL` is required.
- Web: Vite 8, React 19, React Router **pinned to v7** (v8 exists; upgrading is a separate decision), Tailwind v4 via `@tailwindcss/vite` (no config file; `@import 'tailwindcss'` in `src/index.css`), vite-plugin-pwa with a placeholder manifest (icons come in F7). Feature folders live under `packages/web/src/features/`.
- Dependencies approved and installed in M0: api: express, cors, helmet, pino, pino-http, pg, migrate (dev: pino-pretty, typescript, @types/*). web: react, react-dom, react-router, vite, @vitejs/plugin-react, vite-plugin-pwa, tailwindcss, @tailwindcss/vite. Anything else needs approval.

# Current focus
M0 #9 is done (branch `lane1/9-monorepo-skeleton`): skeleton runs, `GET /api/v1/health` returns 200 through the web proxy. Next frontier: #10 M1 contracts (lane 1, needs my review), #28 I5 Docker once #2 is done, #2 and #4 research (lane 5), #6 grilling (human, needed before B2).
