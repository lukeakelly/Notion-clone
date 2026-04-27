# Product OS — MVP Technical Plan

**Version:** 0.1
**Companion to:** PRD v0.1
**Status:** Draft

---

## 1. Summary

Build the MVP as a single Next.js application, backed by Postgres, deployable as a Docker container to Fly.io (or any container host). Prioritise fast record CRUD, a polymorphic link model, full-text search, and a clean relational schema that mirrors the PRD. AI features are a thin, optional layer.

---

## 2. Stack

| Layer | Choice | Rationale |
|---|---|---|
| Language | **TypeScript** | Single language for FE + BE, strong typing for the relational model. |
| Web framework | **Next.js 14 (App Router)** | File-routed app + server actions, good DX, easy self-host. |
| UI | **Tailwind CSS** + **shadcn/ui** + **lucide-react** | Fast, consistent, easy to extend, no vendor lock. |
| Rich text (MVP) | **react-markdown** + **remark-gfm** for rendering; plain `<textarea>` or CodeMirror for editing | Markdown body per PRD Q8. Upgrade to Tiptap in v1. |
| Forms | **react-hook-form** + **zod** | Typed validation end-to-end. |
| DB | **Postgres 16** | First-class relational support, `pg_trgm`, `tsvector`, JSONB for `custom_fields`. |
| ORM | **Prisma** | Schema-first, migrations, fast to iterate. |
| Auth | **Auth.js (NextAuth v5)** with Google OIDC + email magic-link | PRD Q3 defaults. |
| File storage | **S3-compatible** via `@aws-sdk/client-s3` (swap R2/MinIO via env); local FS in dev | PRD Q6. |
| Search | **Postgres FTS** (`tsvector` + GIN index) + `pg_trgm` for fuzzy | Adequate for ≤50k records. |
| Background jobs (MVP) | Inline / server actions. No queue yet. | Add BullMQ / Inngest in v1 when AI jobs go async. |
| AI | Pluggable provider interface; default **OpenAI** via `OPENAI_API_KEY`; graceful no-op when absent | PRD §10. |
| Observability | `pino` for structured logs; request IDs; simple `/healthz` | Upgrade to OpenTelemetry in v1. |
| Testing | **Vitest** (unit) + **Playwright** (e2e, smoke tests) | |
| Lint/format | **ESLint** (next + @typescript-eslint) + **Prettier** | |
| CI | **GitHub Actions** | Install, lint, typecheck, unit tests. |
| Deployment | **Fly.io** (Dockerfile + `fly.toml`) with Fly Postgres | PRD Q2. |

---

## 3. Repository layout

```
product-os/
├── .github/workflows/ci.yml
├── .env.example
├── Dockerfile
├── fly.toml
├── docker-compose.yml          # local Postgres + MinIO
├── next.config.mjs
├── package.json
├── pnpm-lock.yaml
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── public/
├── src/
│   ├── app/
│   │   ├── (auth)/ sign-in, sign-out, verify-request
│   │   ├── (app)/
│   │   │   ├── layout.tsx      # shell: sidebar + topbar + command palette
│   │   │   ├── page.tsx        # Home dashboard
│   │   │   ├── dashboards/founder
│   │   │   ├── dashboards/technical
│   │   │   ├── dashboards/phase/[phase]
│   │   │   ├── roadmap
│   │   │   ├── decisions
│   │   │   ├── risks
│   │   │   ├── assumptions
│   │   │   ├── experiments
│   │   │   ├── research
│   │   │   ├── architecture
│   │   │   ├── pricing
│   │   │   ├── packages
│   │   │   ├── tasks
│   │   │   ├── records/[type]/[id]  # generic record detail
│   │   │   └── search
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/route.ts
│   │   │   ├── records/…         # REST helpers where server actions don't fit
│   │   │   └── ai/…
│   │   └── layout.tsx
│   ├── components/
│   │   ├── ui/                  # shadcn components
│   │   ├── record/              # RecordHeader, RecordBody, LinkedRecordsPanel, ActivityPanel, CommentsPanel
│   │   ├── forms/               # typed form fields per entity
│   │   ├── quick-capture/       # universal capture modal
│   │   ├── link-picker/
│   │   ├── kanban/, timeline/, filters/
│   │   └── markdown/
│   ├── server/
│   │   ├── db.ts                # Prisma client singleton
│   │   ├── auth.ts              # NextAuth config
│   │   ├── actions/             # server actions per entity
│   │   ├── services/
│   │   │   ├── records.ts       # generic CRUD helpers over the discriminated model
│   │   │   ├── links.ts         # polymorphic link service
│   │   │   ├── search.ts        # tsvector + pg_trgm search
│   │   │   ├── activity.ts      # activity log emitter
│   │   │   ├── storage.ts       # S3 adapter
│   │   │   └── ai.ts            # provider-agnostic AI interface
│   │   └── rbac.ts              # role + module permission checks
│   ├── lib/
│   │   ├── entities.ts          # single source of truth for entity metadata
│   │   ├── status.ts            # per-entity status models
│   │   ├── relations.ts         # link relation vocabulary
│   │   ├── phases.ts
│   │   └── rubric.ts            # experiment rubric config
│   ├── styles/
│   └── types/
└── tests/
    ├── unit/
    └── e2e/
```

