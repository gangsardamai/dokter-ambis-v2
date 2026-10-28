# Ownership migration v2 — scoped serial executor

Status: **IMPLEMENTED IN DRAFT PR, NOT DEPLOYED OR END-TO-END VERIFIED** (28 October 2026).

## What is now implemented in code
- One GitHub OIDC-authorized workflow with explicit preview/migrate action.
- One Supabase Edge Function for all 14 explicitly allowlisted course/root pairs.
- Serial Drive copy or reuse using `appProperties.ownership_source_id` (idempotence).
- All sources in a session must share one parent, maximum 10 source IDs and 1 GB.
- Drive metadata checks: real source owner is not main, copy owner is main, same parent, equal MIME/size/checksum (where available), exact name and verified folder ancestry.
- Read-only Google Drive permissions comparison. No permission modifications, no original deletes, and no original renaming.
- Exact-reference checks across `lesson_files.file_path` and `videos.provider_video_id`, including exhaustive reuse protection within the course.
- Atomic Postgres compare-and-swap updates in a transaction with course-level advisory lock, plus postflight audit and rollback.
- Manifest `next: "AUTO"` resolves to actual copy IDs after Drive verification; an explicit next ID also supported.
- Retry of an interrupted copy discovers existing annotated copy; ambiguous duplicates are stopped.
- UNRAM Kedokteran Keluarga root remains blocked until year 2026 is confirmed.

## Configuration missing / validation gates
- The Edge Function has **not** been deployed. It needs a restricted Google OAuth identity with the main account and secrets `DRIVE_MIGRATION_CLIENT_ID`, `DRIVE_MIGRATION_CLIENT_SECRET`, `DRIVE_MIGRATION_REFRESH_TOKEN`, plus `SUPABASE_DB_URL`. Do not expose OAuth secrets in public GitHub or chat.
- Keep `DRIVE_MIGRATION_V2_ENABLED` unset until independent pilot end-to-end validation.
- Verify Drive copy behavior, ACL enumeration, copy owner, appProperties, source ownership and Google Drive API permission inheritance in a safe pilot. Differing permissions block the migration automatically.
- Test intentional failed migration after creating a copy, safe retry, concurrent operations, pagination, cross-course reuse, ID collisions, and the 1 GB cutoff.
- Inspect results of CI and security review before merging into main or deploying the function.
- The previous pilot functions are unchanged. No automatic schedule should call v2 until a verified deployment passes.
- Current permissions may prevent migration where copied-file ACLs are not equivalent. As requested, the code never changes permissions automatically.

## Example request manifest
```json
{
  "action": "migrate",
  "manifest": {
    "course": "<allowlisted-course-uuid>",
    "root": "<matching-allowlisted-root-id>",
    "entries": [
      {"kind":"video","row":"<video-row-uuid>","lesson":"<lesson-uuid>","old":"<source-drive-id>","next":"AUTO"}
    ]
  }
}
```
Only the repository owner GitHub Actions identity can invoke the deployed endpoint. Do not place actual file IDs or student data into public issues.

**The draft PR implements a candidate execution path, not evidence that production migration has worked.**
