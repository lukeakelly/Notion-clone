# Product Requirements Document

## Product OS — Internal Command Centre for the Agentic Communications Product

**Version:** 0.1 (MVP-focused PRD, v1/v1.5/v2 scoped at the end)
**Owner:** Luke Kelly
**Status:** Draft for review

---

## 0. How to read this PRD

This PRD translates the product brief into:

1. A concrete **data model / schema** (entities, fields, relationships) — the spine of the system.
2. **User stories with acceptance criteria**, grouped by module.
3. **Cross-cutting workflows** that stitch modules together (idea→feature, assumption→experiment, decision→impacted items, etc.).
4. **Non-functional requirements** that are testable.
5. **MVP cut lines** (what ships first) vs v1 / v1.5 / v2.
6. **Success metrics** and **open questions**.

Design bias throughout: **relational records > freeform pages**, **structured metadata > long prose**, **traceability > prettiness**, **fast capture > perfect formatting**.

---

## 1. Goals and non-goals

### 1.1 Goals

G1. Single source of truth for product strategy, scope, decisions, evidence and execution for the agentic comms product.
G2. Every important statement (feature, risk, decision, assumption, experiment, insight, price, task) is a **first-class record** that can be linked to other records.
G3. Any decision, and the evidence behind it, can be located in **under 2 minutes**.
G4. Founder can capture a useful new record in **under 30 seconds**.
G5. Self-hosted, data under our control, AI-assisted but not AI-dependent.
G6. Produce investor / pilot / internal summary material without rebuilding context from scratch.

### 1.2 Non-goals (explicitly out of scope for MVP)

NG1. Real-time multiplayer editing.
NG2. Full rich-document editor parity with Notion.
NG3. Whiteboarding / freeform canvas.
NG4. Public websites / external customer portals.
NG5. Complex workflow / approval engine.
NG6. Enterprise fine-grained permissions (field-level ACLs).
NG7. Native mobile apps.
NG8. Marketplace / plugin system.
NG9. Multi-workspace / multi-tenant.
NG10. Advanced BI dashboards.

---

## 2. Personas

### 2.1 Primary — Founder / Product Lead ("Luke")

- Needs fast capture, strong structure, traceability across long-running product work.
- Uses almost every module.
- Primary author of strategy, decisions, experiments, pricing and GTM.

### 2.2 Secondary — Technical Lead / Developer

- Reads requirements, edits architecture, logs technical experiments and ADRs, tracks tech risks and environment readiness.

### 2.3 Future — Commercial / GTM Lead

- Reads ICPs, packaging, pricing, objections, positioning; tracks pilot targets and sales readiness.

### 2.4 Future — Ops / Support Lead

- Tracks support model, runbooks, incidents, compliance readiness, launch checklist.

### 2.5 Roles

Owner, Admin, Editor, Commenter, Viewer. MVP enforces workspace- and module-level permissions only.

---

## 3. Data model (core schema)

### 3.1 Shared fields (every first-class record)

Every first-class object has at minimum:

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `type` | enum | Discriminates record type (see entity list) |
| `title` | string | Required, ≤200 chars |
| `summary` | text | Short one-liner, optional but encouraged |
| `body` | rich text / markdown | Freeform notes section |
| `status` | enum | Per-type status model (§3.4) |
| `phase` | enum | `mvp` / `v1` / `v1.5` / `v2` / `backlog` / `n/a` |
| `priority` | enum | `p0` / `p1` / `p2` / `p3` / none |
| `confidence` | enum | `low` / `medium` / `high` / none |
| `owner_id` | FK → User | |
| `tags` | string[] | Free + controlled vocabulary (§3.5) |
| `custom_fields` | JSON | For admin-defined fields |
| `created_by` | FK → User | |
| `created_at` | timestamp | |
| `updated_by` | FK → User | |
| `updated_at` | timestamp | |
| `archived_at` | timestamp nullable | Soft delete |

Every record also has associated collections:
- `attachments` (many)
- `comments` (many)
- `activity_log` entries (many)
- `links` in and out (many, via the polymorphic `Link` table — §3.3)

### 3.2 First-class entities

Each row below is its own table (or discriminator on a shared `Record` table — decide in tech plan). All inherit shared fields in §3.1.

