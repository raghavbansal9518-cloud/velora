# Velora

> **AI-Powered Visual Regression & Source-Code Investigation Platform**

Velora is an open developer tool designed to detect visual regressions, identify responsive layout issues, and investigate the source-code changes most likely responsible for UI defects.

---

## Project Overview

Modern web applications frequently suffer from unintended visual regressions—broken alignments, unexpected CSS overflows, font shifts, or responsive layout failures—introduced during code changes. Pinpointing the root cause across nested components, stylesheets, and pull requests can be tedious and time-consuming.

Velora aims to streamline this process by connecting:
1. **Automated multi-viewport screenshot capture** across desktop, tablet, and mobile viewports.
2. **Pixel-level visual diffing** with side-by-side, slider, and difference overlay inspection.
3. **Automated DOM diagnostics**, including layout overflow detection and accessibility auditing.
4. **Git-aware source-code investigation**, correlating visual discrepancies with the specific commits, pull requests, and component files that caused them.
5. **AI-assisted diagnostic explanations**, helping developers quickly understand *what* shifted and *why*.

> **Current Project Status:** Velora is actively under development. **Phase 1 (Foundation & Architecture)** is fully implemented and independently verified. The core website scanning engine, visual diffing pipeline, and AI analysis modules are planned for subsequent phases as outlined in the [Roadmap](#roadmap).

---

## Phase 1 Development Status

Phase 1 established the monorepo architecture, design tokens, frontend layout, backend foundation, and database layer. All six Phase 1 tasks are implemented and verified:

| Task | Milestone | Description | Status |
| :--- | :--- | :--- | :--- |
| **Task 1** | Monorepo Scaffolding | npm workspaces setup (`apps/web`, `apps/api`, `packages/shared`), shared TypeScript base configuration, and root scripts. | ✅ Verified |
| **Task 2** | Frontend Foundation | React 19, TypeScript 5.9, and Vite 8 setup in `apps/web` with fast HMR and production bundling. | ✅ Verified |
| **Task 3** | Design Tokens & UI Primitives | Tailwind CSS v4 and shadcn/ui configured with Velora's custom electric-blue design tokens and accessible UI components. | ✅ Verified |
| **Task 4** | Application Routing & Layout | React Router v7 configured with `RootLayout`, header navigation, dynamic route parameters, and a custom 404 page. | ✅ Verified |
| **Task 5** | Backend API Foundation | Express 5 + TypeScript server with NodeNext ESM, strict 100 KB JSON request limit, sanitized error handling, and `/api/health` endpoint. | ✅ Verified |
| **Task 6** | MySQL + Prisma Database Foundation | Prisma ORM 6.4.1 configured for local MySQL 8.0, `Project` and `Scan` models with cascading relationships, and initial migration applied. | ✅ Verified |

---

## Technology Stack

### Implemented Stack (Phase 1)

#### Frontend (`apps/web`)
- **Framework:** [React 19](https://react.dev/) (`19.3.1`)
- **Build Tool:** [Vite 8](https://vite.dev/) (`8.3.5`) via `@vitejs/plugin-react` (`6.1.2`)
- **Language:** [TypeScript](https://www.typescriptlang.org/) (`~5.9.3`)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/) (`4.3.3`) via `@tailwindcss/vite`
- **UI Components:** [shadcn/ui](https://ui.shadcn.com/) primitives backed by Radix UI (`@radix-ui/react-slot`, `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react`)
- **Client Routing:** [React Router v7](https://reactrouter.com/) (`react-router-dom@7.18.5`)

#### Backend (`apps/api`)
- **Runtime:** [Node.js](https://nodejs.org/) (`>=18.0.0`, verified on Node.js 24)
- **Web Framework:** [Express 5](https://expressjs.com/) (`5.3.0`)
- **Language:** TypeScript (`~5.9.3`) executed via NodeNext ECMAScript Modules (ESM)
- **Development Server:** [tsx](https://github.com/privatenumber/tsx) (`4.23.15`) for TypeScript execution and watch mode
- **Configuration:** [dotenv](https://github.com/motdotla/dotenv) (`18.0.9`)

#### Database & ORM
- **Database Engine:** [MySQL 8.0](https://www.mysql.com/) (verified on MySQL 8.0.46) with `utf8mb4` character set and `utf8mb4_unicode_ci` collation
- **ORM:** [Prisma ORM](https://www.prisma.io/) (`6.4.1`) with `@prisma/client` and Prisma Migrate

#### Monorepo & Tooling
- **Package Manager:** npm Workspaces (`apps/*`, `packages/*`)
- **Linter:** [ESLint 10](https://eslint.org/) (`10.13.0`) with `typescript-eslint` (`8.72.0`)
- **Version Control:** Git & GitHub following Conventional Commits

### Planned Technologies (Future Phases)
- **Browser Automation:** [Playwright](https://playwright.dev/) for headless page capture across responsive viewports
- **Image Processing:** [sharp](https://sharp.pixelplumbing.com/) & [pixelmatch](https://github.com/mapbox/pixelmatch) for image resizing and pixel difference calculation
- **Accessibility:** [axe-core](https://github.com/dequelabs/axe-core) for WCAG automated compliance audits
- **AI Diagnostics:** [Google Gemini API](https://ai.google.dev/) with optional local [Ollama](https://ollama.com/) fallback
- **Authentication:** [better-auth](https://www.better-auth.com/) for secure local and OAuth session management

---

## Monorepo Architecture

The repository is structured as an npm workspaces monorepo:

```text
velora/
├── apps/
│   ├── api/                              # Backend Express application
│   │   ├── prisma/                       # Prisma database schema & migrations
│   │   │   ├── migrations/               # Applied migration history
│   │   │   │   ├── 20261031174528_init_projects_scans/
│   │   │   │   │   └── migration.sql     # Initial DDL SQL migration script
│   │   │   │   └── migration_lock.toml   # Provider lock file (mysql)
│   │   │   └── schema.prisma             # Application schema definition
│   │   ├── src/
│   │   │   ├── lib/
│   │   │   │   └── prisma.ts             # Reusable PrismaClient singleton
│   │   │   ├── routes/
│   │   │   │   └── health.routes.ts      # Health check endpoint (/api/health)
│   │   │   ├── app.ts                    # Express application configuration & middleware
│   │   │   └── server.ts                 # HTTP server entrypoint & graceful shutdown
│   │   ├── .env.example                  # Template for backend environment variables
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── web/                              # Frontend React application
│       ├── public/                       # Static public assets
│       ├── src/
│       │   ├── components/
│       │   │   └── ui/                   # Reusable UI components (shadcn/ui button)
│       │   ├── layouts/
│       │   │   └── RootLayout.tsx        # App layout (header navigation, theme wrapper, footer)
│       │   ├── pages/                    # React Router page views
│       │   │   ├── HomePage.tsx          # Landing page with interactive button demo
│       │   │   ├── ProjectsPage.tsx      # Projects listing view
│       │   │   ├── ProjectDetailPage.tsx # Dynamic project inspection view
│       │   │   ├── ScanDetailPage.tsx    # Dynamic scan report inspection view
│       │   │   └── NotFoundPage.tsx      # Custom 404 page
│       │   ├── lib/
│       │   │   └── utils.ts              # Class name merging utility (cn)
│       │   ├── App.tsx                   # Client route declarations
│       │   ├── index.css                 # Tailwind CSS v4 electric-blue theme tokens
│       │   └── main.tsx                  # Client DOM mounting entrypoint
│       ├── package.json
│       ├── tsconfig.json
│       └── vite.config.ts
│
├── packages/
│   └── shared/                           # Workspace reserved for cross-package types
│       ├── src/
│       │   └── index.ts
│       └── package.json
│
├── docs/                                 # Architectural blueprints, decisions, and milestones
├── .env.example                          # Root-level template for environment variables
├── .gitignore                            # Root Git ignore rules (protects .env, dist, node_modules)
├── package.json                          # Monorepo root package.json with workspaces definition
├── tsconfig.base.json                    # Shared base TypeScript compiler options
└── README.md
```

---

## Database Schema

Velora uses MySQL managed through Prisma ORM. The initial database migration (`init_projects_scans`) defines the foundational models for project configuration and scan management:

```
┌─────────────────────────────────┐          ┌─────────────────────────────────┐
│            Project              │          │              Scan               │
├─────────────────────────────────┤          ├─────────────────────────────────┤
│ id: String (UUID, PK)           │ 1      * │ id: String (UUID, PK)           │
│ name: String                    ├──────────┤ projectId: String (FK)          │
│ targetUrl: String               │          │ status: ScanStatus (ENUM)       │
│ settings: Json?                 │          │ errorMessage: String? (TEXT)    │
│ createdAt: DateTime             │          │ createdAt: DateTime             │
│ updatedAt: DateTime             │          │ updatedAt: DateTime             │
└─────────────────────────────────┘          └─────────────────────────────────┘
```

### Models

1. **`Project` (`projects` table)**
   - `id`: String (UUID primary key)
   - `name`: Human-readable name of the project
   - `target_url`: The baseline URL monitored for visual regressions
   - `settings`: Optional JSON column reserved for scan viewport settings and thresholds
   - `created_at` / `updated_at`: Microsecond-precision timestamps (`DATETIME(3)`)

2. **`Scan` (`scans` table)**
   - `id`: String (UUID primary key)
   - `project_id`: Foreign key referencing `projects.id` with `ON DELETE CASCADE ON UPDATE CASCADE`
   - `status`: Enum with states `PENDING`, `RUNNING`, `COMPLETED`, `FAILED` (default `PENDING`)
   - `error_message`: Optional text field storing diagnostic information if a scan fails
   - `created_at` / `updated_at`: Microsecond-precision timestamps (`DATETIME(3)`)
   - **Index:** `scans_project_id_idx` on `project_id` for optimized foreign key lookups

3. **`_prisma_migrations` (internal table)**
   - Managed automatically by Prisma Migrate to record migration history, checksums, and execution timestamps.

---

## Current Available Functionality

The following components are working and verified in the repository today:

- **Frontend Application Layout:** Accessible at `http://localhost:5173`, featuring the Velora electric-blue design system, navigation bar, responsive footer, and route switching.
- **Client Routing:** Declarative routes for `/` (Home), `/projects` (Projects listing), `/projects/:projectId` (Project detail view), `/projects/:projectId/scans/:scanId` (Scan detail view), and `*` (custom 404 page).
- **Interactive UI Primitives:** Accessible shadcn/ui Button component styled with Velora's design tokens and interactive state.
- **Backend Express Server:** Running on `http://localhost:3001` with request body protection (100 KB limit), query-sanitized 404 handler, safe 500 error handler, and graceful shutdown on `SIGINT`/`SIGTERM`.
- **Health Check Endpoint:** `GET /api/health` returns `{"status":"ok","service":"velora-api"}` with HTTP 200.
- **Database Connection & Migration:** Verified connection to local MySQL `velora_dev` database through a reusable `PrismaClient` singleton with applied schema tables and index constraints.

> ℹ️ **Note:** The automated visual regression engine (Playwright capture, pixel-diff comparisons, DOM tree inspection, and AI analysis) has not yet been implemented. These workflows are scheduled for Phase 2 through Phase 5.

---

## Getting Started

Follow these steps to set up and run the Velora monorepo locally.

### Prerequisites

Ensure you have the following installed on your machine:
- **Node.js:** `>= 18.0.0` (developed and tested on Node.js `v24.14.1`)
- **npm:** `>= 8.0.0` (tested on npm `v11.11.0`)
- **Git:** `>= 2.x`
- **MySQL Server:** Local MySQL 8.0 instance running on port 3306

### 1. Clone the Repository

```bash
git clone https://github.com/raghavbansal9518-cloud/Velora.git
cd Velora
```

### 2. Install Dependencies

Install all root and workspace dependencies using npm:

```bash
npm install
```

### 3. Configure Local MySQL Database

Open MySQL command-line client or MySQL Workbench and create a dedicated database for Velora development:

```sql
CREATE DATABASE velora_dev CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 4. Configure Backend Environment Variables

Copy the backend environment template to create a local `.env` file:

```bash
# On Windows PowerShell
Copy-Item apps/api/.env.example apps/api/.env

# On Linux / macOS / Bash
cp apps/api/.env.example apps/api/.env
```

Open `apps/api/.env` in your editor and replace `REPLACE_WITH_YOUR_LOCAL_MYSQL_PASSWORD` with your actual local MySQL password:

```env
PORT=3001
NODE_ENV=development
DATABASE_URL="mysql://root:YOUR_PASSWORD@127.0.0.1:3306/velora_dev"
```

> 🔒 **Security Notice:** `apps/api/.env` is strictly Git-ignored via `.gitignore`. Never commit or share your database password or secret keys.

### 5. Generate Prisma Client & Apply Database Migrations

Generate the TypeScript Prisma Client and apply the existing database migration:

```bash
# Generate Prisma Client
npm --workspace=@velora/api run prisma:generate

# Apply pending migrations to your local velora_dev database
npm --workspace=@velora/api run prisma:migrate
```

Verify that Prisma reports your database is up to date:

```bash
npm --workspace=@velora/api exec prisma migrate status
```

### 6. Run the Development Servers

Start the backend and frontend in separate terminal windows:

**Terminal 1 — Backend API:**
```bash
npm --workspace=@velora/api run dev
```
*The server starts at `http://localhost:3001`.*

**Terminal 2 — Frontend Application:**
```bash
npm --workspace=@velora/web run dev
```
*The Vite development server starts at `http://localhost:5173`.*

### 7. Verify the Setup

1. Open `http://localhost:5173` in your browser. You should see the Velora homepage with the navigation bar, description, and interactive button demo.
2. In a separate terminal or browser tab, test the backend health endpoint:
   ```bash
   curl http://localhost:3001/api/health
   ```
   Expected response:
   ```json
   {"status":"ok","service":"velora-api"}
   ```

---

## Development Commands

All development tasks can be run from the root directory using npm workspace commands:

### Workspace-Wide Commands
```bash
# Run TypeScript compilation check across all workspaces
npm run typecheck

# Run ESLint across all workspaces
npm run lint

# Build all workspaces for production
npm run build
```

### Frontend (`apps/web`) Commands
```bash
# Start Vite development server with HMR
npm --workspace=@velora/web run dev

# Run ESLint checks
npm --workspace=@velora/web run lint

# Build frontend production bundle (tsc -b && vite build)
npm --workspace=@velora/web run build

# Preview production build locally
npm --workspace=@velora/web run preview
```

### Backend (`apps/api`) Commands
```bash
# Start backend in watch mode with tsx
npm --workspace=@velora/api run dev

# Run TypeScript typecheck without emitting output
npm --workspace=@velora/api run typecheck

# Build backend for production (tsc)
npm --workspace=@velora/api run build

# Start compiled backend production server
npm --workspace=@velora/api start

# Generate Prisma Client
npm --workspace=@velora/api run prisma:generate

# Apply database migrations in development
npm --workspace=@velora/api run prisma:migrate

# Inspect Prisma migration status
npm --workspace=@velora/api exec prisma migrate status
```

---

## Roadmap

| Phase | Milestone | Focus Areas | Status |
| :--- | :--- | :--- | :--- |
| **Phase 1** | **Foundation & Architecture** | Monorepo scaffolding, React 19 + Vite 8 frontend, Tailwind CSS v4 design tokens, React Router v7 layout, Express 5 backend, MySQL 8.0 + Prisma ORM database foundation. | ✅ **Completed** |
| **Phase 2** | **Screenshot Comparison MVP** | Screenshot image upload, pixel difference engine (`sharp` & `pixelmatch`), side-by-side / overlay / slider comparison views, difference percentage metrics. | 📋 Planned |
| **Phase 3** | **Automated Capture & Diagnostics** | Headless browser capture via Playwright, responsive multi-viewport testing (mobile, tablet, desktop), DOM layout overflow detection, automated accessibility checks (`axe-core`). | 📋 Planned |
| **Phase 4** | **AI Root-Cause Investigator** | AI-driven visual regression analysis using Google Gemini API (with optional local Ollama fallback), defect categorization, plain-English change summaries. | 📋 Planned |
| **Phase 5** | **Source Code & GitHub Intelligence** | GitHub OAuth, repository file linking, commit and pull request diff correlation, identifying probable CSS/component sources of visual defects. | 📋 Planned |
| **Phase 6** | **Reporting & Export** | Visual regression summary reports, PDF and JSON export, scan sharing and persistent project history. | 📋 Planned |
| **Phase 7** | **Hardening & Deployment** | User authentication (`better-auth`), rate limiting, production Docker containers, CI/CD pipeline, production deployment. | 📋 Planned |

---

## Commit Convention

This repository follows the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) specification:

```text
feat:     New user-facing or technical feature
fix:      Bug fix
chore:    Tooling, dependency updates, and maintenance
docs:     Documentation additions or updates
style:    Formatting and whitespace changes (no code logic change)
refactor: Code restructuring without functional alterations
test:     Adding or modifying automated tests
perf:     Code performance optimizations
ci:       CI/CD configuration and workflow adjustments
```

---

## Project Owner

**Raghav Bansal** — Computer Science & Engineering Student<br />
GitHub: [@raghavbansal9518-cloud](https://github.com/raghavbansal9518-cloud)

---

*Velora is developed as an educational and portfolio project. Architecture decisions, features, and roadmaps are tracked and documented in the `docs/` directory.*
