# Velora — Milestones and Acceptance Criteria

> **Scheduling rule:** No fixed deadline. Build, test, and verify each milestone before starting the next.  
> A milestone is **done** only when its real user journey works end-to-end, failure states are handled, and code is committed.  
> Never replace unfinished features with misleading demo data.

---

## Phase 0 — Environment & Planning ✅ COMPLETE

**Goal:** Verified local environment, private GitHub repository, architecture decisions documented.

| Task | Acceptance Criteria | Status |
|---|---|---|
| Node.js ≥ 18, npm ≥ 8 | `node --version` and `npm --version` pass | ✅ v24.14.1 / v11.11.0 |
| Git configured | `user.name = Raghav Bansal`, `user.email` set, `autocrlf = true`, `init.defaultBranch = main` | ✅ |
| MySQL 8.0 CLI accessible | `mysql --version` works in a new terminal | ✅ v8.0.46 |
| `velora_dev` database | Exists with `utf8mb4` charset | ⬜ Confirm with root password |
| Architecture decisions | ADR-001 through ADR-005 documented in `docs/decisions.md` | ✅ |
| Private GitHub repo | `github.com/raghavbansal9518-cloud/velora` — private, empty before push | ✅ |
| First commit | `chore: initialise Velora repository` on `main` (hash: 7bbb454) | ✅ |
| Git workflow rule | Raghav runs all Git commands himself after review | ✅ |

---

## Phase 1 — Workspace, Design System & Authentication

**Goal:** A running, authenticated application shell. No scan features yet — but a real user can register, log in with GitHub or email, see the dashboard skeleton, and toggle between dark and light themes.

**Estimated effort:** 10–18 hours at learning pace.

### Phase 1, Task 1 — Monorepo Scaffold 🔄 IN PROGRESS

| Task | Acceptance Criteria | Status |
|---|---|---|
| npm workspaces root | `package.json` with `"workspaces": ["apps/*", "packages/*"]` | ✅ Created |
| `apps/web` workspace | `package.json` with `name: @velora/web`, `private: true` | ✅ Created |
| `apps/api` workspace | `package.json` with `name: @velora/api`, `private: true` | ✅ Created |
| `packages/shared` workspace | `package.json` with `name: @velora/shared`, `private: true` | ✅ Created |
| `packages/shared/src/index.ts` | Placeholder export with cross-import disclaimer | ✅ Created |
| `tsconfig.base.json` | Shared strict TypeScript config at repo root | ✅ Created |
| `.env.example` | All 5 sections with placeholder values only, no secrets | ✅ Created |
| Documentation | `architecture.md`, `decisions.md`, `milestones.md` in `docs/` | ✅ Created |
| Committed | `chore: add monorepo scaffold and workspace structure` on `chore/monorepo-scaffold` | ⬜ Pending your review |

### Phase 1, Task 2 — Vite + React Frontend Scaffold

| Task | Acceptance Criteria |
|---|---|
| `npm create vite` in `apps/web` | TypeScript + React template initialised |
| Tailwind CSS installed and configured | `tailwind.config.ts` with Velora design tokens |
| shadcn/ui initialised | `components.json` configured; electric blue as primary |
| React Router installed | `App.tsx` with route placeholders for all 7 pages |
| Theme toggle | Dark/light mode works, preference persisted in `localStorage` |
| Responsive sidebar shell | Collapsible sidebar renders; navigation links are present but routes are empty |
| `npm run dev` works | Vite dev server starts; browser shows the shell |

### Phase 1, Task 3 — Express Backend Scaffold

| Task | Acceptance Criteria |
|---|---|
| Express + TypeScript setup | `apps/api/src/server.ts` starts without errors |
| Zod env validation | Server refuses to start if required env vars are missing |
| Health check endpoint | `GET /api/health` returns `{ status: "ok", timestamp }` |
| Prisma initialised | `schema.prisma` with MySQL connection; `prisma migrate dev` runs |
| CORS configured | Frontend origin allowed; other origins blocked |
| `npm run dev` works | `ts-node` or `tsx` watch mode starts API on port 3001 |

### Phase 1, Task 4 — Authentication

| Task | Acceptance Criteria |
|---|---|
| better-auth installed + configured | `auth.ts` with GitHub OAuth and email/password providers |
| Prisma schema for auth | `User`, `Session`, `Account`, `Verification` tables migrated |
| GitHub OAuth works | Login with GitHub redirects correctly and creates a session |
| Email/password registration | User can register with email; receives verification email (logged in dev mode) |
| Email/password login | Registered user can log in; session cookie set |
| Password reset flow | Reset email sent (logged in dev); new password accepted |
| Protected routes | Unauthenticated API requests return 401; frontend redirects to login |
| Logout | Session destroyed; user redirected to login |

---

## Phase 2 — Screenshot Comparison MVP

**Goal:** A user can upload two screenshots, see a pixel diff, use the before/after slider, and download a basic report. No Playwright, no live URL scanning yet.

**Estimated effort:** 8–12 hours.