| Entity | Purpose | Type-specific fields |
|---|---|---|
| **Idea** | Quick-capture raw thought, later promoted | `source`, `intended_destination` (problem/feature/decision/experiment/task) |
| **Vision** | Strategic vision statement | `target_outcome`, `horizon` |
| **Thesis** | Product/market thesis | `thesis_statement`, `supporting_trends` |
| **Problem** | Customer problem statement | `affected_persona_id`, `evidence_strength`, `urgency`, `frequency` |
| **ICP** | Ideal customer profile | `segment`, `industry`, `company_size`, `geography`, `buyer_type`, `user_type`, `current_pain`, `trigger_events`, `budget_fit`, `sales_complexity` |
| **Persona** | Buyer/user persona | `role`, `pains`, `buying_triggers`, `objections`, `success_metrics`, `preferred_language`, `sales_cycle_notes` |
| **Differentiator** | Positioning differentiator | `statement`, `proof_points`, `defensibility`, `maturity_dependency` |
| **Epic** | Large roadmap chunk | `problem_ref`, `phase`, `target_release` |
| **Feature** | Roadmap feature | `why_it_matters`, `user_outcome`, `admin_outcome`, `technical_notes`, `effort_estimate`, `business_value`, `acceptance_criteria[]`, `nfr_implications[]` |
| **Story** | User story | `as_a`, `i_want`, `so_that`, `acceptance_criteria[]`, `feature_ref` |
| **Task** | Delivery/execution task | `due_date`, `status`, `workstream`, `blocked_by[]`, `parent_ref` (polymorphic) |
| **Milestone** | Named milestone | `target_date`, `owner`, `workstream`, `criteria[]` |
| **Decision** | Decision record (including ADR) | `domain` (strategy/architecture/pricing/gtm/ops), `context`, `options[]`, `chosen_option`, `why_chosen`, `trade_offs`, `consequences`, `decided_on`, `review_date`, `supersedes_ref`, `state` (proposed/under_review/approved/rejected/superseded) |
| **Assumption** | Assumption log | `assumption_statement`, `assumption_type`, `source`, `validation_approach`, `due_date`, `validated` (null/true/false) |
| **Risk** | Risk register entry | `risk_statement`, `category`, `likelihood` (1–5), `impact` (1–5), `rating` (derived), `mitigation`, `contingency`, `due_date` |
| **Dependency** | External/internal dependency | `is_external`, `required_by_date`, `impact_if_delayed`, `status` |
| **Experiment** | Validation experiment | `hypothesis`, `objective`, `method`, `sample_or_env`, `success_metrics[]`, `start_date`, `end_date`, `result_summary`, `recommendation`, `result_state` (planned/running/analysed/validated/invalidated/inconclusive), `rubric_scores[]` |
| **ResearchItem** | Market/competitor/other research | `source_type`, `source_ref`, `date`, `author_or_source`, `key_findings[]` |
| **MeetingSummary** | Call/interview/meeting | `participants[]`, `date`, `context`, `top_insights[]`, `objections[]`, `opportunities[]`, `followups[]` |
| **ArchitectureComponent** | Component catalogue entry | `function`, `vendor_or_internal`, `maturity`, `criticality` |
| **ArchitectureOption** | Candidate architecture/provider | `domain` (telephony/orchestration/memory/frontend/auth/hosting/observability), `criteria_scores[]`, `notes` |
| **TelephonyRecord** | Specialised telephony evaluation | `provider`, `call_path`, `inbound_handling`, `outbound_handling`, `number_mgmt`, `sip_pstn_assumptions`, `fallback_model`, `recording_assumptions`, `consent_implications`, `latency_notes`, `failure_modes` |
| **MemoryModelRecord** | Memory design record | `memory_type` (personal/relationship/policy/preferences), `retention_logic`, `explainability_controls`, `deletion_rules` |
| **Environment** | Environment tracker | `name` (dev/staging/demo/pilot/prod), `readiness_state`, `differences[]` |
| **PricingModel** | Pricing model record | `structure`, `subscription_assumptions`, `included_usage`, `overages`, `setup_fees`, `services_revenue`, `cogs_assumptions`, `gross_margin_estimate`, `commercial_risks[]`, `target_segment_fit` |
| **Package** | Product package | `target_customer`, `features_included[]`, `usage_included`, `exclusions[]`, `onboarding_model`, `support_model`, `commercial_guardrails` |
| **UnitEconomicsInput** | Named input line | `driver`, `value`, `unit`, `notes` |
| **PricingScenario** | Compared pricing scenario | `inputs[]`, `outputs[]` (margin, payback, etc.), `notes` |
| **UseCase** | GTM use case | `customer_problem`, `actor`, `workflow_summary`, `value_prop`, `proof_needed`, `dependencies[]` |
| **MessagingFramework** | Messaging artefact | `headline`, `sub_message`, `value_pillars[]`, `proof_points[]`, `objection_handling[]`, `segment_variants[]` |
| **Account** | Pilot / target account | `sector`, `fit_score`, `status`, `key_contacts[]`, `next_step`, `concerns[]` |
| **LaunchChecklistItem** | Launch readiness item | `area` (sales_deck/website/demo/references/onboarding/legal/support/pricing), `state`, `blocker` |

