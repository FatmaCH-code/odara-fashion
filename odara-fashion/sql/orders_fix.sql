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
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_amount DECIMAL(10, 2) DEFAULT 0;

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

-- Prices a cart ON THE SERVER. The browser only says "which product, how many, which
-- color/size"; the price always comes from the products table, so editing the request
-- can't lower what something costs. Used by create_order() below and by the Stripe
-- checkout function. Custom blends are priced from their ingredients.
ALTER TABLE products ADD COLUMN IF NOT EXISTS size_prices JSONB DEFAULT '{}'::jsonb;   -- { "50 ml": 59.99, "100 ml": 89.99 } — price per size (empty = every size costs the normal price)

CREATE OR REPLACE FUNCTION public.price_cart(p_items jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item     jsonb;
  v_out      jsonb := '[]'::jsonb;
  v_subtotal numeric(10,2) := 0;
  v_qty      int;
  v_id       bigint;
  v_prod     record;
  v_price    numeric(10,2);
  v_name     text;
  v_color    text;
  v_size     text;
  v_blend    jsonb;
  v_k        text;
  -- Custom-blend ingredient prices (keep in sync with src/pages/MakePerfume.jsx)
  v_bases    constant jsonb := '{"1":34.99,"2":29.99,"3":34.99,"4":29.99}';
  v_tops     constant jsonb := '{"101":5,"102":5,"103":5,"104":5}';
  v_mids     constant jsonb := '{"201":8,"202":8,"203":8,"204":8}';
  v_bnotes   constant jsonb := '{"301":6,"302":6,"303":6,"304":6}';
BEGIN
  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Your cart is empty.';
  END IF;
  IF jsonb_array_length(p_items) > 50 THEN
    RAISE EXCEPTION 'Too many different items in one order.';
  END IF;

  FOR v_item IN SELECT value FROM jsonb_array_elements(p_items) LOOP
    IF jsonb_typeof(v_item) <> 'object' THEN
      RAISE EXCEPTION 'Invalid cart.';
    END IF;

    BEGIN v_qty := (v_item->>'quantity')::int; EXCEPTION WHEN others THEN v_qty := 0; END;
    IF v_qty IS NULL OR v_qty < 1 OR v_qty > 99 THEN
      RAISE EXCEPTION 'Invalid quantity in your cart.';
    END IF;

    v_color := left(nullif(trim(coalesce(v_item->>'color', '')), ''), 40);
    v_size  := left(nullif(trim(coalesce(v_item->>'size', '')), ''), 20);
    v_blend := v_item->'blend';

    IF v_blend IS NOT NULL AND jsonb_typeof(v_blend) = 'object' THEN
      -- Custom fragrance blend: price = base oil + any chosen notes
      v_k := v_blend->>'base';
      IF v_k IS NULL OR NOT (v_bases ? v_k) THEN RAISE EXCEPTION 'Invalid custom blend.'; END IF;
      v_price := (v_bases->>v_k)::numeric;

      v_k := v_blend->>'topNote';
      IF v_k IS NOT NULL THEN
        IF NOT (v_tops ? v_k) THEN RAISE EXCEPTION 'Invalid custom blend.'; END IF;
        v_price := v_price + (v_tops->>v_k)::numeric;
      END IF;
      v_k := v_blend->>'middleNote';
      IF v_k IS NOT NULL THEN
        IF NOT (v_mids ? v_k) THEN RAISE EXCEPTION 'Invalid custom blend.'; END IF;
        v_price := v_price + (v_mids->>v_k)::numeric;
      END IF;
      v_k := v_blend->>'baseNote';
      IF v_k IS NOT NULL THEN
        IF NOT (v_bnotes ? v_k) THEN RAISE EXCEPTION 'Invalid custom blend.'; END IF;
        v_price := v_price + (v_bnotes->>v_k)::numeric;
      END IF;

      -- Always labelled as a blend, so a blend can never be passed off as a real product on the order.
      v_name := CASE WHEN nullif(trim(coalesce(v_item->>'name', '')), '') IS NULL
                     THEN 'Custom Fragrance Blend'
                     ELSE left('Custom Blend: ' || trim(v_item->>'name'), 120) END;
      v_out := v_out || jsonb_build_array(jsonb_build_object(
        'name', v_name, 'price', v_price, 'quantity', v_qty,
        'category', 'Custom Blend', 'blend', v_blend));
    ELSE
      BEGIN v_id := (v_item->>'id')::bigint; EXCEPTION WHEN others THEN v_id := NULL; END;
      SELECT id, name, price, stock, sizes, colors, size_prices INTO v_prod FROM products WHERE id = v_id;
      IF NOT FOUND THEN
        RAISE EXCEPTION 'An item in your cart is no longer available — please remove it and try again.';
      END IF;
      IF v_prod.stock IS NOT NULL AND v_prod.stock < v_qty THEN
        IF v_prod.stock <= 0 THEN
          RAISE EXCEPTION '"%" is sold out.', v_prod.name;
        END IF;
        RAISE EXCEPTION 'Only % of "%" left in stock.', v_prod.stock, v_prod.name;
      END IF;

      v_price := v_prod.price;
      -- Per-size prices (Admin -> Products -> "Price for each size"). Only a size the product really offers
      -- is accepted, so a made-up size can never fall back to a cheaper base price.
      IF v_prod.size_prices IS NOT NULL AND v_prod.size_prices <> '{}'::jsonb THEN
        IF v_size IS NULL OR NOT (
             coalesce(v_prod.sizes, '[]'::jsonb) ? v_size
             OR EXISTS (SELECT 1 FROM jsonb_array_elements(coalesce(v_prod.colors, '[]'::jsonb)) c,
                               jsonb_array_elements_text(coalesce(c->'sizes', '[]'::jsonb)) s WHERE s = v_size)
           ) THEN
          RAISE EXCEPTION 'Please choose a size for "%".', v_prod.name;
        END IF;
        IF v_prod.size_prices ? v_size THEN
          v_price := (v_prod.size_prices ->> v_size)::numeric;
        END IF;
        IF v_price IS NULL OR v_price <= 0 THEN
          RAISE EXCEPTION 'This size is not available right now.';
        END IF;
      END IF;
      -- Name is rebuilt from the real product name + the chosen color/size (never taken from the browser).
      IF v_color IS NOT NULL OR v_size IS NOT NULL THEN
        v_name := v_prod.name || ' (' ||
                  concat_ws(', ', v_color, CASE WHEN v_size IS NOT NULL THEN 'Size ' || v_size END) || ')';
      ELSIF left(coalesce(v_item->>'name', ''), length(v_prod.name)) = v_prod.name THEN
        v_name := left(v_item->>'name', 150);   -- older carts that already had "(Red, Size M)" in the name
      ELSE
        v_name := v_prod.name;
      END IF;

      v_out := v_out || jsonb_build_array(jsonb_build_object(
        'id', v_prod.id, 'name', v_name, 'price', v_price, 'quantity', v_qty,
        'color', v_color, 'size', v_size));
    END IF;

    v_subtotal := v_subtotal + v_price * v_qty;
  END LOOP;

  RETURN jsonb_build_object('items', v_out, 'subtotal', v_subtotal);
END;
$$;

-- Creates an order. Prices, total and any discount are calculated HERE, on the server —
-- the browser can't change what anything costs.
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
  v_subtotal numeric(10,2);
  v_discount numeric(10,2) := 0;
  v_code     text := NULL;
  v_promo    jsonb;
  v_ship_cfg jsonb;
  v_flat     numeric;
  v_free     numeric;
  v_shipping numeric(10,2) := 0;
BEGIN
  IF coalesce(trim(p_name), '') = '' OR coalesce(trim(p_address), '') = ''
     OR p_email IS NULL OR position('@' in p_email) < 2 THEN
    RAISE EXCEPTION 'Please fill in your name, email and address.';
  END IF;

  v_priced   := public.price_cart(p_items);
  v_subtotal := (v_priced->>'subtotal')::numeric;

  IF p_promo_code IS NOT NULL AND length(trim(p_promo_code)) > 0 THEN
    v_promo := public.validate_promo(p_promo_code, p_email);
    IF NOT COALESCE((v_promo->>'valid')::boolean, false) THEN
      RAISE EXCEPTION '%', COALESCE(v_promo->>'message', 'That discount code is not valid.');
    END IF;
    v_discount := round(v_subtotal * (v_promo->>'percent')::numeric / 100, 2);
    v_code := v_promo->>'code';
  END IF;

  -- Shipping (set in Admin → Offers & shipping; defaults to a flat $10 if never saved)
  SELECT value->'shipping' INTO v_ship_cfg FROM site_settings WHERE key = 'storefront';
  v_flat := least(greatest(coalesce((v_ship_cfg->>'flatFee')::numeric, 10), 0), 500);
  v_free := coalesce((v_ship_cfg->>'freeOver')::numeric, 0);
  IF v_free > 0 AND (v_subtotal - v_discount) >= v_free THEN
    v_shipping := 0;
  ELSE
    v_shipping := round(v_flat, 2);
  END IF;

  v_number := 'ODR-' || right(((extract(epoch from clock_timestamp()) * 1000)::bigint)::text, 6)
                     || upper(substr(md5(random()::text), 1, 5));

  INSERT INTO orders (order_number, customer_name, customer_email, customer_phone,
                      shipping_address, items, total_amount, status, payment_status,
                      discount_code, discount_amount, shipping_amount)
  VALUES (v_number, trim(p_name), trim(p_email), p_phone, trim(p_address), v_priced->'items',
          v_subtotal - v_discount + v_shipping, 'pending', 'unpaid', v_code, v_discount, v_shipping);

  RETURN v_number;
END;
$$;

REVOKE ALL ON FUNCTION public.validate_promo(text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.validate_promo(text, text) TO anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.price_cart(jsonb) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.price_cart(jsonb) TO service_role;
REVOKE ALL ON FUNCTION public.create_order(text, text, text, text, jsonb, text) FROM public;
GRANT EXECUTE ON FUNCTION public.create_order(text, text, text, text, jsonb, text) TO anon, authenticated, service_role;

-- Customers no longer insert into "orders" directly (the function above does it safely).
DROP POLICY IF EXISTS "Anyone can create an order" ON orders;
