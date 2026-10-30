# Velora — Architecture Decision Records (ADR)

> These decisions were made during Phase 0 planning (29–30 October 2026).  
> Each decision records the choice made, the alternatives considered, and the reason.  
> Decisions are not silently changed — new decisions append a new entry.

---

## ADR-001 — Authentication Library

**Date:** 29 October 2026  
**Status:** Accepted

### Decision
Use **`better-auth`** with the Prisma adapter for MySQL.

### Requirements met
- GitHub OAuth login (primary)
- Email + password registration and login (secondary)
- Email verification and password reset
- Secure session management
- Prisma/MySQL compatibility

### Alternatives considered
| Option | Reason not chosen |
|---|---|
| `passport.js` + manual session | More boilerplate; requires wiring GitHub strategy, sessions, email verification, and password hashing separately |
| Custom JWT auth | Too much security-critical code to write from scratch; not appropriate for a learning project |
| NextAuth / Auth.js | Designed for Next.js; not a natural fit for Express |

### Constraints
- `better-auth` is relatively new (2024). If a breaking change or critical bug is discovered during implementation, `passport.js` is the fallback.
- The Prisma adapter must be verified to work with MySQL 8.0 before Phase 1 Task 4 begins.

---

## ADR-002 — Scan Job Queue

**Date:** 29 October 2026  
**Status:** Accepted

### Decision
Use a **MySQL-backed polling queue** — a `jobs` table polled by a worker every 2 seconds. No Redis. No BullMQ.

### Requirements met
- Zero extra infrastructure (no Redis service to run or host)
- Suitable for single-user local demo load
- Upgrade path: migrate to BullMQ + Redis if throughput demands it

### Alternatives considered
| Option | Reason not chosen |
|---|---|
| BullMQ + Redis | Requires a running Redis instance — additional infrastructure complexity and hosting cost |
| In-memory queue | Lost on server restart; no persistence |
| External queue (SQS etc.) | Paid service; not zero-budget |

### Constraints
- The worker runs in the **same process** as the API initially (Phase 1–2).
- When Playwright scanning is added (Phase 3), the worker is extracted to a **separate process** to prevent a browser crash from taking down the API.

---

## ADR-003 — AI Provider Strategy

**Date:** 29 October 2026  
**Status:** Accepted

### Decision
Build a **provider-agnostic AI service interface**. The concrete provider is selected via the `AI_PROVIDER` environment variable. Default is `none` (AI disabled — all other features work normally).

### Providers to evaluate before Phase 4
| Provider | Vision support | Cost | Hardware |
|---|---|---|---|
| Google Gemini (free tier) | Yes | Free within quota | None (hosted) |
| Groq (free tier) | No (text only) | Free within quota | None (hosted) |
| Ollama + LLava | Yes | Free (offline) | GPU recommended |

### Provider selection rule
- Do not hardcode a specific model name or quota assumption.
- Benchmark actual free-tier limits before Phase 4 implementation.
- If no suitable free vision model is available, fall back to text-only analysis with a clear user-facing label.
- Never pretend AI has analysed a screenshot it has not seen.

### Constraints
- All five AI features remain on the roadmap: visual explanation, CSS suggestions, prioritisation, report narrative, contextual Q&A.
- AI claims must link to screenshot/DOM/Git evidence. No unsupported assertions.
- AI code suggestions are never auto-applied. Proposals require developer review.

---

## ADR-004 — Email Provider

**Date:** 29 October 2026  
**Status:** Accepted

### Decision
Use **Resend** as the production email provider (free tier: 100 emails/day, 3,000/month).  
Use **console/preview mode** for local development — emails are logged to the terminal instead of sent. No domain purchase required during Phase 0 or Phase 1.

### Alternatives considered
| Option | Reason not chosen |
|---|---|
| Nodemailer + Gmail SMTP | Rate-limited; requires App Password setup; harder to debug |
| Brevo (Sendinblue) | Valid alternative; Resend has a better Node.js SDK |
| Mailhog (local SMTP server) | Requires Docker; adds infrastructure complexity |

### Constraints
- A verified sending domain is required for Resend in production. This is deferred until deployment planning.
- During development, `EMAIL_MODE=preview` in `.env` routes all emails to console output.

---

## ADR-005 — Deployment Model

**Date:** 29 October 2026  
**Status:** Accepted (Phase 0 scope)

### Decision
**Local-first for development and demo.** The architecture remains suitable for public deployment without changes.

### Local stack
- MySQL 8.0: running as Windows service on dev machine
- Express API: `localhost:3001`
- Vite frontend: `localhost:5173`
- Playwright worker: same machine as the API

### Public deployment plan (deferred to Phase 7)
| Layer | Option | Notes |
|---|---|---|
| Frontend | Vercel free tier | Static build; React Router requires SPA rewrite rule |
| Backend | Railway / Render free tier | Persistent Express process |
| Database | PlanetScale / Railway MySQL | Free tier to be evaluated |
| Playwright worker | Same server as API or separate | Resource requirements to be measured |

### Constraints
- Localhost scanning (scanning `localhost:PORT`) only works when the Playwright worker runs on the same machine as the target app.
- A cloud-hosted worker cannot reach a user's local development server.
- This is acknowledged and documented, not a bug to fix.
