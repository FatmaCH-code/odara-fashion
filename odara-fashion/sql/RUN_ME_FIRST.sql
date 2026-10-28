-- ============================================================================
-- ODARA — RUN THIS ONCE in Supabase -> SQL Editor (safe to re-run).
-- 1) Fixes "Could not find the 'new_order' column of 'products' in the schema cache"
--    (Admin -> New & Best).
-- 2) Installs the Signature scent builder (Admin -> Signature) server pricing.
-- ============================================================================

ALTER TABLE products ADD COLUMN IF NOT EXISTS is_best BOOLEAN DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS new_order INT DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS best_order INT DEFAULT 0;

-- ============================================================================
-- ODARA — Signature scent builder managed from Admin -> Signature.
-- Run once in Supabase -> SQL Editor. Safe to re-run.
-- Stores the menu in site_settings (key 'blend'); price_cart() reads it, so the
-- server always charges the admin's current prices (bottle size is now charged too).
-- ============================================================================

CREATE OR REPLACE FUNCTION public.default_blend_config() RETURNS jsonb
LANGUAGE sql IMMUTABLE AS $cfg$
SELECT '{"bases":[{"id":"1","name":"Oud Pure","price":0,"active":true},{"id":"2","name":"Sandalwood","price":0,"active":true},{"id":"3","name":"Amber Musk","price":0,"active":true},{"id":"4","name":"Floral Blend","price":0,"active":true}],
"topNotes":[{"id":"101","name":"Lemon","price":5,"active":true},{"id":"102","name":"Bergamot","price":5,"active":true},{"id":"103","name":"Grapefruit","price":5,"active":true},{"id":"104","name":"Lavender","price":5,"active":true}],
"middleNotes":[{"id":"201","name":"Rose","price":8,"active":true},{"id":"202","name":"Jasmine","price":8,"active":true},{"id":"203","name":"Iris","price":8,"active":true},{"id":"204","name":"Peach","price":8,"active":true}],
"baseNotes":[{"id":"301","name":"Vanilla","price":6,"active":true},{"id":"302","name":"Musk","price":6,"active":true},{"id":"303","name":"Cedar","price":6,"active":true},{"id":"304","name":"Patchouli","price":6,"active":true}],
"sizes":[{"id":"small","label":"30ml","price":34.99,"active":true},{"id":"medium","label":"50ml","price":44.99,"active":true},{"id":"large","label":"100ml","price":54.99,"active":true}]}'::jsonb
$cfg$;

-- Looks up ONE active option (by id) inside one list of the menu; NULL if missing/hidden.
CREATE OR REPLACE FUNCTION public.blend_option(p_cfg jsonb, p_list text, p_id text)
RETURNS jsonb LANGUAGE sql STABLE AS $fn$
  SELECT e FROM jsonb_array_elements(coalesce(p_cfg->p_list, '[]'::jsonb)) e
  WHERE e->>'id' = p_id AND coalesce((e->>'active')::boolean, true)
  LIMIT 1
$fn$;

INSERT INTO site_settings (key, value) VALUES ('blend', public.default_blend_config())
ON CONFLICT (key) DO NOTHING;

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
  v_cfg      jsonb;
  v_opt      jsonb;
  v_sub      jsonb;
  v_recipe   jsonb;