### 3.3 Cross-record linking (the core mechanic)

A single polymorphic `Link` table powers all cross-linking:

```
Link {
  id            UUID
  from_id       UUID   // source record
  from_type     enum
  to_id         UUID   // target record
  to_type       enum
  relation      enum   // see below
  note          text?  // optional context
  created_by    FK User
  created_at    timestamp
}
```

`relation` vocabulary (initial set; admins can add more):
`supports`, `depends_on`, `blocks`, `informed_by`, `validates`, `invalidates`, `contradicts`, `supersedes`, `belongs_to`, `addresses`, `affects`, `derived_from`, `linked_to` (generic).

Links are directional; the UI renders both the forward (`depends_on`) and inverse (`is_depended_on_by`) views on each record.

### 3.4 Status models (per entity)

- **Idea:** `new` / `triaged` / `promoted` / `dropped`
- **Problem / ICP / Persona / Differentiator / Vision / Thesis:** `draft` / `under_review` / `validated` / `archived`
- **Epic / Feature / Story / Task:** `backlog` / `scoping` / `ready` / `in_progress` / `blocked` / `in_review` / `done` / `dropped`
- **Decision:** `proposed` / `under_review` / `approved` / `rejected` / `superseded`
- **Assumption:** `unvalidated` / `validating` / `validated` / `invalidated`
- **Risk:** `open` / `mitigating` / `accepted` / `closed`
- **Dependency:** `open` / `in_progress` / `resolved` / `at_risk`
- **Experiment:** `planned` / `running` / `analysed` / `validated` / `invalidated` / `inconclusive`
- **ResearchItem / MeetingSummary:** `captured` / `summarised` / `actioned`
- **ArchitectureComponent / Option / TelephonyRecord / MemoryModelRecord:** `proposed` / `in_use` / `deprecated` / `rejected`
- **Environment:** `not_ready` / `in_progress` / `ready`
- **PricingModel / Package / PricingScenario:** `draft` / `under_review` / `current` / `retired`
- **UseCase / MessagingFramework:** `draft` / `approved` / `retired`
- **Account:** `prospect` / `engaged` / `piloting` / `won` / `lost` / `dropped`
- **LaunchChecklistItem:** `not_started` / `in_progress` / `ready` / `blocked`

### 3.5 Tags

- **Free tags:** any string, normalized lowercase.
- **Controlled tags (MVP):** phase (`mvp`, `v1`, `v1.5`, `v2`), domain (`telephony`, `gtm`, `pricing`, `architecture`, `compliance`, `legal`, `ops`, `ux`, `support`), confidentiality (`internal`, `restricted`).

### 3.6 Comments, attachments, activity

- **Comment:** `{ id, record_id, record_type, parent_comment_id?, author_id, body_markdown, mentions[], resolved_at?, created_at }`.
- **Attachment:** `{ id, record_id, record_type, filename, mime, size, storage_key, uploaded_by, uploaded_at }`.
- **ActivityLog:** `{ id, record_id, record_type, actor_id, verb, field?, before?, after?, created_at }`.

### 3.7 Users and permissions

- **User:** `{ id, email, name, auth_provider, role, created_at, last_seen_at }`.
- **WorkspaceRole:** enum Owner / Admin / Editor / Commenter / Viewer.
- **ModulePermission (MVP):** `{ user_id, module, permission }` with `module` = one of the 11 modules in §4, `permission` = `none | view | comment | edit | admin`.

### 3.8 AI outputs

- **AIOutput:** `{ id, record_id, record_type, action, prompt_context_ids[], content, model, created_by, created_at, accepted_at?, accepted_as? }`. All AI-generated content is flagged and attributed.

### 3.9 Entity-relationship highlights

- One Experiment can validate many Assumptions (many-to-many via Link `validates`).
- One Feature can address many Problems (many-to-many via Link `addresses`).
- One Decision can affect many Components, Features, Pricing models (many-to-many via Link `affects`).
- One PricingModel can serve many ICPs (many-to-many via Link `supports`).
- Decisions form a supersession chain via Link `supersedes`.
- Tasks attach to any parent via polymorphic `parent_ref` + Link `belongs_to`.

---

## 4. Modules — user stories and acceptance criteria

Each story uses the format: **As a** [persona] **I want** [capability] **so that** [outcome]. Each story has explicit acceptance criteria. MVP-only stories are marked `[MVP]`; later-phase stories are marked `[v1]`, `[v1.5]`, `[v2]`.

### 4.1 Universal workspace capabilities

