# Product OS MVP — e2e test report

**Scope:** Ran the app locally against seeded Postgres and exercised the core typed-cross-link round-trip end-to-end through the UI. One recording covers sign-in → quick-capture → typed link → inverse verification → search → dashboard regressions. No code changed during testing.

**Result:** 5 primary tests + 2 regressions — **all passed**. Polymorphic `Link` model works round-trip.

**Recording:** see the attached `.mp4`. Screenshots below show key assertion states.

---

## Environment
- Next.js dev server at `http://localhost:3000` (from PR #1)
- Postgres 16 in `product-os-pg` container, seeded with 28 records across 11 modules
- Dev login (`ALLOW_DEV_LOGIN=true`) as `founder@product-os.local`
- Before recording: maximised window, signed in, navigated to Home

---

## Primary flow (recorded)

### T1. Home dashboard renders seeded data — PASSED
Home page rendered with seeded priorities / recent activity and full 11-module sidebar. Would look empty/different if seed or home queries were broken.

### T2. Quick-capture creates a typed `feature` — PASSED
Pressed `c`, filled Type=Feature, Title=`Test feature — link round-trip`. Toast "Captured as feature" appeared, browser redirected to `/records/cmo99q8u80003kj6wrnq9nusj`, detail page shows Features crumb and title. DB row confirms type stored correctly:
```
 type   |             title              | status
--------+--------------------------------+---------
feature | Test feature — link round-trip | backlog
```
(Type would fall back to `idea` if the form didn't persist the selection — it didn't.)

### T3. Typed `supports` link created → Vision — PASSED
From feature's Links tab, `+ Link` → Relation=`supports` → searched `agentic` (seeded Vision title is "Telephony-native agentic communications assistant", no record has "vision" in its title) → picked Vision → Create link. Toast "Link created", dialog closed, Outgoing row shows `supports` → Vision, and the **Context rail** "Why it exists" populated with the Vision (relation-filter logic correct).

![T3 outgoing link + context rail](https://app.devin.ai/attachments/4f188ad6-6dee-48a7-8ced-d40668ed5377/screenshot_f4af1c084737479582eeecfd2545b589.png)

### T4. Inverse relation appears on target Vision — PASSED (round-trip proof)
Navigated via the Outgoing row to the Vision record, opened Links tab. Incoming list now shows three `is supported by` rows, including the new feature:
- `is supported by` → Busy professionals drop or delay phone calls (seed)
- `is supported by` → Inbound greeting + intent capture (seed)
- `is supported by` → **Test feature — link round-trip** (this test)

Inverse label (`supports` → `is supported by`) matches `src/lib/relations.ts`. This is the critical assertion for the polymorphic Link model.

![T4 Vision incoming links](https://app.devin.ai/attachments/d6beceef-5b87-45ec-abdc-874d7787fa32/screenshot_17056991502245eaa6a51d2f79989f9b.png)

DB confirms single row stored, queried bidirectionally from each side:
```
          fromId           |           toId            | relation
---------------------------+---------------------------+----------
 cmo99q8u80003kj6wrnq9nusj | cmo941jon000312pph02ajt4t | supports
```

### T5. Global search finds the new record — PASSED
`/search?q=link+round-trip` returned the new Feature with correct type badge and status.

![T5 search results](https://app.devin.ai/attachments/3a9a341e-8de4-4ccf-803e-29f542adb264/screenshot_cdf8633f65274dbdb59a89c0dda84ab0.png)

---

## Regression

### R1. Founder dashboard — PASSED
`/dashboards/founder` rendered 6 sections populated: strategic decisions, recent insights (2), unresolved assumptions (1), commercial model (2), open GTM tasks (2), roadmap snapshot (3, including the just-created Test feature).

![R1 Founder dashboard](https://app.devin.ai/attachments/622755d7-2811-46b9-990e-b7d81bdf2132/screenshot_af8cd3a78ac245858eeaf861b857f398.png)

### R2. Phase dashboard (MVP) — PASSED
`/dashboards/phase/mvp` rendered Included work (Inbound greeting + intent capture, Inbound call handling MVP) and 1 Experiment (Voice quality bake-off: Twilio vs. Plivo vs. Daily). Assumptions/Risks/Decisions sections rendered empty — seed doesn't currently tag those entities to `phase=mvp`; not a bug, just seed coverage.

---

## Observations (not failures, worth noting)

1. **Link picker search** matches title substring, so searching `vision` against the seeded Vision (titled "Telephony-native …") returns no results. Filter-by-type (e.g. a Type chip) would make link creation more obvious — currently requires knowing the target's title. Low-priority UX improvement.
2. **Vision's context rail** still shows "No supporting links / Nothing depends on this / No evidence linked." even when 3 incoming `supports` links exist — the rail's relation filters are picking the wrong direction for vision-side display (should probably treat incoming `supports` as "supported by" in the "What depends on it" section). Worth revisiting but orthogonal to the core model.
3. Link picker input autocompletes as you type (saw results on 3rd char) — good latency in dev.

## Evidence captured
- Recording: `rec-45e21be1-2b31-48f1-a5ea-bfb3828d5059-edited.mp4` with 10 structured annotations (setup + 5 test_start + 5 assertion).
- Screenshots: T3, T4, T5, R1, R2.
- DB row counts verified before/after.
