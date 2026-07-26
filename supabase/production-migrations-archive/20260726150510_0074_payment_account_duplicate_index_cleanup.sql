-- Archived from production migration history.
-- Production version: 20260726150510
-- Production name: 0074_payment_account_duplicate_index_cleanup
-- Intentionally stored outside supabase/migrations so migration tooling does not replay it.

-- 0074 companion: keep the pre-existing default-account unique index and remove the duplicate

drop index if exists public.uq_payment_accounts_single_default;