BEGIN
  -- The signature-scent menu (oils, notes, sizes, prices) is managed in Admin -> Signature.
  SELECT value INTO v_cfg FROM site_settings WHERE key = 'blend';
  IF v_cfg IS NULL THEN v_cfg := public.default_blend_config(); END IF;

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
      -- Custom fragrance blend: price = the bottle size only (scents and notes carry no price)
      v_recipe := '[]'::jsonb;

      v_opt := public.blend_option(v_cfg, 'bases', v_blend->>'base');
      IF v_opt IS NULL THEN RAISE EXCEPTION 'Invalid custom blend.'; END IF;
      v_price := 0;   -- base oils carry no price: the bottle size sets the starting price
      -- Optional types inside a main scent (e.g. Oud -> Cambodian / Royal). Required once the admin has active ones.
      IF EXISTS (SELECT 1 FROM jsonb_array_elements(coalesce(v_opt->'subs', '[]'::jsonb)) x WHERE coalesce((x->>'active')::boolean, true)) THEN
        SELECT x INTO v_sub FROM jsonb_array_elements(coalesce(v_opt->'subs', '[]'::jsonb)) x
        WHERE x->>'id' = v_blend->>'sub' AND coalesce((x->>'active')::boolean, true) LIMIT 1;
        IF v_sub IS NULL THEN RAISE EXCEPTION 'Please choose a type for your main scent.'; END IF;
      ELSE
        v_sub := NULL;
      END IF;
      v_recipe := v_recipe || to_jsonb('Base oil: ' || (v_opt->>'name') || coalesce(' - ' || (v_sub->>'name'), ''));

      v_k := v_blend->>'topNote';
      IF v_k IS NOT NULL THEN
        v_opt := public.blend_option(v_cfg, 'topNotes', v_k);
        IF v_opt IS NULL THEN RAISE EXCEPTION 'Invalid custom blend.'; END IF;
        v_recipe := v_recipe || to_jsonb('Top note: ' || (v_opt->>'name'));
      END IF;
      v_k := v_blend->>'middleNote';
      IF v_k IS NOT NULL THEN
        v_opt := public.blend_option(v_cfg, 'middleNotes', v_k);
        IF v_opt IS NULL THEN RAISE EXCEPTION 'Invalid custom blend.'; END IF;
        v_recipe := v_recipe || to_jsonb('Middle note: ' || (v_opt->>'name'));
      END IF;
      v_k := v_blend->>'baseNote';
      IF v_k IS NOT NULL THEN
        v_opt := public.blend_option(v_cfg, 'baseNotes', v_k);
        IF v_opt IS NULL THEN RAISE EXCEPTION 'Invalid custom blend.'; END IF;
        v_recipe := v_recipe || to_jsonb('Base note: ' || (v_opt->>'name'));
      END IF;

      -- Scent character (not priced)
      v_k := v_blend->>'character';
      IF v_k IS NOT NULL THEN
        IF v_k NOT IN ('softer', 'balanced', 'bolder') THEN RAISE EXCEPTION 'Invalid scent character.'; END IF;
        v_recipe := v_recipe || to_jsonb('Character: ' || initcap(v_k));
      END IF;

      -- Bottle size sets the price. Required whenever the admin has at least one active size.
      v_k := v_blend->>'size';
      IF v_k IS NOT NULL THEN
        v_opt := public.blend_option(v_cfg, 'sizes', v_k);
        IF v_opt IS NULL THEN RAISE EXCEPTION 'Invalid bottle size.'; END IF;
        v_price := v_price + (v_opt->>'price')::numeric;
        v_recipe := v_recipe || to_jsonb('Size: ' || (v_opt->>'label'));
      ELSIF EXISTS (SELECT 1 FROM jsonb_array_elements(v_cfg->'sizes') e WHERE coalesce((e->>'active')::boolean, true)) THEN
        RAISE EXCEPTION 'Please choose a bottle size.';
      END IF;

      IF v_price <= 0 THEN RAISE EXCEPTION 'This blend is not available yet.'; END IF;

      -- Always labelled as a blend, so a blend can never be passed off as a real product on the order.
      v_name := CASE WHEN nullif(trim(coalesce(v_item->>'name', '')), '') IS NULL
                     THEN 'Custom Fragrance Blend'
                     ELSE left('Custom Blend: ' || trim(v_item->>'name'), 120) END;
      v_out := v_out || jsonb_build_array(jsonb_build_object(
        'name', v_name, 'price', v_price, 'quantity', v_qty,
        'category', 'Custom Blend', 'blend', v_blend, 'recipe', v_recipe));
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

REVOKE ALL ON FUNCTION public.price_cart(jsonb) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.price_cart(jsonb) TO service_role;

-- ============================================================================
-- ODARA — shipping by distance from Ohio.  Safe to re-run.
-- Zone 1 (closest) ... Zone 5 (farthest); fees are edited in Admin -> Offers & shipping.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.ship_zone(p_state text) RETURNS int
LANGUAGE sql IMMUTABLE AS $z$
  SELECT CASE
    WHEN p_state IN ('OH','MI','IN','KY','WV','PA') THEN 1
    WHEN p_state IN ('NY','NJ','MD','DE','DC','VA','IL','WI','TN','NC') THEN 2
    WHEN p_state IN ('MA','CT','RI','NH','VT','ME','SC','GA','AL','MS','MO','IA','MN','AR') THEN 3
    WHEN p_state IN ('FL','LA','TX','OK','KS','NE','SD','ND','CO') THEN 4
    WHEN p_state IN ('WY','MT','ID','UT','NV','AZ','NM','WA','OR','CA','AK','HI') THEN 5
    ELSE NULL
  END
$z$;

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

  IF p_promo_code IS NOT NULL AND length(trim(p_promo_code)) > 0 THEN
    v_promo := public.validate_promo(p_promo_code, p_email);
    IF NOT COALESCE((v_promo->>'valid')::boolean, false) THEN
      RAISE EXCEPTION '%', COALESCE(v_promo->>'message', 'That discount code is not valid.');
    END IF;
    v_discount := round(v_subtotal * (v_promo->>'percent')::numeric / 100, 2);
    v_code := v_promo->>'code';
  END IF;

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
  VALUES (v_number, trim(p_name), trim(p_email), p_phone, trim(p_address), v_priced->'items',
          v_subtotal - v_discount + v_shipping, 'pending', 'unpaid', v_code, v_discount, v_shipping);

  RETURN v_number;
END;
$$;

REVOKE ALL ON FUNCTION public.create_order(text, text, text, text, jsonb, text) FROM public;
GRANT EXECUTE ON FUNCTION public.create_order(text, text, text, text, jsonb, text) TO anon, authenticated, service_role;

-- Make Supabase's API notice the new columns right away.
NOTIFY pgrst, 'reload schema';
