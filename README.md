# CatchUp
CatchUp with your friends through BeReal like posts, videos, and messages in real time. Forgot to view them? Checkout the collections made from your friends content to get the full story

## Local development

Requirements: Node 26 (`nvm use`), pnpm 8+, Docker (Docker Desktop or Colima).

```sh
docker compose up -d                 # postgres :5432, redis :6379
cp packages/api/.env.example packages/api/.env
pnpm i
pnpm dev                             # api :3001, web :5173 (proxies /api to the api)
```

Check: open http://localhost:5173 (shows "API: ok") or `curl localhost:5173/api/v1/health`.

| Command | What it does |
|---|---|
| `pnpm dev` | Runs api (watch mode) and web together |
| `pnpm build` | Builds shared, api, web |
| `pnpm typecheck` | Type-checks every package |
| `pnpm seed:dev` | Runs migrations, then seeds dev data |

## Layout

- `packages/shared`: contract types and logic shared by api and web (`@catchup/shared`).
- `packages/api`: Express API at `/api/v1`, organized by feature. Migrations live in `src/db/migrations/` as `<timestamp>-<name>.ts` exporting `async up()` / `async down()`, and run automatically on startup.
- `packages/web`: React + Vite PWA, organized by feature under `src/features/`.

Project docs: `claude/CLAUDE.md` (agreements, multi-agent plan) and `claude/DESIGN.md` (product spec). Work map: issue #1.
