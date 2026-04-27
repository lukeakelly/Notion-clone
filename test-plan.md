# Product OS — MVP end-to-end test plan

## What I'll prove
The scaffold is a working, linked product-execution workspace: a user can sign in, see seeded strategy data on the Home dashboard, quick-capture a new typed record, create a **typed cross-link** between two records, and verify the link appears on **both sides** with the correct forward/inverse relation labels — which is the core premise of the polymorphic `Link` model and the defining feature vs. a generic note tool.

Each step is designed so a broken implementation (e.g. link only persists one direction, quick-capture doesn't redirect, context rail misses its relation filter) would produce a visibly different result.

## Environment
- Dev server: `http://localhost:3000` (Next.js 14 App Router, pnpm dev)
- Postgres: `product-os-pg` docker container, seeded with 28 records across 11 modules
- Dev login enabled (`ALLOW_DEV_LOGIN=true`); sign-in as `founder@product-os.local`
- Code references: `src/components/quick-capture.tsx`, `src/components/link-picker.tsx`, `src/components/record/linked-records.tsx`, `src/app/records/[id]/page.tsx`

## Primary flow — typed cross-link round-trip

### T1. Sign-in and Home dashboard
- Action: open `/`, sign in with `founder@product-os.local` via dev credentials.
- **Pass:** Home page renders with a "Top priorities" / latest activity section containing at least one seeded record (e.g. "Evaluate Twilio vs. Plivo for inbound latency" or "Telephony provider decision"). Sidebar lists the 11 modules (Strategy, Roadmap, Decisions, Risks/Assumptions/Dependencies, Experiments, Architecture, Research, Commercial, GTM, Delivery).
- **Fail:** empty dashboard, 500 error, or sidebar missing modules.
- Would-be-broken-looks-different: if seed/linking is broken, recent records and linked counts won't render.

### T2. Quick-capture creates a typed `feature` record
- Action: press `c` (hotkey, `src/components/quick-capture.tsx:49`). In the dialog, set **Type = Feature**, Title = `Test feature — link round-trip`, Summary = `Created during e2e test`. Click **Capture**.
- **Pass:**
  - Toast "Captured as feature" appears (`quick-capture.tsx:78`).
  - Browser redirects to `/records/<new-id>` (not just closes the dialog).
  - Detail page shows header `Test feature — link round-trip`, type badge = "Feature", status = `draft` or similar initial status.
  - DB check (after test): `SELECT type,title FROM "Record" WHERE title='Test feature — link round-trip'` returns exactly one row with `type='feature'`.
- **Fail:** no redirect, record saved with wrong type, or duplicate rows.
- Would-be-broken-looks-different: if `quickCaptureAction` doesn't persist the selected `type`, the type badge on the detail page will show `idea` (default) instead of `Feature`.

### T3. Create a typed outgoing link `supports` → existing Vision
- Action: from the new feature's detail page, click the **Links** tab, then the **+ Link** button. In the dialog set **Relation = supports**, type `vision` or the seed title prefix into the search box, pick the seeded Vision record (`Agentic communications OS` or equivalent from seed), click **Create link**.
- **Pass:**
  - Toast "Link created".
  - Dialog closes, Links tab now shows under **Outgoing**: row labelled "**supports**" pointing to the Vision record, with the Vision's title as a clickable link.
  - Context rail on the right (**Why it exists** section, `records/[id]/page.tsx:98`) now lists the Vision record (since `supports` is in the "why" filter).
- **Fail:** link not visible on refresh, wrong relation label, context rail doesn't include it.
- Would-be-broken-looks-different: if the Link row isn't created, the Links tab stays empty. If only persisted but not queried inverse-ly, T4 will fail.

### T4. Verify inverse relation appears on the target record (round-trip proof)
- Action: click through the link from the feature's Links tab to navigate to the Vision record's detail page. Open its **Links** tab.
- **Pass:**
  - Under **Incoming**, there is a row with the **inverse label** (per `src/lib/relations.ts`, `supports` inverse = `supported by`) pointing back to `Test feature — link round-trip`.
  - Vision's context rail **What depends on it** or evidence list reflects the new feature where appropriate.
- **Fail:** inverse row missing, points to the wrong record, shows the forward label instead of the inverse.
- Would-be-broken-looks-different: this is the critical test — if the `Link` table stored only one direction or the incoming query on `records/[id]/page.tsx:57-62` is wrong, this row won't appear. Exactly the kind of bug that distinguishes a working polymorphic link from a broken one.

### T5. Global search resolves the new record
- Action: press `/` (or click the topbar search). Type `link round-trip`. Enter.
- **Pass:** search results page lists `Test feature — link round-trip` with type = Feature.
- **Fail:** record missing from search results.
- Would-be-broken-looks-different: if `searchRecords` service doesn't `ILIKE` against title, a just-created record won't be findable.

## Regression-only (label clearly in report)
### R1. Founder dashboard renders
- Action: navigate to `/dashboards/founder`.
- **Pass:** page loads, at least one seeded unresolved assumption or decision is listed.

### R2. Phase dashboard renders
- Action: navigate to `/dashboards/phase/MVP`.
- **Pass:** page loads, renders at least one feature/task tagged to MVP phase.

## Evidence to capture
- Screen recording (maximised browser) of T1→T5 with `record_annotate` for each test_start + assertion.
- DB row counts before/after for `Record` and `Link`.
- One screenshot each of: Home dashboard, feature detail overview tab, Links tab on feature (outgoing), Links tab on vision (incoming with inverse label), search results.