**U-1 Global search `[MVP]`**
As a founder I want to search across titles, summaries, bodies, tags, AI summaries and attachment text so that I can find any record in under 2 minutes.
AC:
- Single search box available from any page.
- Results grouped by entity type, sorted by relevance and recency.
- Results return in under 3s for workspaces with ≤50k records.
- Search supports quoted phrases and `type:feature`, `status:open`, `tag:telephony`, `owner:luke` operators.
- Attachment text search is best-effort for PDFs and text documents; images not required for MVP.

**U-2 Global filters `[MVP]`**
As a user I want to filter any list view by module, status, owner, phase, tag, date, priority, confidence and decision state so that I can focus quickly.
AC: All list views expose the same filter chip bar. Filters persist in URL. Saved filters `[v1]`.

**U-3 Cross-record linking `[MVP]`**
As a user I want to create a typed link between any two records so that traceability is preserved.
AC:
- From any record I can click "Link" and pick a target by type + search.
- I must pick a relation from the controlled vocabulary (§3.3) or add a note-only `linked_to`.
- Inverse links show on the target record automatically.
- I can remove a link I created; Admins can remove any link.

**U-4 Activity history `[MVP]`**
AC: Every record has an Activity tab showing created/updated events, field diffs, link changes and comment events, newest first.

**U-5 Comments `[MVP]`**
AC:
- Comment on any record with markdown.
- `@mention` a user; notification sent (in-app; email `[v1]`).
- Resolve a thread; resolved threads collapsed by default.

**U-6 Status model `[MVP]`**
AC: Every record has a status field whose allowed values match §3.4 for its type. Admins can add new values per type.

**U-7 Tags `[MVP]`**
AC: Both free tags and controlled tags supported; admins manage controlled vocabularies.

**U-8 Templates `[v1]`**
AC: A template is a record skeleton (preset fields, sections, links). Creating from template copies fields into a new record.

**U-9 Attachments `[MVP]`**
AC: Upload PDF/PNG/JPG/CSV/XLSX/DOCX/PPTX up to 25MB; external URL attachments supported.

**U-10 AI summary / extract `[MVP, guarded]`**
AC:
- "Summarise" button on every record produces a summary rendered as AI output (§3.8).
- "Extract actions / risks / dependencies" buttons create draft Tasks / Risks / Dependencies linked to the source record, with `ai_generated=true`.
- AI output never overwrites existing fields without explicit user accept.
- AI can be disabled globally by an Admin.

**U-11 Exportability `[MVP]`**
AC: Export single record to Markdown/PDF. Export filtered list to CSV/Markdown. Roadmap, decision register, risk register, pricing summary, GTM summary each have a one-click export to PDF/Markdown.

### 4.2 Strategy module

**S-1 Vision records `[MVP]`**
AC: Vision records contain title, summary, target_outcome, horizon, current confidence, linked problems, linked ICPs, linked roadmap items. Admin-editable only.

**S-2 Problem statements `[MVP]`**
AC: Problem record includes affected persona, evidence strength, urgency, frequency, source references (links), linked feature ideas, linked customer insights (ResearchItem / MeetingSummary).

**S-3 ICP records `[MVP]`**
AC: ICP includes all §3.2 fields. Linked use cases and linked pricing assumptions visible inline.

**S-4 Differentiator records `[v1]`**
AC: Differentiator includes statement, proof points, defensibility, maturity dependency, linked competitor notes.

**S-5 Thesis records `[v1]`**
AC: Thesis with supporting trends and linked research.

### 4.3 Product scope and roadmap module

**P-1 Epic management `[MVP]`**
AC: Create epic with name, description, problem addressed (link), priority, phase, owner, status, linked features/dependencies/risks.

**P-2 Feature records `[MVP]`**
AC: Feature supports every field in §3.2. Acceptance criteria is a first-class list (add/reorder/edit). NFR implications is a first-class list.

**P-3 Phase planning `[MVP]`**
AC: Phase field constrained to `mvp/v1/v1.5/v2/backlog`. Changing phase writes to activity log.

**P-4 Views `[MVP]`**
AC: Roadmap supports list, kanban by status, timeline by target_date, grouped by phase, grouped by workstream, grouped by owner. Timeline view basic in MVP (horizontal bar per item on a month grid), refined in v1.5.

**P-5 Dependency visualisation `[v1]`**
AC: On any Feature I can see a graph/list of: blockers, predecessor items, downstream items, items it enables. Graph `[v1.5]`; list-only `[v1]`.

**P-6 Acceptance criteria types `[MVP]`**
AC: A Feature's acceptance criteria are grouped into Functional / Operational / Compliance / Pilot Readiness sections.

**P-7 Stories `[v1]`**
AC: Stories belong to exactly one Feature; support standard As-a/I-want/So-that fields and AC list.

### 4.4 Decision register module

