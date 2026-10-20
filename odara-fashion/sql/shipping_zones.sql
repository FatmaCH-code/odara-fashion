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
