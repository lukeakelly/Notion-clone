# Product OS

A self-hosted internal operating system for designing and commercialising a telephony-enabled agentic communications product.

It combines **product strategy, roadmap, decisions, assumptions, risks, experiments, architecture, research, commercial modelling, GTM and delivery tracking** in one linked workspace — a purpose-built founder command centre, not a Notion clone.

> What do we know, what have we decided, what are we building next, why, and what evidence supports it?

---

## What's in the MVP

- **~32 first-class entity types** (Idea, Problem, ICP, Persona, Vision, Epic, Feature, Task, Milestone, Decision, Assumption, Risk, Dependency, Experiment, ResearchItem, MeetingSummary, ArchitectureComponent, TelephonyRecord, MemoryModelRecord, Environment, PricingModel, Package, UseCase, Account, etc.)
- **Polymorphic cross-linking** with typed relations (`supports`, `depends_on`, `blocks`, `informed_by`, `validates`, `invalidates`, `contradicts`, `supersedes`, `belongs_to`, `addresses`, `affects`, `derived_from`, `linked_to`)
- **Universal capture** (`c` / Cmd-K) — quickly drop an idea from anywhere in the app
- **Global search** over titles, summaries, bodies and tags
- **Dashboards** — Home, Founder, Technical, and per-phase (MVP / v1 / v1.5 / v2)
- **Auth** — Google OIDC and/or dev credentials (gated by env flag)
- **Optional AI** — summarise / extract actions / extract risks, via OpenAI. App runs fully without a key
- **Self-hosted** — Docker, Fly.io, `docker-compose` for local dev

Detailed brief: [`PRD.md`](PRD.md) (product side) and [`TECH_PLAN.md`](TECH_PLAN.md) (engineering side) in the repo root.

---

## Local development

Requirements: **Node 22**, **pnpm 9+**, **Docker** (for Postgres).

```bash
pnpm install
cp .env.example .env

# start Postgres (port 5432)
docker run --name product-os-pg -p 5432:5432 \
  -e POSTGRES_USER=productos -e POSTGRES_PASSWORD=productos \
  -e POSTGRES_DB=productos -d postgres:16-alpine

pnpm prisma migrate dev
pnpm db:seed
pnpm dev
```

Open <http://localhost:3000> and sign in with `founder@product-os.local` (dev login is on by default in `.env.example`).

Alternatively run the whole stack with Docker:

```bash
docker compose up --build
```

### Useful scripts

| script                 | what it does                          |
| ---------------------- | ------------------------------------- |
| `pnpm dev`             | Next.js dev server                    |
| `pnpm build`           | production build                      |
| `pnpm lint`            | `next lint`                           |
| `pnpm typecheck`       | `tsc --noEmit`                        |
| `pnpm test`            | Vitest                                |
| `pnpm db:migrate`      | Prisma migrate dev                    |
| `pnpm db:deploy`       | Prisma migrate deploy (prod)          |
| `pnpm db:seed`         | Populate representative seed data     |
| `pnpm db:studio`       | Prisma Studio                         |

---

## Deploying to Fly.io

```bash
fly launch --no-deploy         # accept the provided fly.toml
fly pg create --name product-os-db --region lhr
fly pg attach product-os-db
fly secrets set AUTH_SECRET=$(openssl rand -base64 32) \
  GOOGLE_CLIENT_ID=... GOOGLE_CLIENT_SECRET=... \
  OPENAI_API_KEY=...
fly deploy
```

The Dockerfile is multi-stage (Node 22 + pnpm). On boot it runs `prisma migrate deploy` and then `next start`.

---

## Architecture (short)

- **Next.js 14** App Router, server actions, TypeScript
- **Prisma** + **Postgres 16** (shared `Record` model with a `type` discriminator and a JSON `data` field for type-specific attributes; polymorphic `Link` table for typed relationships)
- **Auth.js v5** with Google OIDC + dev credentials provider
- **Tailwind + custom shadcn-style components** on Radix primitives
- **OpenAI** (optional, pluggable)
- **S3-compatible storage** (AWS S3 / MinIO / local FS fallback for attachments)

Service layer lives in `src/server/services/{records,links,search,ai}.ts`. Server actions in `src/server/actions.ts`. Entity metadata (fields, statuses, labels, module membership) in `src/lib/entities.ts`.

---

## Repo layout

```
product-os-app/
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── src/
│   ├── app/                 # Next.js routes
│   │   ├── [slug]/          # dynamic list + new pages per entity
│   │   ├── records/[id]/    # record detail + edit
│   │   ├── search/
│   │   ├── dashboards/
│   │   └── sign-in/
│   ├── components/
│   │   ├── record/          # detail panels
│   │   └── ui/              # primitives
│   ├── lib/                 # entity metadata, relation vocab, utils
│   └── server/
│       ├── auth.ts
│       ├── db.ts
│       ├── actions.ts
│       └── services/
├── Dockerfile
├── fly.toml
├── docker-compose.yml
└── .env.example
```

---

## Status

MVP scaffold. Deferred to v1+: block editor, email notifications, contradiction detection, GitHub/Slack integrations, approvals workflow, multi-workspace.