| Task | Acceptance Criteria |
|---|---|
| File upload UI | Accepts PNG/JPEG; validates type, size (≤ 10MB); shows clear errors |
| Secure storage | Files saved to `UPLOAD_DIR`; no path traversal possible |
| sharp normalisation | Images resized to same dimensions before comparison |
| pixelmatch diff | Changed pixel count, percentage, and diff image generated |
| Before/after slider | Drag to reveal; works with touch; both images visible |
| Diff overlay + heatmap | Toggle between overlay and heatmap views |
| Finding list | Changed regions listed with bounding boxes |
| Basic report | JSON export of scan metadata and findings |
| Error states | Mismatched dimensions, corrupt file, oversized file — all handled with user-facing messages |

---

## Phase 3 — Browser Automation & Responsive Diagnostics

**Goal:** A user can enter a URL (or two URLs), Playwright captures screenshots at desktop/tablet/mobile viewports, and the comparison runs automatically with DOM overflow and accessibility findings.

**Estimated effort:** 6–10 hours.

| Task | Acceptance Criteria |
|---|---|
| URL input validation | Blocks `localhost` when in cloud mode; blocks private IP ranges (SSRF) |
| Playwright capture | Consistent screenshots at 1280px, 768px, 375px viewport widths |
| Stable capture strategy | Font load wait, animation disable, dynamic content masks configurable |
| DOM overflow check | Elements overflowing viewport detected and recorded |
| axe-core integration | Accessibility violations attached to scan findings |
| Scan job model | Job created in DB; worker picks it up; status polled by frontend |
| Scan history | Previous scans listed per project; rerun available |
| Baseline approval | User can mark a scan as the approved baseline |

---

## Phase 4 — AI Investigator

**Goal:** At least one real, evidence-grounded AI explanation. Provider abstraction working. No-AI fallback confirmed.

**Estimated effort:** 6–10 hours (plus provider evaluation time).

| Task | Acceptance Criteria |
|---|---|
| Provider interface | `AIProvider` interface implemented; `none`, and at least one real provider |
| Evidence bundle | Screenshots (if vision supported), diff regions, DOM findings sent to model |
| Structured output | JSON schema validated; uncertainty markers present |
| Visual explanation | Finding has an AI-generated hypothesis linked to evidence |
| No-AI fallback | All features work and are clearly labelled when `AI_PROVIDER=none` |
| Rate limit handling | API quota errors caught; user sees a clear message, not a crash |

---

## Phase 5 — Source Intelligence

**Goal:** A GitHub repository can be connected. Changed files and lines from a commit pair are shown alongside scan findings.

**Estimated effort:** 8–12 hours.

| Task | Acceptance Criteria |
|---|---|
| GitHub repo connection | User authorises with least-privilege scopes; token stored encrypted |
| Commit pair selection | User picks two commits; changed files and line ranges fetched |
| Git diff display | Monaco editor shows actual changed lines |
| Candidate attribution | Files and lines linked to findings with confidence labels |
| "Unknown" state | Displayed honestly when attribution cannot be determined |
| Confirmed vs suspected | Git diff facts shown separately from AI hypotheses |

---

## Phase 6 — Reports, Polish & Export

**Goal:** All seven pages are complete, charts show real data, PDF export works, both themes are polished.

| Task | Acceptance Criteria |
|---|---|
| All 7 pages complete | Every route renders with real data or a correct empty state |
| Recharts charts | Scan trend, issue category donut, severity bars — all from DB |
| PDF export | Playwright `page.pdf()` generates a correct, readable report |
| JSON export | Machine-readable scan report with all findings and metadata |
| Animations | Motion for React transitions at 150–250ms; reduced-motion respected |
| Both themes | Dark and light themes complete; no purple anywhere |

---

## Phase 7 — Quality, Security & Deployment

**Goal:** Tests pass, security reviewed, README complete, demo recorded.

| Task | Acceptance Criteria |
|---|---|
| Unit tests | Core services covered by Vitest tests |
| E2E tests | Playwright tests for login, scan creation, comparison, report |
| Security review | Auth, upload validation, SSRF, secret handling audited |
| Accessibility | Keyboard navigation, contrast, focus rings, screen-reader labels |
| README | Setup instructions, architecture diagram, limitations, demo guide |
| Demo recording | Baseline → deliberate regression → detection → fix → rescan → report |
| GitHub hygiene | No secrets, no generated artifacts, no `node_modules` in history |

---

## Timeline Estimate

| Phase | Estimated Hours | Cumulative |
|---|---|---|
| Phase 0 | Complete | — |
| Phase 1 | 10–18 hrs | 10–18 hrs |
| Phase 2 | 8–12 hrs | 18–30 hrs |
| Phase 3 | 6–10 hrs | 24–40 hrs |
| Phase 4 | 6–10 hrs | 30–50 hrs |
| Phase 5 | 8–12 hrs | 38–62 hrs |
| Phase 6 | 6–10 hrs | 44–72 hrs |
| Phase 7 | 6–10 hrs | 50–82 hrs |

> At 2–3 focused hours per day, Phases 1–3 (the real MVP) are achievable in 2–3 weeks.  
> Phases 4–6 are a further 2–4 weeks depending on AI provider evaluation time.  
> Phase 7 is ongoing throughout but the formal review takes 1–2 days.
