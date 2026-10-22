-- Lets an admin close a payment flagged for review without a refund (admin panel, spec 12.1).
-- Payments have no direct write policy, so this goes through a function like the other payment changes.
-- Example: someone paid after their seat hold expired, and the admin gave them a seat by hand.

create function public.resolve_payment_review(p_payment_id uuid, p_note text)
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
  if coalesce(btrim(p_note), '') = '' then
    raise exception using errcode = 'P0001', message = 'invalid_status';
  end if;

  update public.payments
     set needs_review = false,
         admin_note = left(btrim(p_note), 500)
   where id = p_payment_id
  returning * into v_pay;
  if not found then
    raise exception using errcode = 'P0001', message = 'payment_not_found';
  end if;
  return v_pay;
end;
$$;

revoke execute on function public.resolve_payment_review(uuid, text) from public, anon;
grant execute on function public.resolve_payment_review(uuid, text) to authenticated, service_role;