**D-1 Decision record format `[MVP]`**
AC: Decision requires title, domain, decision statement, context, options considered, chosen option, why chosen, trade-offs, consequences, date, owner, review date. Can link to evidence and impacted items.

**D-2 Decision states `[MVP]`**
AC: States enforced per §3.4. Only Admin/Owner can transition to `approved` or `rejected`.

**D-3 Architecture decision records `[MVP]`**
AC: Decision with `domain=architecture` exposes additional ADR-style sections: Status, Context, Decision, Consequences, Alternatives, Links.

**D-4 Decision lineage `[MVP]`**
AC: A decision marked `supersedes` another writes a `supersedes` Link; both records show the supersession chain.

**D-5 Decision impact view `[v1]`**
AC: On a Decision, "Impact" tab lists all records linked via `affects` or `depends_on`.

### 4.5 Risks, assumptions and dependencies module

**R-1 Assumption records `[MVP]`**
AC: All §3.2 fields. `validated` is set only via the "mark validated/invalidated" action, which also links the assumption to the Experiment that produced the result (if any).

**R-2 Risk records `[MVP]`**
AC: Likelihood × Impact = Rating. Rating auto-computed and colour-coded (low/medium/high/critical).

**R-3 Dependency records `[MVP]`**
AC: External/internal flag, required-by date, impact if delayed. Overdue dependencies surface in dashboards.

**R-4 Review views `[MVP]`**
AC: Saved views: "Risks by severity", "Assumptions by confidence", "Dependencies by due date", "Unresolved items only".

### 4.6 Experiment and validation module

**E-1 Experiment record `[MVP]`**
AC: Hypothesis, objective, method, sample/env, success metrics, owner, start/end dates, result summary, recommendation, linked assumptions/decisions, attached evidence.

**E-2 Voice and telephony experiment templates `[MVP]`**
AC: Built-in templates for voice quality comparison, ASR accuracy, latency, interruption handling, transfer/handoff, outbound workflow, memory recall, post-call summary quality. Each template pre-fills success metrics and rubric categories.

**E-3 Experiment states `[MVP]`**
AC: States per §3.4. Moving to `validated`/`invalidated` prompts to update linked Assumptions.

**E-4 Evidence attachments `[MVP]`**
AC: Support screenshots, audio links, transcripts, evaluation rubrics, scorecards, benchmark tables (attachment OR inline structured rubric).

**E-5 Repeatable scoring rubric `[MVP]`**
AC: Rubric categories: quality, reliability, cost, speed, UX, risk. Each scored 1–5 with note. Rubric totals visible in experiment list.

### 4.7 Architecture module

**A-1 Architecture artefacts `[MVP]`**
AC: Upload or link solution overviews, component maps, sequence flows, integration diagrams, deployment diagrams, environment definitions. Artefacts are attachments on ArchitectureComponent / ArchitectureOption / Environment records.

**A-2 Component register `[MVP]`**
AC: Each component has function, vendor/internal flag, maturity, criticality, linked decisions, linked risks.

**A-3 Telephony architecture records `[MVP]`**
AC: All telephony-specific fields per §3.2. Can be compared side-by-side with other TelephonyRecords `[v1]`.

**A-4 Memory model records `[MVP]`**
AC: Per-memory-type records (personal, relationship, policy, preferences) with retention, explainability, deletion fields.

**A-5 Environment tracking `[v1]`**
AC: Environments listed with readiness state and differences; linked to features that require them.

### 4.8 Research and evidence repository

**RE-1 Research items `[MVP]`**
AC: Title, summary, source type, date, author/source, confidence, key findings, tags, linked records.

**RE-2 Interview / call / meeting summaries `[MVP]`**
AC: Structured template with participants, date, context, top insights, objections, opportunities, follow-up actions, linked ICPs/assumptions/features.

**RE-3 Contradiction detection `[v1]`**
AC: AI flags when two linked research items contain contradicting claims; user resolves by tagging one as superseded or opening a Decision.

**RE-4 Insight extraction `[MVP]`**
AC: "Extract insights" AI action produces themes / feature requests / pain points / objections / GTM language; each item can be promoted to a first-class record with one click, preserving link to source.

### 4.9 Commercial model and packaging module

**C-1 Pricing model records `[MVP]`**
AC: All §3.2 fields. Pricing model links to ICPs and to Packages.

**C-2 Package records `[MVP]`**
AC: Target customer, features included (links), usage included, exclusions, onboarding model, support model, commercial guardrails.

**C-3 Unit economics inputs `[v1]`**
AC: Named input lines (telephony cost drivers, model usage, storage, support, implementation, hosting); referenced by PricingScenario.

**C-4 Scenario comparison `[v1.5]`**
AC: Compare up to 4 PricingScenarios side-by-side; outputs include gross margin, break-even, payback.

