# Velora — Architecture Overview

> **Status:** Phase 1 scaffolding — structure defined, implementation pending  
> **Last updated:** 30 October 2026

---

## System Overview

Velora is a four-layer application. Data flows in one direction through these layers:

```
React UI  →  Express API  →  MySQL (via Prisma)
                         →  Scan Worker  →  Playwright / sharp / axe-core
                         →  AI Provider  (on request, not automatically)
                         →  GitHub API   (on request, with user permission)
```

---

## Layer 1 — Frontend (`apps/web`)

| Concern | Technology |
|---|---|
| Framework | React 19 + TypeScript |
| Build tool | Vite |
| Styling | Tailwind CSS + shadcn/ui |
| Routing | React Router v7 |
| State | Zustand (global: auth session, theme) |
| API calls | Typed `fetch` wrappers in `src/services/` |
| Animation | Motion for React (UI); CSS transitions (simple effects) |
| Charts | Recharts (real data only — no placeholder values) |
| Code display | Monaco Editor |

**Design system:** Electric blue (#168BFF dark / #0866D8 light) on near-black (#080B12) dark theme and white (#FFFFFF) light theme. Purple is explicitly excluded. See `docs/design-reference.png` for the visual reference.

---

## Layer 2 — Backend API (`apps/api`)

| Concern | Technology |
|---|---|
| Runtime | Node.js 24 |
| Framework | Express + TypeScript |
| Validation | Zod (request bodies and env variables) |
| Authentication | better-auth (GitHub OAuth + email/password) |
| ORM | Prisma |
| Email | Resend (production) / console preview (development) |
| Rate limiting | express-rate-limit |
| Security | helmet, CORS, SSRF protection on URL inputs |

The API is a thin routing + validation + orchestration layer. Business logic lives in `src/services/`.

---

## Layer 3 — Scan Worker (`apps/api/src/workers/`)

The worker runs in the **same Node.js process** as the API during Phase 1–3. It is a separate module, not a separate process, to avoid Redis/queue infrastructure overhead at this stage.

| Concern | Technology |
|---|---|
| Job queue | MySQL-backed polling (a `jobs` table, polled every 2 seconds) |
| Browser automation | Playwright (Chromium) |
| Image processing | sharp (normalisation, resize) + pixelmatch (pixel diff) |
| Accessibility | axe-core |
| DOM measurements | Playwright evaluate() — element geometry, overflow |

**Worker isolation plan:** When browser scanning is implemented (Phase 3), the worker will be extracted into a separate process (`scan-worker.ts`) that communicates via the jobs table. This avoids a crashed Playwright instance taking down the API.

---

## Layer 4 — Data & Storage

| Concern | Technology / Decision |
|---|---|
| Primary database | MySQL 8.0 (`velora_dev` locally) |
| ORM + migrations | Prisma |
| Screenshot storage | Local disk (`apps/api/uploads/`) via a `StorageService` interface |
| Storage interface | Replaceable: local disk now, Cloudinary/S3 later without rewriting callers |
| Scan artifacts | Stored on disk; metadata (path, kind, viewport) stored in MySQL |

**Rule:** Screenshots and diffs are never stored as MySQL blobs. The database stores file paths and metadata only.

---

## Monorepo Structure

```
velora/                         ← npm workspaces root
├── apps/
│   ├── web/                    ← @velora/web  (React + Vite)
│   └── api/                    ← @velora/api  (Express + TypeScript)
├── packages/
│   └── shared/                 ← @velora/shared (TypeScript types)
├── tests/
│   ├── fixtures/               ← controlled HTML pages with known regressions
│   ├── integration/            ← API + DB tests (Vitest)
│   └── e2e/                    ← Playwright E2E tests of the UI
├── docs/
│   ├── architecture.md         ← this file
│   ├── decisions.md            ← Architecture Decision Records
│   └── milestones.md           ← phase plan with acceptance criteria
├── package.json                ← workspace root (private: true)
├── tsconfig.base.json          ← shared TypeScript base config
└── .env.example                ← environment variable template
```

---

## Security Boundaries

| Risk | Mitigation |
|---|---|
| SSRF via URL scan input | Allowlist protocols (https only), block private IP ranges, no redirects to internal addresses |
| Secrets in code | `.env` excluded by `.gitignore`; `.env.example` has placeholders only |
| GitHub token scope | Request minimum scopes; store encrypted; never log tokens |
| Local file access | Only permitted paths under `UPLOAD_DIR`; no path traversal |
| AI prompt injection | Sanitise all user-supplied content before including in prompts |
| Arbitrary code execution | Never clone or run untrusted repository code on the server |

---

## Key Constraints

- **Zero budget:** No paid APIs, no paid hosting during development. All third-party services use verified free tiers.
- **Local-first:** MySQL, backend, and Playwright worker run locally. Public deployment is a later decision.
- **No fabricated data:** Every metric, chart, and AI output must come from real scan results. No placeholder numbers.
- **AI is optional:** All features except AI explanation work without an AI provider configured.