---

## 4. Data model implementation

### 4.1 Strategy: typed-table-per-entity with a shared `Record` view

Two workable strategies:

- **A. One `records` table with `type` discriminator** + per-type JSONB field bag. Flexible, but loses Postgres-level constraints.
- **B. Per-entity table** (`feature`, `decision`, `risk`, …) sharing a common `record` parent via 1:1 FK. Keeps strong typing; links target `record.id` regardless of subtype.

**MVP choice: B (per-entity tables with a shared `Record` parent).** Every entity has a 1:1 row in `record` carrying shared fields (title, summary, status, phase, owner, tags, timestamps). All links / comments / attachments / activity reference `record.id`. This keeps the polymorphic link model simple and preserves type-safe per-entity fields.

### 4.2 Prisma schema sketch

```prisma
model Record {
  id          String    @id @default(cuid())
  type        RecordType
  title       String
  summary     String?
  bodyMd      String?
  status      String
  phase       String?   // mvp / v1 / v1.5 / v2 / backlog / null
  priority    String?
  confidence  String?
  ownerId     String?
  owner       User?     @relation(fields: [ownerId], references: [id])
  tags        Tag[]     @relation("RecordTags")
  customFields Json?
  createdById String
  updatedById String
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  archivedAt  DateTime?

  // per-entity 1:1 extensions
  feature     Feature?
  decision    Decision?
  risk        Risk?
  assumption  Assumption?
  experiment  Experiment?
  // … (one optional relation per entity)

  // polymorphic relations
  outgoingLinks Link[] @relation("LinkFrom")
  incomingLinks Link[] @relation("LinkTo")
  comments    Comment[]
  attachments Attachment[]
  activity    Activity[]

  searchTsv   Unsupported("tsvector")?

  @@index([type])
  @@index([status])
  @@index([phase])
  @@index([ownerId])
}

enum RecordType {
  idea
  vision
  thesis
  problem
  icp
  persona
  differentiator
  epic
  feature
  story
  task
  milestone
  decision
  assumption
  risk
  dependency
  experiment
  researchItem
  meetingSummary
  architectureComponent
  architectureOption
  telephonyRecord
  memoryModelRecord
  environment
  pricingModel
  package
  unitEconomicsInput
  pricingScenario
  useCase
  messagingFramework
  account
  launchChecklistItem
}

model Link {
  id        String   @id @default(cuid())
  fromId    String
  from      Record   @relation("LinkFrom", fields: [fromId], references: [id], onDelete: Cascade)
  toId      String
  to        Record   @relation("LinkTo", fields: [toId], references: [id], onDelete: Cascade)
  relation  LinkRelation
  note      String?
  createdById String
  createdAt DateTime @default(now())

  @@unique([fromId, toId, relation])
  @@index([toId, relation])
}

enum LinkRelation {
  supports
  depends_on
  blocks
  informed_by
  validates
  invalidates
  contradicts
  supersedes
  belongs_to
  addresses
  affects
  derived_from
  linked_to
}
```

Per-entity tables hold only the type-specific fields from PRD §3.2 and link back to `Record` via `recordId`.

### 4.3 Search

- Generated column `search_tsv tsvector` computed from `title || ' ' || summary || ' ' || body_md || ' ' || array_to_string(tags, ' ')`.
- GIN index on `search_tsv`.
- `pg_trgm` extension + GIN on `title` for fuzzy autocomplete.
- Attachment text search (PDFs) is MVP-best-effort: extracted text stored on `Attachment.extractedText` and joined into `search_tsv` via a trigger.

### 4.4 Activity log

- Single `Activity` table: `{ id, recordId, actorId, verb, field?, before?, after?, createdAt }`.
- Written via a small `logActivity()` helper called from every mutator.

---

## 5. Auth & authorisation

- **Auth.js v5** with Google OIDC + email magic-link providers. Session strategy: JWT.
- First signed-in user becomes **Owner** automatically; subsequent users default to **Viewer** until Owner/Admin promotes them.
- **Module permissions:** `WorkspacePermission { userId, module, permission }`; `rbac.ts` helper `can(user, action, record)` consulted by every server action.
- Dev convenience: a **credentials provider** enabled only when `NODE_ENV !== 'production' && ALLOW_DEV_LOGIN=true`, pre-seeded with a founder user.

