# Generalized Drive ownership migration v2 — implementation status

Status: **DRAFT / READ-ONLY SCAFFOLD; NOT PRODUCTION READY**.

## What's changed
- One OIDC-authenticated endpoint accepts a manifest for any of the **14 explicitly allowlisted course/root pairs**.
- Checks row, lesson and course IDs, matching Google Drive IDs, exact source reference and absence of target reference.
- Checks references across both `lesson_files.file_path` and `videos.provider_video_id` to fail closed on unexpected reuse.
- Up to 10 manifest rows; a GitHub Actions workflow runs a **preview only**.
- Does not copy, rename, delete or change Google Drive permissions.

## Critical remaining engineering (must complete before enabling migration)
1. Implement trusted server-side Drive API identity: verify source and copy through Drive **file ID**, actual owner, same parent folder and parent chain back to the allowlisted root, MIME/size/checksum where available, 2026 relevance, and complete effective ACL equality. Do not trust self-reported caller attestations.
2. Before copy, reconcile existing copies to avoid duplicates; store durable source_id -> copy_id mapping, parent and batch checkpoint. Copy serially with actual quota accounting (<=10 files, <=1 GB per run, <=45 minutes).
3. Audit every DB reference by **exact ID**, including reuse across lessons/courses, and ensure expected target set is complete. A reused source requires a complete multi-row manifest, not silent single-row replacement.
4. Implement DB transaction + advisory lock scoped by course, atomic compare-and-swap updates of `lesson_files.file_path` and `videos.provider_video_id`, postflight ref counts, and rollback on any mismatch. An external Drive copy cannot be rolled back by Postgres; retain copy ID and checkpoint on failure.
5. For permissions, *read-only equality checks*. Never update ACL. Never delete, move, trash or rename the original, even after migration succeeds.
6. Add idempotence tests (already migrated, incomplete manifest, cross-course reuse, mismatched checksum, changed ACL, stale refs, empty root, ambiguous year, concurrent runs, source >1GB and retry). Test with one additional UNEJ Blok 8 folder before expansion.
7. Validate that automations use the new verified workflow. Existing pilot functions stay unchanged.

## Safety
Do not set `DRIVE_MIGRATION_V2_ENABLED=true` as a workaround. **The endpoint explicitly refuses all writes even if this flag is true** until real Drive verification code is implemented and tested.
OIDC restricted to repository ID, owner actor ID, main branch, and exact workflow path. No generic SQL execution; no user-token writes.
Do not send private Drive IDs or ownership/ACL metadata to public issues.

## Next pilot
UNEJ Blok 8: Anatomi Organ Kardiovaskular. Audit source/copy and ACL via authenticated Drive API first, then verify exact website reference changes in preproduction before any production move.

Current outcome: source code and workflow committed to a feature branch; no Edge Function deployment or database update was performed.
