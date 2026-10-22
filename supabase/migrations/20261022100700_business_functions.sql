-- Business operations. Clients never insert registrations, bookings, payments or subscriptions
-- directly; they call these functions, which validate everything on the server (spec 1.2, 13.3).
-- Functions that only trusted server code may call check public.is_service_role().

-- ===========================================================================
-- Holds and expiry
-- ===========================================================================

-- Releases seats and slots whose payment window has passed.
create function public.expire_stale_holds()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.event_registrations
     set status = 'expired', hold_expires_at = null
   where status = 'pending_payment' and hold_expires_at <= now();

  update public.consultation_bookings
     set status = 'expired', hold_expires_at = null
   where status = 'pending_payment' and hold_expires_at <= now();

  update public.payments
     set status = 'expired'
   where status = 'pending' and expires_at <= now();
end;
$$;

-- ===========================================================================
-- Payments: shared helpers
-- ===========================================================================

create function public.create_pending_payment(
  p_user_id uuid,
  p_provider public.payment_provider,
  p_amount_cents integer,
  p_description text,
  p_expires_at timestamptz,
  p_registration_id uuid default null,
  p_booking_id uuid default null,
  p_subscription_id uuid default null
)
returns public.payments
language sql
security definer
set search_path = ''
as $$
  insert into public.payments (user_id, provider, amount_cents, description, expires_at,
                               event_registration_id, consultation_booking_id, subscription_id)
  values (p_user_id, p_provider, p_amount_cents, p_description, p_expires_at,
          p_registration_id, p_booking_id, p_subscription_id)
  returning *;
$$;

