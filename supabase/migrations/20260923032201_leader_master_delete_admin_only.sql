
drop policy if exists organizations_staff_delete on public.organizations;
create policy organizations_staff_delete
on public.organizations
for delete to authenticated
using ((select private.is_active_admin()));

drop policy if exists programs_staff_delete on public.programs;
create policy programs_staff_delete
on public.programs
for delete to authenticated
using ((select private.is_active_admin()));

drop policy if exists courses_staff_delete on public.courses;
create policy courses_staff_delete
on public.courses
for delete to authenticated
using ((select private.is_active_admin()));
