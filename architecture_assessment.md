# MedQR Architecture Assessment

**Assessment date:** 2026-10-02  
**Scope:** Phase 0 audit plus narrow Phase 1 improvements to batch dispensing and PIN-gated patient portal access. This is an implementation assessment, not a production security certification.

## Executive Summary

MedQR is an existing Next.js application with working domain slices for facility/staff access, patient registration and QR lookup, visit episodes, diagnoses, laboratory requests/results, prescriptions, pharmacy, drug stock, payments, and operational dashboards. It uses Supabase Postgres and has historical SQL migrations. The appropriate direction is to extend these workflows in place, not replace the application.

The current architecture is not yet a safe multi-hospital clinical platform. Staff authentication is a custom signed-cookie system, while Supabase RLS is written for Supabase Auth identities and most server APIs use a service-role client that bypasses RLS. Consequently, API authorization and tenant isolation must be made explicit in server-side application logic before adding more modules. Several existing endpoints currently omit those checks.

## Current Architecture

- **Web application:** Next.js 14 App Router, React 18, TypeScript. Pages and route handlers live under `src/app`; shared UI is under `src/components`.
- **Persistence:** Supabase Postgres accessed through `@supabase/supabase-js`. Schema changes are represented by ten SQL migrations in `supabase/migrations`.
- **Database model:** Institutions, profiles, staff and staff credentials; patients; episodes; diagnoses; test requests; prescriptions; payments; audit logs; scan notifications; drugs and stock transactions. Episodes associate a patient visit with an institution.
- **Authentication:** Staff usernames/passwords are checked against bcrypt hashes in `staff_credentials`. `src/lib/session.ts` issues an eight-hour HMAC-signed, HttpOnly cookie with role, staff ID, and institution ID. A separate Supabase Auth/profile model exists but is not the active staff session path.
- **Authorization:** API handlers call `requireSession` and often pass a hard-coded allowed-role list. There is no permission registry or shared facility-scoping policy. The session contains identity claims but has no server-side revocation/version check.
- **Database security:** RLS is enabled on core tables, but its policies use Supabase `auth.uid()` and broadly allow authenticated reads on institutions, staff, patients, episodes, diagnoses, lab requests, prescriptions, and payments. Custom staff sessions do not establish a Supabase Auth identity. The service-role client bypasses RLS.
- **Inventory:** Drug stock is represented by one quantity per drug plus stock movement rows. SQL RPCs perform atomic stock add/dispense operations. The batch prescription API calls the new atomic episode-dispenser RPC, which delegates each remaining prescription quantity to the existing stock RPC inside one database transaction.
- **Notifications:** A notification helper supports configurable SMS/email provider names and logs scan notification outcomes. It currently implements provider calls directly rather than through a persisted, queued provider abstraction.
- **Localization:** A client context defines English, Luganda, Swahili, and French translations. Most user-facing strings remain inline in pages/components.
- **Storage:** No application file upload, private document storage, or signed-URL path was found in the searched source tree.
- **Testing:** No test/spec files were found by the workspace test-file search. `package.json` exposes lint/build/start/dev scripts but no test script.
- **Configuration:** Environment values are centralized in `src/lib/config.ts`; server and browser Supabase clients currently share a module, with the service-role client selected when its secret exists.

## Existing Workflows and Reusable Pieces

- Patient registration creates a patient with a generated `PAT-...` QR value, demographic and selected medical-history fields, optional phone/email, photo URL support, and an optional bcrypt-hashed four-digit PIN.
- Staff can look up patients by QR or name. Episodes connect patients to facilities and can carry assigned-doctor and chief-complaint fields.
- Doctor, laboratory, pharmacy, cashier, receptionist, facility-admin, ministry, and superadmin pages/routes exist. Roles are currently a small enum, not the requested configurable role/permission model.
- Test requests have basic pending/in-progress/completed states and free-text results. Prescriptions are linked to episodes and can reference a drug; inventory has institution-scoped drug rows and a stock movement table.
- Payments and a CollectUG payment integration exist. Audit triggers are attached to several core tables, but API service-role writes do not populate `auth.uid()` as the actor.
- Shared UI includes role guards, navigation, breadcrumbs, payment modal, and staff metrics. Preserve these while moving authorization and business rules into reusable server-side services.

