-- ============================================================================
-- ODARA — fix for: "new row violates row-level security policy for table orders"
-- Run once in Supabase → SQL Editor → New query → Run.
--
-- WHY IT FAILED: the site did insert(...).select() on "orders". The insert was
-- allowed, but .select() reads the new row back, and only admins may SELECT
-- orders — so Postgres rejected it. Fix: customers create orders through a
-- secure function (runs server-side, returns only the order number).
-- ============================================================================

create or replace function public.create_order(
  p_name text, p_email text, p_phone text, p_address text, p_items jsonb
) returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_number text;
  v_total  numeric(10,2);
begin
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Cart is empty';
  end if;

  select coalesce(sum((i->>'price')::numeric * (i->>'quantity')::int), 0)
    into v_total
    from jsonb_array_elements(p_items) i;

  v_number := 'ODR-' || right(((extract(epoch from clock_timestamp()) * 1000)::bigint)::text, 6)
                     || upper(substr(md5(random()::text), 1, 5));

  insert into orders (order_number, customer_name, customer_email, customer_phone,
                      shipping_address, items, total_amount, status, payment_status)
  values (v_number, p_name, p_email, p_phone, p_address, p_items, v_total, 'pending', 'unpaid');

  return v_number;
end;
$$;

revoke all on function public.create_order(text, text, text, text, jsonb) from public;
grant execute on function public.create_order(text, text, text, text, jsonb) to anon, authenticated;

-- Customers no longer need direct INSERT on orders (the function handles it).
drop policy if exists "Anyone can create an order" on orders;
