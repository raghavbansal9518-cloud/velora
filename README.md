# Velora

> **AI-Powered Visual Regression & Source-Code Investigation Platform**

[![Phase](https://img.shields.io/badge/phase-0%20%E2%80%94%20environment%20setup-blue)](#)
[![Status](https://img.shields.io/badge/status-in%20development-yellow)](#)
[![Repo](https://img.shields.io/badge/repository-private-lightgrey)](#)

---

## What is Velora?

Velora helps developers detect visual regressions, analyse responsive layout issues, and investigate the source-code changes most likely responsible — all in one workflow.

It connects **before/after screenshots**, **browser measurements**, **git diffs**, and **AI-generated explanations** into a single, evidence-backed investigation tool.

> ⚠️ **This repository is currently private.** It will be made public after the application is functional, tested, documented, and verified to contain no exposed secrets or sensitive data.

---

## Planned Features (MVP)

| Feature | Status |
|---|---|
| Screenshot upload & pixel diff comparison | Planned — Phase 2 |
| Before/after slider, heatmap, diff overlay | Planned — Phase 2 |
| Playwright URL capture at multiple viewports | Planned — Phase 3 |
| DOM overflow & axe-core accessibility checks | Planned — Phase 3 |
| AI-powered visual explanation & suggestions | Planned — Phase 4 |
| GitHub & local source-code investigation | Planned — Phase 5 |
| PDF / JSON report export | Planned — Phase 6 |
| Dark (electric blue) & light themes | Planned — Phase 1 |

---

## Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS, shadcn/ui |
| Backend | Node.js, Express, TypeScript |
| Database | MySQL 8.0, Prisma ORM |
| Browser automation | Playwright |
| Image processing | sharp, pixelmatch |
| Accessibility | axe-core |
| AI | Provider-agnostic interface (Gemini / Ollama fallback) |
| Monorepo | npm workspaces |

---

## Repository Structure

> Structure is defined. Scaffolding begins in Phase 1.

```
velora/
├── apps/
│   ├── web/          # React + Vite frontend
│   └── api/          # Express + TypeScript backend
├── packages/
│   └── shared/       # Shared TypeScript types
├── tests/            # Integration and E2E tests
├── docs/             # Architecture, decisions, milestones
├── .env.example      # Required environment variables (no secrets)
└── README.md
```

---

## Getting Started

> Full setup instructions will be written in Phase 1 once the monorepo is scaffolded.

**Prerequisites (verified):**
- Node.js ≥ 18 (currently v24.14.1)
- npm ≥ 8 (currently v11.11.0)
- Git ≥ 2.x
- MySQL 8.0

---

## Development Phases

| Phase | Deliverable |
|---|---|
| **Phase 0** ← *current* | Environment setup, repo init, architecture decisions |
| Phase 1 | Monorepo scaffold, design system, authentication |
| Phase 2 | Screenshot comparison MVP |
| Phase 3 | Browser automation & responsive diagnostics |
| Phase 4 | AI investigator |
| Phase 5 | GitHub & local source intelligence |
| Phase 6 | Reports, polish, export |
| Phase 7 | Testing, security, deployment |

---

## Commit Convention

This project follows [Conventional Commits](https://www.conventionalcommits.org/):

```
feat:     new feature
fix:      bug fix
chore:    tooling, config, maintenance (no production code)
docs:     documentation only
style:    formatting, whitespace (no logic change)
refactor: code restructure (no feature or fix)
test:     adding or updating tests
perf:     performance improvement
ci:       CI/CD configuration
```

---

## Project Owner

**Raghav Bansal** — CSE Student  
GitHub: [@raghavbansal9518-cloud](https://github.com/raghavbansal9518-cloud)

---

*Velora is a solo learning project. Features, names, and scope are subject to change during development.*