-- Applies a successful payment to whatever it pays for. Never raises for business conflicts:
-- the money has arrived, so conflicts are flagged with needs_review for an admin instead.
create function public.apply_payment_success(p_payment_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_pay public.payments;
  v_reg public.event_registrations;
  v_event public.events;
  v_booking public.consultation_bookings;
  v_sub public.subscriptions;
  v_plan public.membership_plans;
  v_start timestamptz;
  v_review text;
begin
  select * into v_pay from public.payments where id = p_payment_id;

  if v_pay.event_registration_id is not null then
    select * into v_reg from public.event_registrations where id = v_pay.event_registration_id for update;
    select * into v_event from public.events where id = v_reg.event_id for update;
    if v_reg.status = 'confirmed' then
      null;
    elsif v_reg.status = 'cancelled' then
      v_review := 'registration_cancelled_before_payment';
    elsif v_reg.status = 'expired'
          and v_event.capacity is not null
          and public.event_seats_taken(v_event.id) >= v_event.capacity then
      v_review := 'seat_no_longer_available';
    else
      begin
        update public.event_registrations
           set status = 'confirmed', confirmed_at = now(), hold_expires_at = null
         where id = v_reg.id;
      exception when unique_violation then
        v_review := 'duplicate_registration';
      end;
    end if;

  elsif v_pay.consultation_booking_id is not null then
    select * into v_booking from public.consultation_bookings
     where id = v_pay.consultation_booking_id for update;
    if v_booking.status = 'confirmed' then
      null;
    elsif v_booking.status in ('pending_payment', 'expired') then
      begin
        update public.consultation_bookings
           set status = 'confirmed', confirmed_at = now(), hold_expires_at = null
         where id = v_booking.id;
      exception when exclusion_violation then
        v_review := 'slot_no_longer_available';
      end;
    else
      v_review := 'booking_' || v_booking.status::text || '_before_payment';
    end if;

  elsif v_pay.subscription_id is not null and v_pay.provider = 'bank_transfer' then
    -- One confirmed bank transfer = one billing period. Renewals extend from the current end.
    select * into v_sub from public.subscriptions where id = v_pay.subscription_id for update;
    select * into v_plan from public.membership_plans where id = v_sub.plan_id;
    v_start := case
      when v_sub.status = 'active' and v_sub.current_period_end > now() then v_sub.current_period_end
      else now()
    end;
    begin
      update public.subscriptions
         set status = 'active',
             current_period_start = case when status = 'active' and current_period_end > now()
                                         then current_period_start else v_start end,
             current_period_end = v_start + case v_plan.billing_interval
                                              when 'year' then interval '1 year'
                                              else interval '1 month' end,
             canceled_at = null,
             ended_at = null
       where id = v_sub.id;
    exception when unique_violation then
      v_review := 'another_live_subscription_exists';
    end;
  end if;

  if v_review is not null then
    update public.payments set needs_review = true, review_reason = v_review where id = v_pay.id;
  end if;
end;
$$;

-- Releases what a pending payment was holding.
create function public.release_payment_hold(p_payment_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_pay public.payments;
begin
  select * into v_pay from public.payments where id = p_payment_id;

  update public.event_registrations
     set status = 'expired', hold_expires_at = null
   where id = v_pay.event_registration_id and status = 'pending_payment';

  update public.consultation_bookings
     set status = 'expired', hold_expires_at = null
   where id = v_pay.consultation_booking_id and status = 'pending_payment';

  update public.subscriptions s
     set status = 'expired', ended_at = now()
   where s.id = v_pay.subscription_id
     and s.status = 'pending_bank_transfer'
     and not exists (select 1 from public.payments p
                      where p.subscription_id = s.id and p.status in ('pending', 'succeeded')
                        and p.id <> v_pay.id);
end;
$$;

-- ===========================================================================
-- Payments: entry points
-- ===========================================================================

-- Stripe webhook (checkout.session.completed / payment_intent.succeeded). Service role only.
-- Idempotent: a repeated call for an already succeeded payment does nothing.
create function public.mark_payment_succeeded(
  p_payment_id uuid,
  p_amount_cents integer,
  p_stripe_payment_intent_id text default null,
  p_stripe_checkout_session_id text default null
)
returns public.payments
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_pay public.payments;
begin
  if not public.is_service_role() then
    raise exception using errcode = 'P0001', message = 'forbidden';
  end if;

  select * into v_pay from public.payments where id = p_payment_id for update;
  if not found then
    raise exception using errcode = 'P0001', message = 'payment_not_found';
  end if;
  if v_pay.status in ('succeeded', 'refunded', 'partially_refunded') then
    return v_pay;
  end if;
  if p_amount_cents is distinct from v_pay.amount_cents then
    raise exception using errcode = 'P0001', message = 'amount_mismatch';
  end if;

  update public.payments
     set status = 'succeeded',
         paid_at = now(),
         stripe_payment_intent_id = coalesce(p_stripe_payment_intent_id, stripe_payment_intent_id),
         stripe_checkout_session_id = coalesce(p_stripe_checkout_session_id, stripe_checkout_session_id)
   where id = p_payment_id;

  perform public.apply_payment_success(p_payment_id);
  select * into v_pay from public.payments where id = p_payment_id;
  return v_pay;
end;
$$;

-- Admin confirms that a bank transfer arrived (spec decision: pending until an admin confirms).
create function public.confirm_bank_transfer(p_payment_id uuid, p_note text default null)
returns public.payments
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_pay public.payments;
begin
  if not public.is_admin() then
    raise exception using errcode = 'P0001', message = 'forbidden';
  end if;

  select * into v_pay from public.payments where id = p_payment_id for update;
  if not found or v_pay.provider <> 'bank_transfer' then
    raise exception using errcode = 'P0001', message = 'payment_not_found';
  end if;
  if v_pay.status = 'succeeded' then
    return v_pay;
  end if;
  if v_pay.status not in ('pending', 'expired', 'cancelled', 'failed') then
    raise exception using errcode = 'P0001', message = 'payment_not_confirmable';
  end if;

  update public.payments
     set status = 'succeeded', paid_at = now(), confirmed_by = auth.uid(),
         admin_note = coalesce(p_note, admin_note)
   where id = p_payment_id;

  perform public.apply_payment_success(p_payment_id);
  select * into v_pay from public.payments where id = p_payment_id;
  return v_pay;
end;
$$;

-- Failed, cancelled or abandoned payment (Stripe webhook, or an admin rejecting a transfer).
create function public.mark_payment_failed(
  p_payment_id uuid,
  p_status public.payment_status default 'failed',
  p_reason text default null
)
returns public.payments
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_pay public.payments;
begin
  perform public.require_admin_or_service();
  if p_status not in ('failed', 'cancelled', 'expired') then
    raise exception using errcode = 'P0001', message = 'invalid_status';
  end if;

  select * into v_pay from public.payments where id = p_payment_id for update;
  if not found then
    raise exception using errcode = 'P0001', message = 'payment_not_found';
  end if;
  if v_pay.status <> 'pending' then
    return v_pay; -- late or repeated notification; never downgrade a settled payment
  end if;

  update public.payments
     set status = p_status, failed_at = now(), failure_reason = p_reason
   where id = p_payment_id;
  perform public.release_payment_hold(p_payment_id);

  select * into v_pay from public.payments where id = p_payment_id;
  return v_pay;
end;
$$;

-- Records a refund made in Stripe or by bank. Cancelling the registration/booking is a separate step.
create function public.record_refund(p_payment_id uuid, p_refunded_amount_cents integer)
returns public.payments
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_pay public.payments;
begin
  perform public.require_admin_or_service();
  select * into v_pay from public.payments where id = p_payment_id for update;
  if not found or v_pay.status not in ('succeeded', 'partially_refunded', 'refunded') then
    raise exception using errcode = 'P0001', message = 'payment_not_refundable';
  end if;
  if p_refunded_amount_cents <= 0 or p_refunded_amount_cents > v_pay.amount_cents then
    raise exception using errcode = 'P0001', message = 'invalid_amount';
  end if;

  update public.payments
     set refunded_amount_cents = p_refunded_amount_cents,
         refunded_at = now(),
         status = case when p_refunded_amount_cents = amount_cents then 'refunded'
                       else 'partially_refunded' end::public.payment_status,
         needs_review = false
   where id = p_payment_id
  returning * into v_pay;
  return v_pay;
end;
$$;

-- Flags a paid item that was cancelled, so an admin decides about a refund (spec 6.5).
create function public.flag_paid_for_refund_decision(p_registration_id uuid, p_booking_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.payments
     set needs_review = true, review_reason = 'cancelled_after_payment_refund_decision'
   where status = 'succeeded'
     and ((p_registration_id is not null and event_registration_id = p_registration_id)
       or (p_booking_id is not null and consultation_booking_id = p_booking_id));

  update public.payments
     set status = 'cancelled', failed_at = now(), failure_reason = 'cancelled_by_customer'
   where status = 'pending'
     and ((p_registration_id is not null and event_registration_id = p_registration_id)
       or (p_booking_id is not null and consultation_booking_id = p_booking_id));
$$;

-- ===========================================================================
-- Events
-- ===========================================================================

create function public.register_for_event(
  p_event_id uuid,
  p_payment_method public.payment_provider default null
)
returns table (
  registration_id uuid,
  status public.registration_status,
  payment_id uuid,
  amount_cents integer,
  bank_reference text,
  hold_expires_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := public.require_active_user();
  v_cfg public.app_settings := public.app_setting();
  v_event public.events;
  v_reg public.event_registrations;
  v_pay public.payments;
  v_method public.payment_provider;
  v_hold timestamptz;
begin
  -- Lock the event row: concurrent registrations for the same event queue up here,
  -- so the capacity check below cannot be raced.
  select * into v_event from public.events where id = p_event_id for update;
  if not found or v_event.status <> 'published' then
    raise exception using errcode = 'P0001', message = 'event_not_found';
  end if;
  if v_event.starts_at <= now()
     or (v_event.registration_deadline is not null and v_event.registration_deadline <= now()) then
    raise exception using errcode = 'P0001', message = 'registration_closed';
  end if;
  if v_event.registration_opens_at is not null and v_event.registration_opens_at > now() then
    raise exception using errcode = 'P0001', message = 'registration_not_open_yet';
  end if;

  update public.event_registrations r
     set status = 'expired', hold_expires_at = null
   where r.event_id = p_event_id and r.status = 'pending_payment' and r.hold_expires_at <= now();

  select * into v_reg from public.event_registrations r
   where r.event_id = p_event_id and r.user_id = v_uid and r.status in ('pending_payment', 'confirmed');
  if found then
    if v_reg.status = 'confirmed' then
      raise exception using errcode = 'P0001', message = 'already_registered';
    end if;
    -- Unfinished checkout: hand back the same registration and payment so the user can resume.
    select * into v_pay from public.payments p
     where p.event_registration_id = v_reg.id and p.status = 'pending'
     order by p.created_at desc limit 1;
    return query select v_reg.id, v_reg.status, v_pay.id, v_pay.amount_cents, v_pay.bank_reference, v_reg.hold_expires_at;
    return;
  end if;

  if v_event.capacity is not null and public.event_seats_taken(p_event_id) >= v_event.capacity then
    raise exception using errcode = 'P0001', message = 'event_full';
  end if;

  if v_event.price_cents = 0 then
    insert into public.event_registrations (event_id, user_id, status, price_cents, confirmed_at)
    values (p_event_id, v_uid, 'confirmed', 0, now())
    returning * into v_reg;
    return query select v_reg.id, v_reg.status, null::uuid, 0, null::text, null::timestamptz;
    return;
  end if;

  v_method := coalesce(p_payment_method, 'stripe');
  if v_method = 'bank_transfer' then
    if not v_event.allow_bank_transfer then
      raise exception using errcode = 'P0001', message = 'payment_method_not_allowed';
    end if;
    v_hold := least(now() + make_interval(days => v_cfg.bank_transfer_hold_days), v_event.starts_at);
  else
    v_hold := now() + make_interval(mins => v_cfg.checkout_hold_minutes);
  end if;

  insert into public.event_registrations (event_id, user_id, status, price_cents, payment_method, hold_expires_at)
  values (p_event_id, v_uid, 'pending_payment', v_event.price_cents, v_method, v_hold)
  returning * into v_reg;

  v_pay := public.create_pending_payment(v_uid, v_method, v_event.price_cents, v_event.title, v_hold,
                                         p_registration_id => v_reg.id);

  return query select v_reg.id, v_reg.status, v_pay.id, v_pay.amount_cents, v_pay.bank_reference, v_hold;
end;
$$;

create function public.cancel_event_registration(p_registration_id uuid, p_reason text default null)
returns public.event_registrations
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_reg public.event_registrations;
  v_event public.events;
  v_deadline_hours integer;
begin
  select * into v_reg from public.event_registrations where id = p_registration_id for update;
  if not found or (v_reg.user_id is distinct from v_uid and not public.is_admin()) then
    raise exception using errcode = 'P0001', message = 'registration_not_found';
  end if;
  if v_reg.status not in ('pending_payment', 'confirmed') then
    raise exception using errcode = 'P0001', message = 'registration_not_active';
  end if;

  select * into v_event from public.events where id = v_reg.event_id;
  if not public.is_admin() and v_reg.status = 'confirmed' then
    v_deadline_hours := coalesce(v_event.cancellation_deadline_hours,
                                 (public.app_setting()).event_cancel_deadline_hours);
    if v_event.starts_at - make_interval(hours => v_deadline_hours) <= now() then
      raise exception using errcode = 'P0001', message = 'cancellation_deadline_passed';
    end if;
  end if;

  update public.event_registrations
     set status = 'cancelled', cancelled_at = now(), cancelled_by = v_uid,
         cancellation_reason = p_reason, hold_expires_at = null
   where id = p_registration_id
  returning * into v_reg;

  perform public.flag_paid_for_refund_decision(p_registration_id, null);
  return v_reg;
end;
$$;

-- ===========================================================================
-- Consultations
-- ===========================================================================

-- Free slots for one specialist and service between two local dates (max ~2 months per call).
create function public.consultation_slots(
  p_specialist_id uuid,
  p_consultation_type_id uuid,
  p_from date,
  p_to date,
  p_ignore_booking_id uuid default null
)
returns table (starts_at timestamptz, ends_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  with cfg as (
    select * from public.app_settings where id
  ),
  svc as (
    select t.duration_minutes, t.buffer_minutes
    from public.consultation_types t
    join public.specialist_consultation_types sct
      on sct.consultation_type_id = t.id and sct.specialist_id = p_specialist_id
    join public.specialists s on s.id = sct.specialist_id and s.is_active
    where t.id = p_consultation_type_id and t.is_active
  ),
  days as (
    select d::date as day
    from cfg
    cross join generate_series(
      greatest(p_from, (now() at time zone cfg.timezone)::date),
      least(p_to, p_from + 62, (now() at time zone cfg.timezone)::date + cfg.consultation_max_advance_days),
      interval '1 day') as d
  ),
  candidates as (
    select distinct (local_start at time zone cfg.timezone) as starts_at,
           svc.duration_minutes, svc.buffer_minutes
    from cfg
    cross join svc
    cross join days
    join public.specialist_availability a
      on a.specialist_id = p_specialist_id
     and a.weekday = extract(isodow from days.day)
     and (a.valid_from is null or days.day >= a.valid_from)
     and (a.valid_until is null or days.day <= a.valid_until)
    cross join lateral generate_series(
      days.day + a.start_time,
      days.day + a.end_time - make_interval(mins => svc.duration_minutes),
      make_interval(mins => cfg.consultation_slot_step_minutes)) as local_start
  )
  select c.starts_at, c.starts_at + make_interval(mins => c.duration_minutes) as ends_at
  from candidates c
  cross join cfg
  where c.starts_at >= now() + make_interval(hours => cfg.consultation_min_notice_hours)
    and not exists (
      select 1 from public.consultation_bookings b
      where b.specialist_id = p_specialist_id
        and (p_ignore_booking_id is null or b.id <> p_ignore_booking_id)
        and (b.status = 'confirmed' or (b.status = 'pending_payment' and b.hold_expires_at > now()))
        and b.during && tstzrange(c.starts_at, c.starts_at + make_interval(mins => c.duration_minutes + c.buffer_minutes), '[)'))
    and not exists (
      select 1 from public.specialist_time_off o
      where o.specialist_id = p_specialist_id
        and tstzrange(o.starts_at, o.ends_at, '[)')
            && tstzrange(c.starts_at, c.starts_at + make_interval(mins => c.duration_minutes), '[)'))
  order by 1;
$$;

-- Public entry point for the booking calendar.
create function public.get_available_slots(
  p_specialist_id uuid,
  p_consultation_type_id uuid,
  p_from date,
  p_to date
)
returns table (starts_at timestamptz, ends_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select * from public.consultation_slots(p_specialist_id, p_consultation_type_id, p_from, p_to, null);
$$;

create function public.slot_is_bookable(
  p_specialist_id uuid,
  p_consultation_type_id uuid,
  p_starts_at timestamptz,
  p_ignore_booking_id uuid default null
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.app_settings cfg,
         lateral public.consultation_slots(
           p_specialist_id, p_consultation_type_id,
           (p_starts_at at time zone cfg.timezone)::date,
           (p_starts_at at time zone cfg.timezone)::date,
           p_ignore_booking_id) s
    where cfg.id and s.starts_at = p_starts_at
  );
$$;

create function public.book_consultation(
  p_specialist_id uuid,
  p_consultation_type_id uuid,
  p_starts_at timestamptz,
  p_payment_method public.payment_provider default null,
  p_note text default null
)
returns table (
  booking_id uuid,
  status public.booking_status,
  payment_id uuid,
  amount_cents integer,
  bank_reference text,
  hold_expires_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := public.require_active_user();
  v_cfg public.app_settings := public.app_setting();
  v_type public.consultation_types;
  v_price integer;
  v_method public.payment_provider;
  v_hold timestamptz;
  v_status public.booking_status;
  v_booking public.consultation_bookings;
  v_pay public.payments;
begin
  perform public.expire_stale_holds();

  -- Fast, friendly check against working hours, time off and notice rules.
  if not public.slot_is_bookable(p_specialist_id, p_consultation_type_id, p_starts_at) then
    raise exception using errcode = 'P0001', message = 'slot_unavailable';
  end if;

  select * into v_type from public.consultation_types where id = p_consultation_type_id;
  select coalesce(sct.price_cents_override, v_type.price_cents) into v_price
    from public.specialist_consultation_types sct
   where sct.specialist_id = p_specialist_id and sct.consultation_type_id = p_consultation_type_id;

  if v_price = 0 or not v_type.requires_prepayment then
    v_status := 'confirmed';
  else
    v_status := 'pending_payment';
    v_method := coalesce(p_payment_method, 'stripe');
    if v_method = 'bank_transfer' then
      if not v_type.allow_bank_transfer then
        raise exception using errcode = 'P0001', message = 'payment_method_not_allowed';
      end if;
      v_hold := least(now() + make_interval(days => v_cfg.bank_transfer_hold_days),
                      p_starts_at - interval '2 hours');
      if v_hold <= now() then
        raise exception using errcode = 'P0001', message = 'too_late_for_bank_transfer';
      end if;
    else
      v_hold := now() + make_interval(mins => v_cfg.checkout_hold_minutes);
    end if;
  end if;

  -- The exclusion constraint is the real guard: if another request took the slot a moment ago,
  -- this insert fails instead of double-booking.
  begin
    insert into public.consultation_bookings (
      user_id, specialist_id, consultation_type_id, starts_at, ends_at, blocked_until,
      status, price_cents, payment_method, hold_expires_at, user_note, confirmed_at)
    values (
      v_uid, p_specialist_id, p_consultation_type_id, p_starts_at,
      p_starts_at + make_interval(mins => v_type.duration_minutes),
      p_starts_at + make_interval(mins => v_type.duration_minutes + v_type.buffer_minutes),
      v_status, v_price, v_method, v_hold, p_note,
      case when v_status = 'confirmed' then now() end)
    returning * into v_booking;
  exception when exclusion_violation then
    raise exception using errcode = 'P0001', message = 'slot_unavailable';
  end;

  if v_status = 'pending_payment' then
    v_pay := public.create_pending_payment(v_uid, v_method, v_price, v_type.name, v_hold,
                                           p_booking_id => v_booking.id);
  end if;

  return query select v_booking.id, v_booking.status, v_pay.id, v_pay.amount_cents, v_pay.bank_reference, v_hold;
end;
$$;

create function public.cancel_consultation(p_booking_id uuid, p_reason text default null)
returns public.consultation_bookings
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_booking public.consultation_bookings;
  v_staff boolean;
begin
  select * into v_booking from public.consultation_bookings where id = p_booking_id for update;
  v_staff := public.is_admin() or (found and v_booking.specialist_id = public.my_specialist_id());
  if v_booking.id is null or (v_booking.user_id is distinct from v_uid and not v_staff) then
    raise exception using errcode = 'P0001', message = 'booking_not_found';
  end if;
  if v_booking.status not in ('pending_payment', 'confirmed') then
    raise exception using errcode = 'P0001', message = 'booking_not_active';
  end if;
  if not v_staff and v_booking.status = 'confirmed'
     and v_booking.starts_at - make_interval(hours => (public.app_setting()).consultation_cancel_deadline_hours) <= now() then
    raise exception using errcode = 'P0001', message = 'cancellation_deadline_passed';
  end if;

  update public.consultation_bookings
     set status = 'cancelled', cancelled_at = now(), cancelled_by = v_uid,
         cancellation_reason = p_reason, hold_expires_at = null
   where id = p_booking_id
  returning * into v_booking;

  perform public.flag_paid_for_refund_decision(null, p_booking_id);
  return v_booking;
end;
$$;

create function public.reschedule_consultation(p_booking_id uuid, p_new_starts_at timestamptz)
returns public.consultation_bookings
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_cfg public.app_settings := public.app_setting();
  v_booking public.consultation_bookings;
  v_type public.consultation_types;
  v_staff boolean;
begin
  perform public.expire_stale_holds();

  select * into v_booking from public.consultation_bookings where id = p_booking_id for update;
  v_staff := public.is_admin() or (found and v_booking.specialist_id = public.my_specialist_id());
  if v_booking.id is null or (v_booking.user_id is distinct from v_uid and not v_staff) then
    raise exception using errcode = 'P0001', message = 'booking_not_found';
  end if;
  if v_booking.status <> 'confirmed' then
    raise exception using errcode = 'P0001', message = 'booking_not_active';
  end if;
  if not v_staff then
    if v_booking.starts_at - make_interval(hours => v_cfg.consultation_cancel_deadline_hours) <= now() then
      raise exception using errcode = 'P0001', message = 'cancellation_deadline_passed';
    end if;
    if v_booking.reschedule_count >= v_cfg.consultation_max_reschedules then
      raise exception using errcode = 'P0001', message = 'reschedule_limit_reached';
    end if;
  end if;

  if not public.slot_is_bookable(v_booking.specialist_id, v_booking.consultation_type_id,
                                 p_new_starts_at, p_booking_id) then
    raise exception using errcode = 'P0001', message = 'slot_unavailable';
  end if;

  select * into v_type from public.consultation_types where id = v_booking.consultation_type_id;
  begin
    update public.consultation_bookings
       set starts_at = p_new_starts_at,
           ends_at = p_new_starts_at + make_interval(mins => v_type.duration_minutes),
           blocked_until = p_new_starts_at + make_interval(mins => v_type.duration_minutes + v_type.buffer_minutes),
           reschedule_count = reschedule_count + 1,
           reminder_sent_at = null
     where id = p_booking_id
    returning * into v_booking;
  exception when exclusion_violation then
    raise exception using errcode = 'P0001', message = 'slot_unavailable';
  end;
  return v_booking;
end;
$$;

-- Specialist or admin records how a past appointment went.
create function public.set_booking_outcome(p_booking_id uuid, p_status public.booking_status)
returns public.consultation_bookings
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_booking public.consultation_bookings;
begin
  if p_status not in ('completed', 'no_show') then
    raise exception using errcode = 'P0001', message = 'invalid_status';
  end if;
  select * into v_booking from public.consultation_bookings where id = p_booking_id for update;
  if not found or not (public.is_admin() or v_booking.specialist_id = public.my_specialist_id()) then
    raise exception using errcode = 'P0001', message = 'booking_not_found';
  end if;
  if v_booking.status not in ('confirmed', 'completed', 'no_show') or v_booking.starts_at > now() then
    raise exception using errcode = 'P0001', message = 'booking_not_finished';
  end if;
  update public.consultation_bookings set status = p_status where id = p_booking_id
  returning * into v_booking;
  return v_booking;
end;
$$;

-- ===========================================================================
-- Subscriptions
-- ===========================================================================

-- Starts (or renews) a monthly plan paid by bank transfer. An admin confirming the transfer
-- activates or extends the subscription by one billing period.
create function public.start_bank_transfer_subscription(p_plan_id uuid)
returns table (
  subscription_id uuid,
  payment_id uuid,
  amount_cents integer,
  bank_reference text,
  expires_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := public.require_active_user();
  v_cfg public.app_settings := public.app_setting();
  v_plan public.membership_plans;
  v_sub public.subscriptions;
  v_pay public.payments;
begin
  select * into v_plan from public.membership_plans where id = p_plan_id and is_active;
  if not found then
    raise exception using errcode = 'P0001', message = 'plan_not_found';
  end if;
  if not (v_cfg.subscriptions_allow_bank_transfer and v_plan.allow_bank_transfer) then
    raise exception using errcode = 'P0001', message = 'payment_method_not_allowed';
  end if;

  perform public.expire_stale_holds();

  select * into v_sub from public.subscriptions s
   where s.user_id = v_uid and s.plan_id = p_plan_id
     and s.status in ('pending_bank_transfer', 'incomplete', 'trialing', 'active', 'past_due')
   for update;

  if found then
    if v_sub.provider = 'stripe' then
      raise exception using errcode = 'P0001', message = 'already_subscribed';
    end if;
    select * into v_pay from public.payments p
     where p.subscription_id = v_sub.id and p.status = 'pending'
     order by p.created_at desc limit 1;
    if found then
      return query select v_sub.id, v_pay.id, v_pay.amount_cents, v_pay.bank_reference, v_pay.expires_at;
      return;
    end if;
    if v_sub.status = 'active'
       and v_sub.current_period_end > now() + make_interval(days => v_cfg.subscription_renewal_window_days) then
      raise exception using errcode = 'P0001', message = 'renewal_not_due_yet';
    end if;
  else
    insert into public.subscriptions (user_id, plan_id, provider, status)
    values (v_uid, p_plan_id, 'bank_transfer', 'pending_bank_transfer')
    returning * into v_sub;
  end if;

  v_pay := public.create_pending_payment(
    v_uid, 'bank_transfer', v_plan.price_cents, v_plan.name,
    now() + make_interval(days => v_cfg.bank_transfer_hold_days),
    p_subscription_id => v_sub.id);

  return query select v_sub.id, v_pay.id, v_pay.amount_cents, v_pay.bank_reference, v_pay.expires_at;
end;
$$;

-- Stripe webhook (customer.subscription.created/updated/deleted). Service role only.
create function public.sync_stripe_subscription(
  p_user_id uuid,
  p_stripe_subscription_id text,
  p_stripe_customer_id text,
  p_stripe_price_id text,
  p_status text,
  p_current_period_start timestamptz,
  p_current_period_end timestamptz,
  p_cancel_at_period_end boolean default false,
  p_canceled_at timestamptz default null,
  p_ended_at timestamptz default null
)
returns public.subscriptions
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_plan_id uuid;
  v_status public.subscription_status;
  v_sub public.subscriptions;
begin
  if not public.is_service_role() then
    raise exception using errcode = 'P0001', message = 'forbidden';
  end if;

  select id into v_plan_id from public.membership_plans where stripe_price_id = p_stripe_price_id;
  if v_plan_id is null then
    raise exception using errcode = 'P0001', message = 'plan_not_found';
  end if;

  v_status := case p_status
    when 'incomplete' then 'incomplete'
    when 'incomplete_expired' then 'expired'
    when 'trialing' then 'trialing'
    when 'active' then 'active'
    when 'past_due' then 'past_due'
    when 'canceled' then 'canceled'
    when 'unpaid' then 'unpaid'
    when 'paused' then 'unpaid'
    else null
  end;
  if v_status is null then
    raise exception using errcode = 'P0001', message = 'unknown_stripe_status';
  end if;

  insert into public.stripe_customers (user_id, stripe_customer_id)
  values (p_user_id, p_stripe_customer_id)
  on conflict (user_id) do nothing;

  insert into public.subscriptions (
    user_id, plan_id, provider, status, current_period_start, current_period_end,
    cancel_at_period_end, canceled_at, ended_at, stripe_subscription_id, stripe_customer_id)
  values (
    p_user_id, v_plan_id, 'stripe', v_status, p_current_period_start, p_current_period_end,
    coalesce(p_cancel_at_period_end, false), p_canceled_at, p_ended_at,
    p_stripe_subscription_id, p_stripe_customer_id)
  on conflict (stripe_subscription_id) do update
     set plan_id = excluded.plan_id,
         status = excluded.status,
         current_period_start = excluded.current_period_start,
         current_period_end = excluded.current_period_end,
         cancel_at_period_end = excluded.cancel_at_period_end,
         canceled_at = excluded.canceled_at,
         ended_at = excluded.ended_at
  returning * into v_sub;
  return v_sub;
end;
$$;

-- Stripe webhook (invoice.paid / invoice.payment_failed): keeps a payment row per subscription invoice.
create function public.record_stripe_invoice(
  p_stripe_subscription_id text,
  p_stripe_invoice_id text,
  p_amount_cents integer,
  p_paid boolean,
  p_failure_reason text default null
)
returns public.payments
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_sub public.subscriptions;
  v_pay public.payments;
begin
  if not public.is_service_role() then
    raise exception using errcode = 'P0001', message = 'forbidden';
  end if;
  select * into v_sub from public.subscriptions where stripe_subscription_id = p_stripe_subscription_id;
  if not found then
    raise exception using errcode = 'P0001', message = 'subscription_not_found';
  end if;

  insert into public.payments (user_id, provider, status, amount_cents, description, subscription_id,
                               stripe_invoice_id, paid_at, failed_at, failure_reason, bank_reference)
  values (v_sub.user_id, 'stripe',
          case when p_paid then 'succeeded' else 'failed' end::public.payment_status,
          p_amount_cents, 'subscription invoice', v_sub.id, p_stripe_invoice_id,
          case when p_paid then now() end, case when not p_paid then now() end,
          p_failure_reason, null)
  on conflict (stripe_invoice_id) do update
     set status = case when public.payments.status = 'succeeded' then public.payments.status
                       else excluded.status end,
         paid_at = coalesce(public.payments.paid_at, excluded.paid_at),
         failure_reason = case when excluded.status = 'failed' then excluded.failure_reason
                               else public.payments.failure_reason end
  returning * into v_pay;
  return v_pay;
end;
$$;

-- ===========================================================================
-- Viber community
-- ===========================================================================

-- Groups the signed-in user may join, with invite links (spec 9).
create function public.my_viber_groups()
returns table (
  viber_group_id uuid,
  name text,
  description text,
  invite_link text,
  join_instructions text,
  access_status public.viber_access_status
)
language sql
stable
security definer
set search_path = ''
as $$
  select g.id, g.name, g.description, i.invite_link, i.join_instructions, vm.status
  from public.viber_groups g
  left join public.viber_group_invites i on i.viber_group_id = g.id
  left join public.viber_memberships vm on vm.viber_group_id = g.id and vm.user_id = auth.uid()
  where g.id in (select public.eligible_viber_group_ids(auth.uid()))
  order by g.sort_order, g.name;
$$;

-- The member asks to be added and tells the admin which Viber number to invite.
create function public.request_viber_access(
  p_viber_group_id uuid,
  p_viber_phone text default null,
  p_viber_display_name text default null
)
returns public.viber_memberships
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := public.require_active_user();
  v_row public.viber_memberships;
begin
  if p_viber_group_id not in (select public.eligible_viber_group_ids(v_uid)) then
    raise exception using errcode = 'P0001', message = 'not_eligible';
  end if;

  insert into public.viber_memberships (user_id, viber_group_id, viber_phone, viber_display_name)
  values (v_uid, p_viber_group_id, p_viber_phone, p_viber_display_name)
  on conflict (user_id, viber_group_id) do update
     set viber_phone = coalesce(excluded.viber_phone, public.viber_memberships.viber_phone),
         viber_display_name = coalesce(excluded.viber_display_name, public.viber_memberships.viber_display_name),
         status = case when public.viber_memberships.status in ('removed', 'removal_pending')
                       then 'pending_invite'::public.viber_access_status
                       else public.viber_memberships.status end,
         requested_at = case when public.viber_memberships.status in ('removed', 'removal_pending')
                             then now() else public.viber_memberships.requested_at end
  returning * into v_row;
  return v_row;
end;
$$;

-- Admin to-do list: who should be invited to, or removed from, which group.
create view public.viber_access_actions
with (security_invoker = true)
as
with eligible as (
  select distinct s.user_id, pvg.viber_group_id
  from public.subscriptions s
  join public.plan_viber_groups pvg on pvg.plan_id = s.plan_id
  where public.subscription_grants_access(s)
)
select 'invite'::text as action, e.user_id, e.viber_group_id, vm.id as viber_membership_id,
       vm.status, vm.viber_phone, vm.viber_display_name, vm.requested_at
from eligible e
left join public.viber_memberships vm
  on vm.user_id = e.user_id and vm.viber_group_id = e.viber_group_id
where vm.id is null or vm.status in ('pending_invite', 'removal_pending', 'removed')
union all
select 'remove', vm.user_id, vm.viber_group_id, vm.id, vm.status, vm.viber_phone,
       vm.viber_display_name, vm.requested_at
from public.viber_memberships vm
where vm.status in ('invited', 'joined', 'removal_pending')
  and not exists (select 1 from eligible e
                   where e.user_id = vm.user_id and e.viber_group_id = vm.viber_group_id);

-- ===========================================================================
-- Scheduled maintenance (call every 5-15 minutes from a Vercel cron route or pg_cron)
-- ===========================================================================

create function public.run_maintenance()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_subs integer;
  v_pending_subs integer;
  v_bookings integer;
  v_events integer;
begin
  perform public.require_admin_or_service();
  perform public.expire_stale_holds();

  -- Bank-transfer periods that ran out without a renewal.
  update public.subscriptions
     set status = 'expired', ended_at = current_period_end
   where provider = 'bank_transfer' and status = 'active' and current_period_end <= now();
  get diagnostics v_subs = row_count;

  -- Bank-transfer sign-ups whose first payment was never confirmed.
  update public.subscriptions s
     set status = 'expired', ended_at = now()
   where s.status = 'pending_bank_transfer'
     and not exists (select 1 from public.payments p
                      where p.subscription_id = s.id and p.status in ('pending', 'succeeded'));
  get diagnostics v_pending_subs = row_count;

  update public.consultation_bookings
     set status = 'completed'
   where status = 'confirmed' and ends_at < now() - interval '24 hours';
  get diagnostics v_bookings = row_count;

  update public.events
     set status = 'completed'
   where status = 'published' and coalesce(ends_at, starts_at) < now() - interval '24 hours';
  get diagnostics v_events = row_count;

  return jsonb_build_object(
    'expired_subscriptions', v_subs,
    'expired_pending_subscriptions', v_pending_subs,
    'completed_bookings', v_bookings,
    'completed_events', v_events);
end;
$$;

-- ===========================================================================
-- Execute privileges: nothing is callable unless listed here.
-- ===========================================================================

revoke execute on all functions in schema public from public, anon, authenticated;
grant execute on all functions in schema public to service_role;

-- Used inside RLS policies, column defaults and views, so the calling role needs them.
grant execute on function
  public.has_role(public.app_role),
  public.is_admin(),
  public.is_service_role(),
  public.my_specialist_id(),
  public.is_client_of_my_specialist(uuid),
  public.is_eligible_for_viber_group(uuid),
  public.event_seats_taken(uuid),
  public.subscription_grants_access(public.subscriptions),
  public.get_available_slots(uuid, uuid, date, date)
to anon, authenticated;

-- Signed-in user actions (each function checks who may do what).
grant execute on function
  public.register_for_event(uuid, public.payment_provider),
  public.cancel_event_registration(uuid, text),
  public.book_consultation(uuid, uuid, timestamptz, public.payment_provider, text),
  public.cancel_consultation(uuid, text),
  public.reschedule_consultation(uuid, timestamptz),
  public.set_booking_outcome(uuid, public.booking_status),
  public.start_bank_transfer_subscription(uuid),
  public.my_viber_groups(),
  public.request_viber_access(uuid, text, text),
  public.confirm_bank_transfer(uuid, text),
  public.mark_payment_failed(uuid, public.payment_status, text),
  public.record_refund(uuid, integer),
  public.run_maintenance()
to authenticated;