## Verified Risks and Gaps

### Critical: patient data is not consistently authorization-scoped

- `src/app/api/citizens/route.ts` authenticates `GET`, but permits any session role and its QR, search, and list queries do not constrain results to the session's institution. It uses the service-role-capable Supabase client.
- The patient portal now asks for PIN before requesting record data. `src/app/api/patient-portal/access/route.ts` requires a staff session, verifies PIN on the server, rate-limits attempts, returns the 20 most recent episodes with their diagnoses/prescriptions, and initiates access notification only after authorization.
- Other patient/episode/diagnosis/prescription/test APIs still have broad or inconsistently tenant-scoped reads. The new portal gate does not replace the remaining backend authorization work.
- `src/app/api/episodes/route.ts`, `src/app/api/prescriptions/route.ts`, and `src/app/api/tests/route.ts` have read paths that accept any session and rely on IDs/optional filters rather than consistently enforcing facility and record-level permissions.
- The initial migration's `USING (true)` authenticated read policies are not tenant isolation. They also do not protect service-role API queries.

### Improved: PIN access is now authenticated and rate-limited

- `src/app/api/patients/verify-pin/route.ts` now requires an authenticated staff session and reserves attempts through the database limiter. Five attempts are allowed per patient/source window; subsequent attempts are blocked for 15 minutes. The source identifier is HMAC-hashed before persistence.
- `src/app/api/patient-portal/access/route.ts` performs the same server-side attempt check before PIN comparison; the migration serializes attempt reservations with a row lock.
- This rate limit is keyed to the proxy-provided source address and patient. Deployment must ensure the reverse proxy overwrites trusted IP headers; session/device-bound grants and broader edge rate limits are still future work.
- `src/app/api/scan-notifications/route.ts` accepts unauthenticated requests with caller-supplied patient IDs and recipient details. Repeated calls may trigger provider traffic; notification records are not proof of an authorized record access.
- The QR value is a generated identifier, not a short-lived/revocable scoped token. QR generation is present, but the token modes, authorization exchange, revocation, and audited access model requested in the product brief are not.

### High: role checks do not amount to granular authorization

- Role names are hard-coded in a Postgres enum, TypeScript unions, and route checks. Permissions are not data-driven and are not consistently enforced at database/service boundaries.
- Institution-wide and global roles are mixed in the same handlers. Some handlers allow caller-supplied institution IDs when the session has no institution context.
- The HMAC session cannot be centrally revoked before its eight-hour expiry. There is no demonstrated MFA, lockout/risk control, or user/session management policy.

### Resolved in this change: batch dispensing now decrements stock atomically

- The single-prescription endpoint and the batch path in `src/app/api/prescriptions/route.ts` use the atomic `dispense_prescription` database function. Batch mode now calls `dispense_episode_prescriptions`, which locks the episode and prescriptions, validates episode state and facility context, and processes all remaining quantities within one transaction.
- Any stock or prescription failure rolls back the entire batch, including episode completion. The RPC is executable only by Supabase `service_role`; the API additionally rejects cross-facility episodes for facility-bound sessions.
- Install the database function by running `supabase/migrations/00000000000008_atomic_episode_dispensing.sql` after migration `00000000000007_drug_inventory.sql`. The SQL checks required dependencies and function grants during installation. It has not been executed against a Supabase instance in this workspace.
- Prescriptions still lack full immutable versioning and explicit dose/route/frequency/duration fields.

### High: audit coverage and actor attribution are incomplete

- SQL triggers log mutations on selected tables, but the generic audit function relies on `auth.uid()`. Custom-session service-role writes therefore commonly leave `performed_by` null.
- Audit is row-change oriented; access/view/export/sharing events, reason/break-glass context, and tamper-resistant privileged operations are not consistently represented.
- Some high-impact tables/API actions are not covered by the initial audit trigger set. Audit rows are not protected from service-role or database-owner operations by an external immutable archive.

### High: dashboards and workflow labels can misrepresent operations

