# Leader access audit — 23 September 2026

This change builds on `feature/leader-scoped-admin` (42d5835), which already contains the Leader management UI and five database migrations. Those five migrations were present in the inspected database. No production changes were applied during this audit.

## Findings and corrections

| Finding | Correction |
| --- | --- |
| Course scope could authorize parent edits and university-wide announcements | Separate ancestor visibility from organization/program management authority |
| Enrollment guard rejected legitimate Leader updates | Validate scope, activation transitions and immutable financial fields |
| Insert with RETURNING ran before automatic creator scope became visible | Atomic invoker RPC inserts, then reads after scope assignment |
| Announcement and target updates could partially succeed | One transactional RPC validates and saves all targets |
| Leader login fell through; Leader replies violated sender constraint | Shared role destination helper, sender constraint and answered-thread synchronization |
| Actor columns did not provide an event history | Restricted audit event table, triggers and paginated admin viewer |
| Repeated permission queries and unnecessary dashboard requests | Request-local permission/scope caching and permission-gated counts/inbox queries |
| Phone lookup lacked matching expression index | Partial normalized-phone index |

Organization assignments include descendant programs/courses. Program assignments include descendant courses. Course assignments permit reading parent labels, but do not authorize editing parents or broadcasting to the whole university. Newly created master records grant creator scope atomically. Independent direct assignments remain effective when a different parent assignment is removed.

## Verification

`npm run test:leader` runs 49 database access/transaction tests plus five role destination tests. The database tests use ephemeral PGlite PostgreSQL with a structural snapshot of the inspected schema and synthetic accounts. Fixtures contain schema definitions and grants, not production user rows or credentials. Tests cover cross-scope access, role escalation, permission revocation, inactive Leaders, enrollment price protection, atomic announcements, message replies, creator scope and restricted audit visibility.

`npm run lint` and a production `npm run build` passed locally. The build uses placeholder public Supabase variables and is not an authenticated browser test. Real Supabase integration, authenticated browser flows and production query plans remain deployment checks.

## Release order

1. Run CI and review the migration against the current database state.
2. Apply `20260923035411_leader_access_integrity.sql` after the five existing Leader migrations and before publishing the application code that uses its RPCs.
3. Verify real Admin/Leader/Student/Mentor sessions, scope/permission revocation and creation flows in a preview environment.
4. Publish only after those checks pass; monitor request failures and audit events.

Do not roll back by restoring the former permissive policies. If application rollback is required, retain the narrower database access controls and assess RPC compatibility separately.
