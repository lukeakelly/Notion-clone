---
name: testing-simplyai-estimator
description: Test the Simplyai automation estimator end-to-end through the browser UI. Use when verifying dashboard, workshop ingestion, CSV import, recalculation, settings, or resource logic changes.
---

# Testing Simplyai Estimator

## Devin Secrets Needed

No external user secrets are needed for local E2E testing. Use the repo's local dev-login configuration:

- `ALLOW_DEV_LOGIN=true`
- `AUTH_SECRET=local-testing-secret-not-real`
- `NEXTAUTH_URL=http://localhost:3000`
- `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/postgres?schema=public`

## Local setup

1. Start or verify Postgres is available. The repo environment may already run a `product-os-pg` Docker container.
2. Use the repo-pinned Prisma CLI if schema setup is needed:
   ```bash
   pnpm exec prisma db push
   ```
   Avoid `pnpm dlx prisma db push`; it may pull a newer Prisma major version than the repo expects.
3. Start the dev server:
   ```bash
   DATABASE_URL='postgresql://postgres:postgres@localhost:5432/postgres?schema=public' ALLOW_DEV_LOGIN=true AUTH_SECRET='local-testing-secret-not-real' NEXTAUTH_URL='http://localhost:3000' pnpm dev
   ```
4. Open `http://localhost:3000/sign-in` and continue with `estimator@simplyai.com.au`.
5. If the dev server serves stale `/_next/static` chunks after a production build, restart `pnpm dev` before recording tests.

## Browser E2E flow

Record browser interactions for UI testing and annotate major assertions.

1. On the home dashboard, verify:
   - `Automation Estimation Workspace`
   - `Total clients 3`
   - `Total projects 4`
   - sample delivery cost and annual savings cards are visible
2. Open `Northbank Mutual` and verify:
   - Client page shows `Program Level View`
   - Claims Intake project card is available
3. Open `Program Level View` and verify:
   - `NB-2026-001` row exists
   - ROI and payback columns render
   - `Last recalculated` includes date and time
4. Open Claims Intake and verify baseline metrics:
   - Delivery cost `$108,515`
   - Annual saving `$255,170`
   - ROI around `2.4x`
   - Payback `5.1 months`
5. Test workshop ingestion with notes that omit project name but include `Complexity: medium` and a description containing the word `complex`:
   ```text
   Processes: Application intake
   Applications: App A
   Complexity: medium
   Description: This involves complex document validation rules.
   Design BA: 10
   Build Dev: 20
   ```
   Verify the existing project name is preserved, review warnings appear, process name becomes `Application intake`, and complexity remains `medium`.
6. Test CSV import with:
   ```csv
   Process,Frequency,Activity volume average per frequency,Average processing time minutes,Number of employees
   Application intake,Monthly,10,60,1
   ```
   Verify editable rows and top metrics update immediately, including As-is cost `$5,040`, annual saving `$3,528`, ROI `0.1x`, and payback around `159.9 months` before other settings changes.
7. Click `Recalculate Estimate` and verify the visible timestamp updates with date and time while CSV-derived metrics remain consistent.
8. Change `Global settings` → `BA day rate` from `700` to `900`, return to the project, recalculate, and verify delivery cost increases.
9. Move the project duration slider shorter and verify recommended BA/developer counts update.

## Reporting

- Post one consolidated PR comment with pass/fail bullets and links to the Devin session, test report, and recording.
- Include screenshots in the test report; use side-by-side evidence tables for before/after states.
- If any assertion fails, exit testing mode, fix the issue, then re-enter testing mode and rerun the relevant UI flow.
