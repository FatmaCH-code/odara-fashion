-- ============================================================================
-- ODARA — secure checkout functions (order creation + discount codes).
-- Run in Supabase -> SQL Editor. Safe to re-run. Identical to the last block of
-- schema.sql, so if you already re-ran schema.sql you do NOT need this file.
--
-- WHY: customers can't read the "orders" table (privacy), so the site creates
-- orders through a secure function that runs on the server and calculates the
-- total itself.
-- Needs the "site_settings" table + discount columns from schema.sql.
-- ============================================================================

CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_code VARCHAR(40);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10, 2) DEFAULT 0;

-- Old 5-argument version is replaced by the one below (which adds the promo code).
DROP FUNCTION IF EXISTS public.create_order(text, text, text, text, jsonb);

-- Checks a discount code WITHOUT creating anything (used by the checkout page to show the saving).
CREATE OR REPLACE FUNCTION public.validate_promo(p_code text, p_email text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_offer jsonb;
BEGIN
  SELECT value->'welcomeOffer' INTO v_offer FROM site_settings WHERE key = 'storefront';
  IF v_offer IS NULL THEN
    v_offer := '{"enabled": true, "percent": 10, "code": "WELCOME10"}'::jsonb;
  END IF;

  IF NOT COALESCE((v_offer->>'enabled')::boolean, true)
     OR upper(trim(COALESCE(p_code, ''))) <> upper(v_offer->>'code') THEN
    RETURN jsonb_build_object('valid', false, 'message', 'That discount code is not valid.');
  END IF;

  IF p_email IS NOT NULL AND length(trim(p_email)) > 0 AND EXISTS (
    SELECT 1 FROM orders
    WHERE lower(customer_email) = lower(trim(p_email))
      AND upper(discount_code) = upper(v_offer->>'code')
      AND status <> 'cancelled'
  ) THEN
    RETURN jsonb_build_object('valid', false, 'message', 'This code has already been used with that email address.');
  END IF;

  RETURN jsonb_build_object(
    'valid', true,
    'percent', least(greatest((v_offer->>'percent')::numeric, 0), 90),
    'code', upper(v_offer->>'code')
  );
END;
$$;

-- Creates an order. The total (and any discount) is calculated HERE, on the server,
-- from the cart items — the browser can't change what it costs.
CREATE OR REPLACE FUNCTION public.create_order(
  p_name text, p_email text, p_phone text, p_address text, p_items jsonb,
  p_promo_code text DEFAULT NULL
) RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_number   text;
  v_subtotal numeric(10,2);
  v_discount numeric(10,2) := 0;
  v_code     text := NULL;
  v_promo    jsonb;
BEGIN
  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Cart is empty';
  END IF;

  SELECT COALESCE(SUM((i->>'price')::numeric * (i->>'quantity')::int), 0)
    INTO v_subtotal
    FROM jsonb_array_elements(p_items) i;

  IF p_promo_code IS NOT NULL AND length(trim(p_promo_code)) > 0 THEN
    v_promo := public.validate_promo(p_promo_code, p_email);
    IF NOT COALESCE((v_promo->>'valid')::boolean, false) THEN
      RAISE EXCEPTION '%', COALESCE(v_promo->>'message', 'That discount code is not valid.');
    END IF;
    v_discount := round(v_subtotal * (v_promo->>'percent')::numeric / 100, 2);
    v_code := v_promo->>'code';
  END IF;

  v_number := 'ODR-' || right(((extract(epoch from clock_timestamp()) * 1000)::bigint)::text, 6)
                     || upper(substr(md5(random()::text), 1, 5));

  INSERT INTO orders (order_number, customer_name, customer_email, customer_phone,
                      shipping_address, items, total_amount, status, payment_status,
                      discount_code, discount_amount)
  VALUES (v_number, p_name, p_email, p_phone, p_address, p_items, v_subtotal - v_discount,
          'pending', 'unpaid', v_code, v_discount);

  RETURN v_number;
END;
$$;

REVOKE ALL ON FUNCTION public.validate_promo(text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.validate_promo(text, text) TO anon, authenticated;
REVOKE ALL ON FUNCTION public.create_order(text, text, text, text, jsonb, text) FROM public;
GRANT EXECUTE ON FUNCTION public.create_order(text, text, text, text, jsonb, text) TO anon, authenticated;

-- Customers no longer insert into "orders" directly (the function above does it safely).
DROP POLICY IF EXISTS "Anyone can create an order" ON orders;
