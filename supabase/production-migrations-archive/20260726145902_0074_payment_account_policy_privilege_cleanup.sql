-- Archived from production migration history.
-- Production version: 20260726145902
-- Production name: 0074_payment_account_policy_privilege_cleanup
-- Intentionally stored outside supabase/migrations so migration tooling does not replay it.

-- 0074 companion cleanup discovered during post-migration verification

-- Remove the older broader SELECT policy so only the status-scoped policy remains.
drop policy if exists payment_accounts_select on public.payment_accounts;

-- Application roles do not require schema-maintenance privileges.
revoke truncate, references, trigger
on public.courses,
   public.enrollments,
   public.payments,
   public.lesson_message_threads,
   public.lesson_message_entries,
   public.payment_accounts
from authenticated, anon;

-- Anonymous users have no direct access to private enrollment/payment/message/account tables.
revoke all
on public.enrollments,
   public.payments,
   public.lesson_message_threads,
   public.lesson_message_entries,
   public.payment_accounts
from anon;

-- Preserve only the intended application operations.
grant select, insert, update, delete on public.courses to authenticated;
grant select, insert, update on public.enrollments to authenticated;
grant select, insert, update on public.payments to authenticated;
grant select, insert on public.lesson_message_threads to authenticated;
grant update (status) on public.lesson_message_threads to authenticated;
grant select, insert on public.lesson_message_entries to authenticated;
grant select, insert, update, delete on public.payment_accounts to authenticated;
