begin;

-- A reply from any staff role resolves the student's current question.
-- A later student reply re-opens the thread automatically.
create or replace function public.sync_lesson_message_thread_after_entry()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.lesson_message_threads
  set
    status = case
      when new.sender_role in ('admin', 'mentor', 'leader') then 'answered'
      else 'open'
    end,
    last_message_at = new.created_at,
    updated_at = now()
  where id = new.thread_id;

  return new;
end;
$$;

revoke all on function public.sync_lesson_message_thread_after_entry() from public;

-- For staff, the dashboard badge represents unanswered student messages,
-- not messages that another staff member has already handled.
-- Students still receive unread notifications for staff replies.
create or replace function public.count_unread_lesson_messages()
returns bigint
language sql
stable
security invoker
set search_path = public
as $$
  select count(*)
  from public.lesson_message_entries e
  join public.lesson_message_threads t on t.id = e.thread_id
  left join public.lesson_message_thread_reads r
    on r.thread_id = e.thread_id
   and r.profile_id = (select auth.uid())
  where e.created_at > coalesce(r.last_read_at, '-infinity'::timestamptz)
    and (
      (
        (select public.current_profile_role()) = 'student'
        and e.sender_profile_id <> (select auth.uid())
      )
      or
      (
        (select public.current_profile_role()) in ('admin', 'mentor', 'leader')
        and t.status = 'open'
        and e.sender_role = 'student'
      )
    );
$$;

revoke all on function public.count_unread_lesson_messages() from public;
grant execute on function public.count_unread_lesson_messages() to authenticated;

commit;
