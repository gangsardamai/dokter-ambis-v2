revoke execute on function public.admin_get_mentor_emails(uuid[]) from public, anon;
revoke execute on function public.admin_get_mentor_directory() from public, anon;
revoke execute on function public.admin_get_mentor_detail(uuid) from public, anon;
revoke execute on function public.admin_set_mentor_assignment(uuid, uuid, boolean) from public, anon;
revoke execute on function public.admin_set_mentor_rating_enabled(uuid, boolean) from public, anon;
revoke execute on function public.get_course_mentor_rating_context(uuid) from public, anon;
revoke execute on function public.save_mentor_review(uuid, uuid, integer, text) from public, anon;
revoke execute on function public.mentor_get_rating_dashboard() from public, anon;
revoke execute on function public.mentor_get_course_reviews(uuid) from public, anon;

grant execute on function public.admin_get_mentor_emails(uuid[]) to authenticated;
grant execute on function public.admin_get_mentor_directory() to authenticated;
grant execute on function public.admin_get_mentor_detail(uuid) to authenticated;
grant execute on function public.admin_set_mentor_assignment(uuid, uuid, boolean) to authenticated;
grant execute on function public.admin_set_mentor_rating_enabled(uuid, boolean) to authenticated;
grant execute on function public.get_course_mentor_rating_context(uuid) to authenticated;
grant execute on function public.save_mentor_review(uuid, uuid, integer, text) to authenticated;
grant execute on function public.mentor_get_rating_dashboard() to authenticated;
grant execute on function public.mentor_get_course_reviews(uuid) to authenticated;
