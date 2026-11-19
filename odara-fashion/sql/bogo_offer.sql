-- ============================================================================
-- ODARA — "Buy one, get one free" on clothing (Admin -> Offers).  Safe to re-run.
-- Run once in Supabase -> SQL Editor, AFTER RUN_ME_FIRST.sql.
--
-- Rule (same as src/utils/bogo.js, so the bag and the charge always match):
--   for every clothing item the customer pays for, ONE of the gift pieces the admin
--   ticked (site_settings 'storefront' -> bogo.freeIds) is free — cheapest gifts first.
--   If the order only has gift pieces, they pair up: pay for one, the cheaper is free.
-- "Clothing" = anything that is not a perfume (category Perfumes / *fragrance* / has a brand)
-- and not a perfumery oil (category containing the word "oil"/"oils"), like the Shop page.
-- Free units are written on the order lines as "free_qty"; their value is part of discount_amount.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.apply_bogo(p_items jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cfg      jsonb;
  v_ids      bigint[];
  v_buys     int := 0;
  v_idx      int[];
  v_price    numeric[];
  v_cloth    boolean[];
  v_free     int[];
  v_paid     boolean[];
  v_lo       int;
  v_hi       int;
  v_n        int;
  v_amount   numeric(10,2) := 0;
  v_out      jsonb := '[]'::jsonb;
  v_item     jsonb;
  v_ord      int;
  r          record;
BEGIN
  SELECT value->'bogo' INTO v_cfg FROM site_settings WHERE key = 'storefront';
  IF v_cfg IS NULL OR NOT coalesce((v_cfg->>'enabled')::boolean, false)
     OR jsonb_typeof(v_cfg->'freeIds') <> 'array' THEN
    RETURN jsonb_build_object('items', p_items, 'amount', 0);
  END IF;

  v_ids := ARRAY(SELECT x::bigint FROM jsonb_array_elements_text(v_cfg->'freeIds') x WHERE x ~ '^[0-9]+$');
  IF coalesce(array_length(v_ids, 1), 0) = 0 THEN
    RETURN jsonb_build_object('items', p_items, 'amount', 0);
  END IF;

  -- One row per cart line, with the product's real category/brand.
  FOR r IN
    SELECT (e.ord - 1)::int AS idx,
           (e.val->>'price')::numeric AS price,
           (e.val->>'quantity')::int AS qty,
           p.id IS NOT NULL AND p.id = ANY(v_ids) AS is_gift,
           p.id IS NOT NULL
             AND NOT (coalesce(p.category, '') ~* '\moils?\M')
             AND NOT (lower(btrim(coalesce(p.category, ''))) = 'perfumes'
                      OR coalesce(p.category, '') ~* 'fragrance'
                      OR btrim(coalesce(p.brand, '')) <> '') AS is_clothing
    FROM jsonb_array_elements(p_items) WITH ORDINALITY e(val, ord)
    LEFT JOIN products p
      ON e.val->'blend' IS NULL
     AND (e.val->>'id') ~ '^[0-9]+$'
     AND p.id = (e.val->>'id')::bigint
  LOOP
    IF r.is_gift THEN
      NULL;  -- gift units are collected below, sorted by price
    ELSIF r.is_clothing THEN
      v_buys := v_buys + r.qty;
    END IF;
  END LOOP;

  -- Every gift unit, cheapest first.
  SELECT array_agg(idx ORDER BY price, idx), array_agg(price ORDER BY price, idx), array_agg(is_clothing ORDER BY price, idx)
    INTO v_idx, v_price, v_cloth
  FROM (
    SELECT (e.ord - 1)::int AS idx,
           (e.val->>'price')::numeric AS price,
           NOT (coalesce(p.category, '') ~* '\moils?\M')
             AND NOT (lower(btrim(coalesce(p.category, ''))) = 'perfumes'
                      OR coalesce(p.category, '') ~* 'fragrance'
                      OR btrim(coalesce(p.brand, '')) <> '') AS is_clothing
    FROM jsonb_array_elements(p_items) WITH ORDINALITY e(val, ord)
    JOIN products p
      ON e.val->'blend' IS NULL
     AND (e.val->>'id') ~ '^[0-9]+$'
     AND p.id = (e.val->>'id')::bigint
    CROSS JOIN LATERAL generate_series(1, (e.val->>'quantity')::int) g
    WHERE p.id = ANY(v_ids)
  ) u;

  v_n := jsonb_array_length(p_items);
  v_free := array_fill(0, ARRAY[v_n]);

  IF v_idx IS NOT NULL THEN
    v_hi := array_length(v_idx, 1);
    v_paid := array_fill(false, ARRAY[v_hi]);
    FOR v_lo IN 1 .. array_length(v_idx, 1) LOOP
      CONTINUE WHEN v_paid[v_lo];
      IF v_buys > 0 THEN
        v_buys := v_buys - 1;                 -- a paid clothing item "pays" for this gift
      ELSE
        -- No clothing left to pay for it: the dearest remaining clothing gift is paid for instead.
        WHILE v_hi > v_lo AND (v_paid[v_hi] OR NOT v_cloth[v_hi]) LOOP
          v_hi := v_hi - 1;
        END LOOP;
        EXIT WHEN v_hi <= v_lo;
        v_paid[v_hi] := true;
        v_hi := v_hi - 1;
      END IF;
      v_free[v_idx[v_lo] + 1] := v_free[v_idx[v_lo] + 1] + 1;   -- this (cheapest remaining) gift is free
      v_amount := v_amount + v_price[v_lo];
    END LOOP;
  END IF;

  FOR v_item, v_ord IN SELECT e.val, e.ord::int FROM jsonb_array_elements(p_items) WITH ORDINALITY e(val, ord) LOOP
    IF v_free[v_ord] > 0 THEN
      v_item := v_item || jsonb_build_object('free_qty', v_free[v_ord]);
    END IF;
    v_out := v_out || jsonb_build_array(v_item);
  END LOOP;

  RETURN jsonb_build_object('items', v_out, 'amount', round(v_amount, 2));
END;
$$;

REVOKE ALL ON FUNCTION public.apply_bogo(jsonb) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.apply_bogo(jsonb) TO service_role;


-- create_order(): same as RUN_ME_FIRST.sql (shipping by distance) + "buy one get one free".
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
  v_priced   jsonb;
  v_items    jsonb;
  v_bogo     jsonb;
  v_bogo_amt numeric(10,2) := 0;
  v_subtotal numeric(10,2);
  v_discount numeric(10,2) := 0;
  v_code     text := NULL;
  v_promo    jsonb;
  v_ship_cfg jsonb;
  v_flat     numeric;
  v_free     numeric;
  v_shipping numeric(10,2) := 0;
  v_country  text;
  v_state    text;
  v_zone     int;
  v_fee      numeric;
BEGIN
  IF coalesce(trim(p_name), '') = '' OR coalesce(trim(p_address), '') = ''
     OR p_email IS NULL OR position('@' in p_email) < 2 THEN
    RAISE EXCEPTION 'Please fill in your name, email and address.';
  END IF;

  v_priced   := public.price_cart(p_items);
  v_subtotal := (v_priced->>'subtotal')::numeric;

  -- Buy one, get one free (Admin -> Offers)
  v_bogo     := public.apply_bogo(v_priced->'items');
  v_items    := v_bogo->'items';
  v_bogo_amt := coalesce((v_bogo->>'amount')::numeric, 0);

  -- The % code applies to what's left to pay after the free gifts.
  IF p_promo_code IS NOT NULL AND length(trim(p_promo_code)) > 0 THEN
    v_promo := public.validate_promo(p_promo_code, p_email);
    IF NOT COALESCE((v_promo->>'valid')::boolean, false) THEN
      RAISE EXCEPTION '%', COALESCE(v_promo->>'message', 'That discount code is not valid.');
    END IF;
    v_discount := round((v_subtotal - v_bogo_amt) * (v_promo->>'percent')::numeric / 100, 2);
    v_code := v_promo->>'code';
  ELSIF v_bogo_amt > 0 THEN
    v_code := 'BOGO';
  END IF;
  v_discount := v_discount + v_bogo_amt;

  -- Shipping: by distance from Ohio (state zones) or one flat fee — set in Admin -> Offers & shipping.
  SELECT value->'shipping' INTO v_ship_cfg FROM site_settings WHERE key = 'storefront';
  v_flat := least(greatest(coalesce((v_ship_cfg->>'flatFee')::numeric, 10), 0), 500);
  v_free := coalesce((v_ship_cfg->>'freeOver')::numeric, 0);
  IF v_free > 0 AND (v_subtotal - v_discount) >= v_free THEN
    v_shipping := 0;
  ELSIF coalesce((v_ship_cfg->>'byZone')::boolean, true) THEN
    -- The address is built as "street, city, ST 12345, Country" by the checkout page.
    v_country := btrim(substring(p_address from ',[[:space:]]*([^,]+)$'));
    IF lower(coalesce(v_country, '')) <> 'united states' THEN
      v_fee := coalesce((v_ship_cfg->>'international')::numeric, 29.99);
      v_shipping := round(least(greatest(v_fee, 0), 500), 2);
    ELSE
      v_state := substring(p_address from ',[[:space:]]*([A-Z]{2})[[:space:]][^,]*,[[:space:]]*[^,]+$');
      v_zone := public.ship_zone(v_state);
      IF v_zone IS NULL THEN
        v_shipping := round(v_flat, 2);
      ELSE
        v_fee := coalesce((v_ship_cfg->'zones'->>(v_zone - 1))::numeric, (ARRAY[5.99, 7.99, 9.99, 12.99, 15.99])[v_zone]);
        v_shipping := round(least(greatest(v_fee, 0), 500), 2);
      END IF;
    END IF;
  ELSE
    v_shipping := round(v_flat, 2);
  END IF;

  v_number := 'ODR-' || right(((extract(epoch from clock_timestamp()) * 1000)::bigint)::text, 6)
                     || upper(substr(md5(random()::text), 1, 5));

  INSERT INTO orders (order_number, customer_name, customer_email, customer_phone,
                      shipping_address, items, total_amount, status, payment_status,
                      discount_code, discount_amount, shipping_amount)
  VALUES (v_number, trim(p_name), trim(p_email), p_phone, trim(p_address), v_items,
          v_subtotal - v_discount + v_shipping, 'pending', 'unpaid', v_code, v_discount, v_shipping);

  RETURN v_number;
END;
$$;

REVOKE ALL ON FUNCTION public.create_order(text, text, text, text, jsonb, text) FROM public;
GRANT EXECUTE ON FUNCTION public.create_order(text, text, text, text, jsonb, text) TO anon, authenticated, service_role;

NOTIFY pgrst, 'reload schema';
