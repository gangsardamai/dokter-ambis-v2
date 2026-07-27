begin;

-- Keep uq_payment_accounts_default from migration 0072 and remove its duplicate.
drop index if exists public.uq_payment_accounts_single_default;

commit;