---

## 6. UI/UX

- **App shell**: left sidebar (modules), top bar (global search + quick-capture `c`), command palette (`Cmd/Ctrl-K`).
- **Record page** standard layout:
  - header (title, status, phase, priority, owner, tags)
  - tabs: Overview · Links · Activity · Comments · Attachments · AI
  - right rail: "Why it exists" / "What depends on it" / "Evidence" summarised from links
- **Quick capture**: `c` opens a single-field modal. Saves as `Idea` by default; destination selectable.
- **Link picker**: typed relation dropdown + fuzzy record search; preview of existing links on both sides.
- **Kanban / Timeline / Grouped views**: shared list-view infrastructure with a `groupBy` selector.
- **Accessibility (MVP)**: keyboard navigable, visible focus, semantic headings. Full WCAG in v1.

---

## 7. AI integration

- `src/server/services/ai.ts` exposes:
  - `summarise(recordId, opts)`
  - `extractActions(recordId)`
  - `extractRisks(recordId)`
  - `extractDependencies(recordId)`
  - `extractInsights(recordId)`
- Each returns `{ content, model, tokens }` and persists an `AIOutput` record.
- Provider interface: `AIProvider` with `complete(messages, schema?)`. Default `OpenAIProvider`; swap via `AI_PROVIDER` env.
- UI: AI outputs are shown clearly labelled; "Accept as summary", "Convert to Task", "Convert to Risk" buttons create downstream records with `derived_from` links.

---

## 8. Deployment

- **Dockerfile**: multi-stage (deps → build → runtime). Node 22, pnpm, non-root user. Runs `prisma migrate deploy && next start`.
- **fly.toml**: single app, 1 shared-cpu-1x VM (scales), healthcheck on `/healthz`. Fly Postgres attached via `DATABASE_URL`.
- **docker-compose.yml** for local: Postgres 16 + MinIO + the app.
- **Env vars** (documented in `.env.example`):
  ```
  DATABASE_URL
  NEXTAUTH_SECRET
  NEXTAUTH_URL
  GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET
  EMAIL_SERVER / EMAIL_FROM
  S3_ENDPOINT / S3_BUCKET / S3_REGION / S3_ACCESS_KEY_ID / S3_SECRET_ACCESS_KEY
  OPENAI_API_KEY (optional)
  AI_PROVIDER=openai
  ALLOW_DEV_LOGIN=false
  ```

---

## 9. CI/CD

GitHub Actions workflow:

1. `pnpm install --frozen-lockfile`
2. `pnpm lint`
3. `pnpm typecheck`
4. `pnpm test` (Vitest)
5. (Optional, gated) `pnpm e2e` (Playwright) against a spun-up Postgres service.
6. Build the Docker image on merges to `main`.

---

## 10. Delivery plan (this session)

I'll deliver the scaffold in these commits (single PR):

1. Bootstrap: Next.js App Router + TS + Tailwind + shadcn + pnpm.
2. Prisma schema: Record, per-entity tables, Link, Comment, Attachment, Activity, Tag, User, WorkspacePermission, AIOutput. Initial migration.
3. Auth.js (Google + dev credentials).
4. Record service + link service + activity helper.
5. Core pages: list/detail for Feature, Decision, Risk, Assumption, Experiment, Task, Problem, ResearchItem, Idea.
6. Universal quick-capture + link picker.
7. Global search (tsvector).
8. Dashboards: Home, Founder, Technical, Phase.
9. Tags, comments, attachments (local FS in dev).
10. Seed script with representative data spanning all modules.
11. Dockerfile, fly.toml, docker-compose.yml, `.env.example`, README.
12. GitHub Actions CI (lint / typecheck / unit).

**Explicitly deferred from scaffold (per PRD v1+ cut lines):** block editor, email notifications, contradiction / duplicate detection, pilot account tracker, launch readiness checklist, unit-economics and scenario comparison, GitHub/Slack integrations, approvals workflow. The schema makes room for them so they drop in without migrations.

---

## 11. Risks in the build

- **Polymorphic links in Prisma** require manual relation definitions and some raw SQL for search. Mitigated by a small `linkService` wrapper.
- **Search quality** via plain FTS will be adequate for MVP; expect to iterate on ranking.
- **AI prompts** are minimal in MVP; prompt quality will be a follow-up tuning loop.
- **Self-hosting story**: Fly is the default but the Dockerfile is portable; we'll document deploy-elsewhere in the README.