**C-5 Commercial decision links `[MVP]`**
AC: PricingModel / Package can link to Decisions, ICPs, Features, PilotAccounts.

### 4.10 GTM module

**G-1 Buyer persona records `[MVP]`**
AC: All §3.2 persona fields.

**G-2 Use case records `[MVP]`**
AC: Title, customer problem, actor, workflow summary, value prop, proof needed, dependencies, linked features.

**G-3 Messaging framework `[v1]`**
AC: Headline, sub-message, value pillars, proof points, objection handling, segment variants.

**G-4 Pilot target account tracker `[v1]`**
AC: Account, sector, fit score, status, contacts, next step, concerns, linked pitch materials and hypotheses.

**G-5 Launch readiness checklist `[v1]`**
AC: Default checklist items across the areas in §3.2 LaunchChecklistItem. Progress % computed and shown on Commercial dashboard.

### 4.11 Delivery and execution module

**X-1 Task records `[MVP]`**
AC: Title, description, owner, due date, status, priority, parent (polymorphic link), dependencies, comments, completion notes.

**X-2 Milestones `[MVP]`**
AC: Named milestones with target date, owner, workstream, criteria (list of task/feature links); progress % = share of linked items in terminal state.

**X-3 Workstream grouping `[MVP]`**
AC: Workstream is a free-enum tag with recommended defaults: product, engineering, telephony, UX, GTM, pricing, legal, pilot, support.

**X-4 Personal and team views `[MVP]`**
AC: Saved views: "My tasks", "Overdue tasks", "Tasks due this week", "Blocked tasks", "Milestone view".

---

## 5. Cross-cutting workflows

Each workflow is a guided UX flow with clear entry points and exit states.

### 5.1 W1 — Founder idea capture `[MVP]`

1. From any page, hit `c` or click "+ Capture". Modal opens with a single text box.
2. User types; optional category selector (Idea / Problem / Feature / Decision / Experiment / Task).
3. On save: creates the record, keeps focus in a "Link to…" picker. User can dismiss.
4. Default destination is `Idea` with status `new`.
5. From an Idea the user can "Promote to…" which converts it (copying title/summary/body) and writes a `derived_from` Link back to the original Idea.

AC: Total time from keystroke to saved record ≤ 30s for a typical input.

### 5.2 W2 — Research → feature `[MVP]`

1. Create or import ResearchItem / MeetingSummary.
2. On the record, tag relevant Problem(s) and ICP(s).
3. "Create linked Feature or Experiment" button pre-fills title and creates a `derived_from` Link and `addresses` Link to the Problem.

AC: Trace from any Feature back to the originating evidence in ≤ 2 clicks.

### 5.3 W3 — Assumption → experiment `[MVP]`

1. Create Assumption.
2. "Validate via experiment" button pre-fills an Experiment with the assumption as hypothesis and `validates` Link.
3. When Experiment reaches `validated`/`invalidated`, a toast prompts the user to update the linked Assumption(s).

AC: Assumption's `validated` field is always consistent with the latest experiment result when the user completes the prompt.

### 5.4 W4 — Decision workflow `[MVP]`

1. Propose a Decision (state `proposed`).
2. Add options with trade-offs; link supporting evidence and impacted items.
3. Move to `under_review`; mentions reviewers.
4. Owner/Admin `approves` or `rejects`; approval requires non-empty "chosen option" and "why chosen".
5. Impact tab shows all records linked via `affects`/`depends_on`.

AC: Every approved Decision has non-empty chosen_option, why_chosen, trade_offs, consequences and ≥1 supporting evidence link.

### 5.5 W5 — Roadmap workflow `[MVP]`

1. Create Feature; assign phase, priority, problem.
2. Add dependencies; add acceptance criteria.
3. Decompose into Tasks (or Stories `[v1]`).
4. Track readiness (functional / operational / compliance / pilot).

AC: Phase kanban on the roadmap view reflects current Feature statuses in real time within the session.

### 5.6 W6 — Packaging workflow `[v1]`

1. Define Package; choose target customer (ICP link).
2. Link included Features.
3. Add usage and pricing assumptions (link PricingModel).
4. Compare PricingScenarios `[v1.5]`.

### 5.7 W7 — Telephony evaluation workflow `[MVP]`

1. Define TelephonyRecord per provider.
2. Log criteria (quality, latency, handoff, cost, operational risk) as rubric scores.
3. Run Experiments linked to the TelephonyRecord.
4. Link the resulting evidence to an architecture Decision (`informed_by`).

AC: Each architecture Decision in the `telephony` domain has ≥1 `informed_by` link to an Experiment or TelephonyRecord.

---