- `src/app/api/institution/dashboard/route.ts` returns fixed/derived values including 60 assumed beds, a 14-minute wait, and claims calculated as a percentage of revenue; active episodes are used as an occupancy proxy. These are not operational measurements and should not be presented as real metrics.
- Dashboard requests perform repeated per-day/per-month queries and load rows into application code for counting; these patterns will not scale well.
- Episode statuses and prescription/payment flows have evolved in migrations and handlers, with duplicated or inconsistent state rules. Workflow changes need centralized transition rules and transactional downstream effects.

### Medium: clinical and operational coverage remains partial

- Patient data is a limited demographic/profile record; there is no unified longitudinal event timeline, duplicate/merge workflow, consent system, structured terminology, or patient-controlled sharing.
- Triage, appointments, hospital-wide queues, nursing/MAR, admissions, beds, imaging, theatre, structured referrals/discharge, insurance claims, reporting pipeline, offline sync, workflow/automation engine, and integration registry were not found as complete modules.
- Laboratory is a basic request/result workflow without sample lifecycle, validation/release, reference ranges, critical-result handling, or correction history.
- Inventory tracks drug quantities and movements, but not batches, expiry/FEFO, receiving/transfers/counts, non-drug stock, or equipment/assets.
- Large API reads generally have no pagination contract; validation is mixed between ad hoc checks and Zod helpers. No rate-limiting layer or centralized API error/authorization middleware was identified.

## Architecture Decision

Treat tenant isolation and authorization as the enabling foundation, not as one more UI module. Add new work incrementally around existing entities and workflows. Do not run destructive schema changes or enable a new tenant model in-place until legacy data has been backfilled and verified.

## Recommended Phase 1 Sequence

1. **Establish a test baseline:** add focused API/service tests and fixtures for the current patient, episode, and inventory paths; record current build/lint status.
2. **Define tenant hierarchy and identity mapping:** organization, facility/branch, department, staff membership, and explicit organization/facility context. Preserve current institution IDs and provide a reversible backfill/mapping.
3. **Create authorization primitives:** permission catalog, role-permission assignments, staff-facility membership, and server-side `authorize`/tenant-scoping helpers. Keep current roles mapped to initial permission bundles during transition.
4. **Close read boundaries before expanding:** add tests proving cross-facility denial, then migrate API handlers to scoped queries and narrow column selection. Change database RLS policies only after application/service identities and legacy access patterns are understood.
5. **Move service-role access behind a server-only repository/service boundary:** prevent accidental browser imports; require an authorized actor and tenant context for each sensitive operation.
6. **Continue repairing high-impact workflows:** add database-backed tests for the unified dispense path, enforce prescription status/quantity invariants across every route, and record actor-aware audit events.
7. **Continue securing QR access:** the portal PIN gate and rate limit are implemented; next replace reusable QR identifiers with revocable/scoped tokens, close direct API read paths, and record dedicated access audit events for allowed and denied access.
8. **Make migration rollout additive and reversible:** add new tables/columns/indexes, backfill in batches, dual-read/verify where needed, and retain legacy fields until explicit reconciliation and cutover approval.

## Baseline Check

- `npm.cmd run lint` completed successfully during this audit.
- `node_modules\\.bin\\tsc.cmd --noEmit` completed successfully after excluding the copied dependency tree from TypeScript input.
- Lint and TypeScript checks passed after the PIN-gated portal changes.
- The `npm run lint` invocation through PowerShell was blocked by local script execution policy; using the Windows `.cmd` shim worked.
- `npm.cmd run build` returned only the Next.js startup banner, so the build result could not be confirmed.
- The new database migrations have not been applied or executed against a Supabase instance in this workspace.
- No full production-readiness, database-policy, penetration, performance, or end-to-end verification has been performed. Environment-specific Supabase behavior still requires testing against a non-production project.

## Coverage Note

This assessment covers the application structure, all discovered migration filenames, core schema and RLS definitions, and representative handlers that control authentication, patient access, QR/PIN, episodes, laboratory, pharmacy/inventory, notifications, and dashboards. It is an evidence-based Phase 0 baseline; production readiness requires the focused automated and database-backed tests in the sequence above.