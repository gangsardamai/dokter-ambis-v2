begin;

revoke all on function private.can_manage_tryout_image_object(text) from public;
grant execute on function private.can_manage_tryout_image_object(text) to authenticated;

commit;