## 6. Views and dashboards

### 6.1 Home dashboard `[MVP]`

Sections: Top priorities; Overdue tasks; Active risks (top 5 by rating); Latest decisions (last 10); Current MVP scope (Features where phase=mvp, grouped by status); Active experiments; Next milestones.

### 6.2 Founder dashboard `[MVP]`

Strategic decisions awaiting resolution; new insights added in last 7 days; unresolved assumptions (not `validated`); commercial model items needing work; GTM tasks; roadmap snapshot by phase.

### 6.3 Technical dashboard `[MVP]`

Active architecture decisions; technical experiments; blocked features; environment readiness; high-severity technical risks.

### 6.4 Commercial dashboard `[v1]`

Package scenarios; unresolved pricing assumptions; pilot targets; open objections; launch readiness %.

### 6.5 Phase dashboard `[MVP]`

Views for MVP / v1 / v1.5 / v2 showing included work, dependencies, risks, assumptions, and "decision gaps" (Features linked to Decisions still in `proposed`/`under_review`).

---

## 7. Non-functional requirements (testable)

| ID | Requirement | Target |
|---|---|---|
| NFR-1 | Common page load | < 2s p95 |
| NFR-2 | Search result time | < 3s p95 for ≤50k records |
| NFR-3 | Record create/edit round-trip | < 300ms p95 on same region |
| NFR-4 | Uptime | Business-hours reliability; target 99.5% monthly for pilot |
| NFR-5 | Backups | Daily automated; restore runbook exists; RPO ≤ 24h, RTO ≤ 4h |
| NFR-6 | Security | AuthN via OIDC (Google/Microsoft); RBAC; encryption in transit (TLS 1.2+); encryption at rest where available; audit log for create/update/delete on every record; secrets in a secret manager, never committed |
| NFR-7 | Compliance readiness | Record retention settings, deletion controls, export, auditability of decisions, access reviews |
| NFR-8 | Observability | Error logging with request IDs; basic metrics (latency, error rate, DB time); admin alerts for failures |
| NFR-9 | Self-hosting | Deployable to any standard cloud (AWS/GCP/Azure/Fly/Render/self-managed VM) via Docker or an IaC recipe |
| NFR-10 | Exportability | Per §4.1 U-11 |
| NFR-11 | Accessibility | Meet WCAG 2.1 AA for primary flows `[v1]`; MVP targets keyboard navigability and visible focus |
| NFR-12 | Browser support | Latest Chrome, Safari, Firefox, Edge |

---

## 8. MVP cut lines

### 8.1 In MVP

**Core data/platform**
- Entities: Idea, Vision, Problem, ICP, Persona, Epic, Feature, Task, Milestone, Decision, Assumption, Risk, Dependency, Experiment, ResearchItem, MeetingSummary, ArchitectureComponent, ArchitectureOption, TelephonyRecord, MemoryModelRecord, PricingModel, Package, UseCase, Account (lite — name/sector/fit/status only).
- Polymorphic Links with the relation vocabulary.
- Comments, attachments, activity log.
- Tags (free + controlled) and status per §3.4.
- OIDC auth (Google/Microsoft) + workspace/module-level RBAC.

**Capabilities**
- Global search and filters; saved filters via URL.
- Dashboards: Home, Founder, Technical, Phase.
- Roadmap views: list, kanban, basic timeline, grouped views.
- Decision register with ADR sub-type, supersession lineage.
- Risk + assumption + dependency registers and review views.
- Experiment tracker with voice/telephony templates and rubric.
- Research repository with insight extraction (AI).
- Pricing model + package records (no scenario comparison yet).
- Task + milestone tracking; personal/team views.
- AI: summarise, extract actions/risks/dependencies, extract insights. All outputs labelled and non-overwriting.
- Export: record → PDF/Markdown; list → CSV/Markdown; register one-click exports.
- Admin: users/roles, tag vocabularies, custom fields (basic), backup/restore/export of workspace.

### 8.2 Deferred to v1

- Comments notifications via email; contradiction detection; duplicate detection; templates UI; dependency visualisation (list); differentiator records; thesis records; architecture diagrams UX; environment tracking; stories; GTM messaging framework; pilot account tracker; launch readiness checklist; unit economics inputs; commercial dashboard; GitHub/Slack/Teams integrations; saved-filter management; richer dashboards; decision impact view; SSO group mapping.

### 8.3 Deferred to v1.5

- Scenario comparison; milestone/dependency graph; research clustering UI; review cadences + reminders; meeting/call intake templates; telephony side-by-side comparisons; refined timeline view.

### 8.4 Deferred to v2

- Multi-project / multi-product workspaces; approvals and workflow rules; external advisor access; customer-facing export packs; attachment content search (OCR for images); richer launch reporting.

