create or replace function private.guard_student_enrollment_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if private.is_active_leader() then return new; end if;
  if private.is_active_admin() then return new; end if;
  if current_setting('app.promotion_checkout', true) = 'on' then return new; end if;

  if (select auth.uid()) is null
     or old.profile_id <> (select auth.uid()) then
    raise exception 'Enrollment hanya dapat diubah oleh pemilik atau admin.'
      using errcode = '42501';
  end if;

  if old.status = 'active'::public.enrollment_status
     and new.status = old.status
     and new.whatsapp_joined_at is distinct from old.whatsapp_joined_at then
    if (to_jsonb(new) - array['whatsapp_joined_at','updated_at'])
       is distinct from
       (to_jsonb(old) - array['whatsapp_joined_at','updated_at']) then
      raise exception 'Kolom enrollment yang dilindungi tidak boleh diubah peserta.'
        using errcode = '42501';
    end if;
    return new;
  end if;

  if old.status not in (
       'pending_payment'::public.enrollment_status,
       'pending_approval'::public.enrollment_status
     )
     or new.status <> 'pending_approval'::public.enrollment_status then
    raise exception 'Perubahan status enrollment tidak diizinkan.'
      using errcode = '42501';
  end if;

  if row(
       new.id,new.profile_id,new.course_id,new.category,new.payment_timing,
       new.price_snapshot,new.enrolled_at,new.activated_at,new.expired_at,
       new.created_at,new.promotion_id,new.promotion_code_snapshot,
       new.promotion_name_snapshot,new.discount_amount,new.whatsapp_joined_at
     ) is distinct from row(
       old.id,old.profile_id,old.course_id,old.category,old.payment_timing,
       old.price_snapshot,old.enrolled_at,old.activated_at,old.expired_at,
       old.created_at,old.promotion_id,old.promotion_code_snapshot,
       old.promotion_name_snapshot,old.discount_amount,old.whatsapp_joined_at
     ) then
    raise exception 'Kolom enrollment yang dilindungi tidak boleh diubah peserta.'
      using errcode = '42501';
  end if;

  return new;
end;
$function$;

create or replace function private.guard_leader_enrollment_write()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  c public.courses;
  current_payment_status public.payment_status;
begin
  if not private.is_active_leader() then return new; end if;

  if not private.leader_can_manage_course_for(new.course_id, 'manage_enrollment') then
    raise exception 'Enrollment di luar scope Leader.' using errcode = '42501';
  end if;

  if tg_op = 'INSERT' then
    select * into c from public.courses where id = new.course_id;

    if c.status <> 'active'
       or not exists (
         select 1 from public.profiles
         where id = new.profile_id
           and role = 'student'
           and status = 'active'
       )
       or new.price_snapshot is distinct from
          (case when c.is_free then 0 else c.price end)
       or new.discount_amount <> 0
       or new.promotion_id is not null
       or new.promotion_code_snapshot is not null
       or new.promotion_name_snapshot is not null
       or new.activated_at is not null
       or new.expired_at is not null
       or new.status is distinct from
          (case
             when new.payment_timing = 'deferred'
               then 'pending_approval'::public.enrollment_status
             else 'pending_payment'::public.enrollment_status
           end) then
      raise exception 'Data awal enrollment tidak valid.' using errcode = '42501';
    end if;
    return new;
  end if;

  if (to_jsonb(new) - array[
        'status','category','payment_timing','activated_at',
        'whatsapp_joined_at','updated_at'
      ])
     is distinct from
     (to_jsonb(old) - array[
        'status','category','payment_timing','activated_at',
        'whatsapp_joined_at','updated_at'
      ]) then
    raise exception 'Leader tidak dapat mengubah identitas, harga, masa akses atau data enrollment yang dilindungi.'
      using errcode = '42501';
  end if;

  if new.whatsapp_joined_at is distinct from old.whatsapp_joined_at
     and new.status is not distinct from old.status
     and new.category is not distinct from old.category
     and new.payment_timing is not distinct from old.payment_timing
     and new.activated_at is not distinct from old.activated_at then
    return new;
  end if;

  if new.payment_timing is distinct from old.payment_timing then
    if old.payment_timing <> 'upfront'::public.payment_timing
       or new.payment_timing <> 'deferred'::public.payment_timing then
      raise exception 'Leader hanya dapat mengubah Bayar di Awal menjadi Bayar di Akhir.'
        using errcode = '42501';
    end if;

    select * into c from public.courses where id = old.course_id;

    if c.payment_policy <> 'upfront_or_deferred'::public.payment_policy then
      raise exception 'Course ini tidak menyediakan pembayaran di akhir.'
        using errcode = '22023';
    end if;

    select p.status into current_payment_status
    from public.payments p where p.enrollment_id = old.id;

    if old.status = 'active'::public.enrollment_status
       or current_payment_status = 'approved'::public.payment_status then
      new.status := 'active'::public.enrollment_status;
      new.activated_at := coalesce(old.activated_at, now());
    else
      new.status := 'pending_approval'::public.enrollment_status;
      new.activated_at := null;
    end if;
    return new;
  end if;

  if new.status is distinct from old.status then
    if new.status = 'active'::public.enrollment_status
       and old.status in (
         'pending_payment'::public.enrollment_status,
         'pending_approval'::public.enrollment_status
       ) then
      new.activated_at := coalesce(old.activated_at, now());
    elsif new.status = 'pending_payment'::public.enrollment_status
       and old.status = 'pending_approval'::public.enrollment_status
       and old.payment_timing = 'upfront'::public.payment_timing
       and exists (
         select 1 from public.payments p
         where p.enrollment_id = old.id
           and p.status = 'rejected'::public.payment_status
       ) then
      new.activated_at := null;
    elsif new.status = 'cancelled'::public.enrollment_status
       and old.status in (
         'pending_payment'::public.enrollment_status,
         'pending_approval'::public.enrollment_status,
         'active'::public.enrollment_status
       ) then
      new.activated_at := null;
    else
      raise exception 'Perubahan status enrollment tidak diizinkan untuk Leader.'
        using errcode = '42501';
    end if;
  elsif new.activated_at is distinct from old.activated_at then
    raise exception 'Waktu aktivasi tidak dapat diubah Leader secara langsung.'
      using errcode = '42501';
  end if;

  return new;
end;
$function$;