---

## 9. Admin and hygiene

- User management, role assignment, tag and status config `[MVP]`.
- Template management `[v1]`.
- Archive records `[MVP]`.
- Duplicate detection, merge, required-field enforcement, stale-record view `[v1]`.
- Backup / restore / full export `[MVP]`.

---

## 10. Integrations

- **MVP:** Google / Microsoft auth; SMTP email for notifications; S3-compatible file storage; optional GitHub and calendar link fields on records.
- **v1:** GitHub issues/PR links; Google Drive / SharePoint attachment picker; Slack / Teams webhook notifications; calendar sync for discovery calls; spreadsheet import/export.
- **AI:** Pluggable provider interface (one of: OpenAI, Anthropic, Azure OpenAI, self-hosted model); per-workspace API key; feature flags per AI action.

---

## 11. Reporting (MVP)

- MVP Scope Summary (Features where phase=mvp, grouped by status).
- Open Risks (sorted by rating).
- Unresolved Decisions (state in `proposed`/`under_review`).
- Assumptions Needing Validation (not `validated`).
- Experiment Findings (last 30 days).
- Commercial Model Status.
- Launch Readiness `[v1]`.
- **Executive Snapshot** one-click: current phase; top 5 priorities; top 5 risks; last major decisions; next milestones; commercial items under review.
- **Investor / Advisor Snapshot**: problem, product direction, evidence of demand, MVP status, pricing direction, GTM status.

---

## 12. Success criteria

Within 60 days of daily use:

- **SC-1** Locate any major decision and its rationale in < 2 minutes (measure via a set of 10 blind retrieval trials).
- **SC-2** View current MVP scope in one screen without opening multiple documents.
- **SC-3** Enumerate unresolved assumptions and high-severity risks in one view.
- **SC-4** Track every voice/telephony experiment with a consistent rubric.
- **SC-5** Produce the Executive and Investor snapshots one-click, with no manual assembly.
- **SC-6** Scatter of planning tools is reduced: ≥ 80% of product/strategy work happens here (self-reported).
- **SC-7** Context continuity across multi-week gaps: resuming a work session takes < 10 minutes.

---

## 13. Open questions (for you, Luke)

These are decisions I'd want your call on before scaffolding:

**Q1. AI provider.** Default to OpenAI or Anthropic for MVP? Do you already have an API key available, or should we design around a local/self-hosted option (e.g., Ollama) from day one?

**Q2. Hosting target.** First deployment environment: Fly.io, Render, AWS (ECS/Fargate), a VM, or your own Kubernetes? This affects the devops story.

**Q3. Auth provider.** Google only for MVP, or Google + Microsoft together? Any requirement to use a specific identity provider (e.g., Azure AD tenant)?

**Q4. Single user vs small team at launch.** Is it just you for the first 30 days, or do the technical / commercial / ops personas come online during MVP? This determines how much permissions UX we expose vs hide behind Admin.

**Q5. Data volume expectation for year one.** Ballpark: hundreds, low thousands, tens of thousands of records? This affects DB choice (Postgres is default either way, but indexing/search strategy changes).

**Q6. Attachment storage.** Self-hosted S3-compatible (MinIO) or managed (S3 / R2 / Azure Blob)?

**Q7. "Self-hosted" hard constraint.** Is SaaS on your own cloud account acceptable, or must it run on hardware you control?

**Q8. Rich text fidelity.** Are markdown + basic formatting enough for the `body` field in MVP, or do you want a block editor (e.g., Tiptap) from day one? Markdown is faster to ship; block editor is closer to what people expect from "Notion-ish".

**Q9. Mobile.** Basic responsive web is in scope for MVP — confirm that's sufficient, and that a PWA install is a nice-to-have not a requirement.

**Q10. Naming.** Temporary working name for the product? I've been calling it "Product OS" in this doc — happy to change.

---

## 14. Out of MVP (explicit)

Listed again for clarity and so we can push back on scope creep: no realtime multiplayer, no whiteboard, no full document-editor parity, no public sites, no complex workflow engine, no enterprise field-level ACLs, no native mobile apps, no advanced BI, no multi-workspace, no plugins / marketplace, no external portals.

---

## 15. Glossary

- **Record:** any first-class object (Idea, Feature, Decision, etc.).
- **Link:** a typed directional edge between two records (§3.3).
- **Phase:** which product release a record belongs to (`mvp`, `v1`, `v1.5`, `v2`).
- **Workstream:** functional grouping for tasks (product, engineering, telephony, UX, GTM, pricing, legal, pilot, support).
- **Rubric:** standardised scoring grid for experiments (quality, reliability, cost, speed, UX, risk).

---

*End of PRD v0.1.*
