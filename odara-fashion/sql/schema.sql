-- ============================================================================
-- ODARA FASHION — Supabase schema
-- Run this whole file once in Supabase Dashboard → SQL Editor → New Query.
-- Safe to re-run: every statement uses IF NOT EXISTS / OR REPLACE.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- PRODUCTS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  category VARCHAR(255) NOT NULL
);

-- If "products" already existed from an earlier/older version of this schema,
-- CREATE TABLE IF NOT EXISTS above did nothing — it only creates a table when
-- one isn't there at all, it never adds columns to one that already exists.
-- These statements patch an existing table up to the current shape too, so
-- this file is genuinely safe to re-run no matter which version you ran before.
ALTER TABLE products ADD COLUMN IF NOT EXISTS original_price DECIMAL(10, 2);      -- set when the item is on sale
ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS colors JSONB DEFAULT '[]'::jsonb;   -- [{ "name": "Red", "hex": "#a4272c" }, ...]
ALTER TABLE products ADD COLUMN IF NOT EXISTS sizes JSONB DEFAULT '[]'::jsonb;    -- ["S","M","L"] or ["1","2","3"] — US sizing
ALTER TABLE products ADD COLUMN IF NOT EXISTS brand VARCHAR(100);                 -- perfumes only: Lattafa, Armaf, Rasasi, ...

-- Tidy-up (safe to re-run): perfumes used to be split into "Fragrances" and
-- "Dubai Fragrances". They are now ONE "Perfumes" section, sub-divided by brand.
UPDATE products SET category = 'Perfumes' WHERE category IN ('Fragrances', 'Dubai Fragrances');
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_new BOOLEAN DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_sale BOOLEAN DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock INT DEFAULT 20;
ALTER TABLE products ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE products ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE products ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb;  -- gallery: ["url1", "url2", ...] — first one is the cover photo shown on cards

-- One-time backfill: give existing single-photo products a 1-item gallery too,
-- so nothing looks empty after adding the "images" column above.
UPDATE products
SET images = jsonb_build_array(image_url)
WHERE (images IS NULL OR images = '[]'::jsonb)
  AND image_url IS NOT NULL AND image_url != '';

-- Keep updated_at current on every edit
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS products_set_updated_at ON products;
CREATE TRIGGER products_set_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------------
-- PROFILES — links a Supabase Auth user to admin access.
-- A row here with is_admin = true is what unlocks the /admin dashboard.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255),
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- "Is the signed-in user an admin?" — used by every admin rule below.
-- It must be SECURITY DEFINER (runs with the owner's rights, skipping row-level security):
-- a rule on "profiles" that itself queried "profiles" made Postgres stop with
-- "infinite recursion detected in policy for relation profiles".
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
$$;
REVOKE ALL ON FUNCTION public.is_admin() FROM public;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated, service_role;

-- Auto-create a profile row whenever someone signs up (defaults to NOT admin —
-- you flip is_admin to true yourself for the one account that should manage the store).
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email) VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ---------------------------------------------------------------------------
-- ORDERS / CART ITEMS / TESTIMONIALS (kept from the original scaffold)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  order_number VARCHAR(50) UNIQUE,
  customer_email VARCHAR(255),
  customer_name VARCHAR(255),
  total_amount DECIMAL(10, 2),
  status VARCHAR(50) DEFAULT 'pending',
  shipping_address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cart_items (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  order_id BIGINT REFERENCES orders(id) ON DELETE CASCADE,
  product_id BIGINT REFERENCES products(id),
  quantity INT NOT NULL,
  price DECIMAL(10, 2),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS testimonials (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name VARCHAR(255),
  message TEXT,
  rating INT CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- NEWSLETTER SUBSCRIBERS — every "Subscribe"/"Join" form on the site writes here.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  email VARCHAR(255) UNIQUE NOT NULL,
  source VARCHAR(100),              -- which form they signed up from, e.g. 'home', 'footer'
  created_at TIMESTAMPTZ DEFAULT now()
);

-- A few extra fields on orders so the admin can actually see who's ordering and what.
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(50);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS items JSONB DEFAULT '[]'::jsonb;  -- snapshot of [{ name, price, quantity }] at order time
ALTER TABLE orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Payment tracking (Stripe Checkout). `status` above is FULFILLMENT status
-- (pending/processing/shipped/delivered/cancelled) — this is separate:
-- payment_status tracks whether money has actually been collected.
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status VARCHAR(30) DEFAULT 'unpaid';  -- unpaid | paid | refunded | failed
ALTER TABLE orders ADD COLUMN IF NOT EXISTS stripe_session_id TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS stripe_payment_intent TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;

DROP TRIGGER IF EXISTS orders_set_updated_at ON orders;
CREATE TRIGGER orders_set_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------------
-- ROW LEVEL SECURITY
-- Public storefront: anyone can READ products. Only a signed-in admin
-- (a profiles row with is_admin = true) can INSERT / UPDATE / DELETE.
-- ---------------------------------------------------------------------------
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read products" ON products;
CREATE POLICY "Public can read products" ON products
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can insert products" ON products;
CREATE POLICY "Admins can insert products" ON products
  FOR INSERT WITH CHECK (
    public.is_admin()
  );

DROP POLICY IF EXISTS "Admins can update products" ON products;
CREATE POLICY "Admins can update products" ON products
  FOR UPDATE USING (
    public.is_admin()
  );

DROP POLICY IF EXISTS "Admins can delete products" ON products;
CREATE POLICY "Admins can delete products" ON products
  FOR DELETE USING (
    public.is_admin()
  );

DROP POLICY IF EXISTS "Users can read their own profile" ON profiles;
CREATE POLICY "Users can read their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;
CREATE POLICY "Admins can read all profiles" ON profiles
  FOR SELECT USING (
    public.is_admin()
  );

DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;
CREATE POLICY "Admins can update any profile" ON profiles
  FOR UPDATE USING (
    public.is_admin()
  );

DROP POLICY IF EXISTS "Public can read testimonials" ON testimonials;
CREATE POLICY "Public can read testimonials" ON testimonials
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can create an order" ON orders;
CREATE POLICY "Anyone can create an order" ON orders
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can read orders" ON orders;
CREATE POLICY "Admins can read orders" ON orders
  FOR SELECT USING (
    public.is_admin()
  );

DROP POLICY IF EXISTS "Admins can update orders" ON orders;
CREATE POLICY "Admins can update orders" ON orders
  FOR UPDATE USING (
    public.is_admin()
  );

DROP POLICY IF EXISTS "Anyone can create cart items" ON cart_items;
CREATE POLICY "Anyone can create cart items" ON cart_items
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can read cart items" ON cart_items;
CREATE POLICY "Admins can read cart items" ON cart_items
  FOR SELECT USING (
    public.is_admin()
  );

DROP POLICY IF EXISTS "Anyone can subscribe" ON newsletter_subscribers;
CREATE POLICY "Anyone can subscribe" ON newsletter_subscribers
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can read subscribers" ON newsletter_subscribers;
CREATE POLICY "Admins can read subscribers" ON newsletter_subscribers
  FOR SELECT USING (
    public.is_admin()
  );

DROP POLICY IF EXISTS "Admins can delete subscribers" ON newsletter_subscribers;
CREATE POLICY "Admins can delete subscribers" ON newsletter_subscribers
  FOR DELETE USING (
    public.is_admin()
  );

-- ---------------------------------------------------------------------------
-- STORAGE POLICIES
-- This assumes you've already created a PUBLIC bucket named "product-images"
-- from Dashboard → Storage → New bucket (see SETUP.md, step 3) before running this part.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public can view product images" ON storage.objects;
CREATE POLICY "Public can view product images" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Admins can upload product images" ON storage.objects;
CREATE POLICY "Admins can upload product images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'product-images'
    AND public.is_admin()
  );

DROP POLICY IF EXISTS "Admins can delete product images" ON storage.objects;
CREATE POLICY "Admins can delete product images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'product-images'
    AND public.is_admin()
  );

-- ---------------------------------------------------------------------------
-- THE ODARA MUSE — admin-curated showcase (home page + /muse).
-- Each entry = one product + the photo to show for it (+ optional tag).
-- Safe to re-run.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS muse_items (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  tag VARCHAR(20),                       -- 'new' (New Arrival), 'best' (Best Seller) or NULL
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE muse_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read active muse items" ON muse_items;
CREATE POLICY "Public can read active muse items" ON muse_items
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Admins can read all muse items" ON muse_items;
CREATE POLICY "Admins can read all muse items" ON muse_items
  FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can insert muse items" ON muse_items;
CREATE POLICY "Admins can insert muse items" ON muse_items
  FOR INSERT WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can update muse items" ON muse_items;
CREATE POLICY "Admins can update muse items" ON muse_items
  FOR UPDATE USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete muse items" ON muse_items;
CREATE POLICY "Admins can delete muse items" ON muse_items
  FOR DELETE USING (public.is_admin());

-- ---------------------------------------------------------------------------
-- BEST SELLER flag (admin ticks it on a product -> appears in "Best Sellers")
-- ---------------------------------------------------------------------------
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_best BOOLEAN DEFAULT false;

-- ---------------------------------------------------------------------------
-- SITE SETTINGS — welcome popup (10% off) + announcement bar, edited in Admin → Offers.
-- One row, key = 'storefront'. Anyone can read it (the site needs it); only admins write.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read site settings" ON site_settings;
CREATE POLICY "Public can read site settings" ON site_settings
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can insert site settings" ON site_settings;
CREATE POLICY "Admins can insert site settings" ON site_settings
  FOR INSERT WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can update site settings" ON site_settings;
CREATE POLICY "Admins can update site settings" ON site_settings
  FOR UPDATE USING (public.is_admin());

-- ---------------------------------------------------------------------------
-- DISCOUNT CODES on orders + the two secure functions the checkout uses.
-- (Same content as orders_fix.sql — safe to run either/both.)
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- NEW ARRIVALS / BEST SELLERS — the order the admin arranges them in
-- (Admin → New & Best). The is_new / is_best flags already exist; these just
-- remember the position. 0 = "not placed yet" (shown after the placed ones).
-- ---------------------------------------------------------------------------
ALTER TABLE products ADD COLUMN IF NOT EXISTS new_order INT DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS best_order INT DEFAULT 0;

-- ---------------------------------------------------------------------------
-- CUSTOMER REVIEWS — genuine ones only.
--   * Anyone can SUBMIT a review, but it is saved as "pending" and is invisible
--     until an admin approves it (Admin → Reviews).
--   * Visitors can only ever READ approved reviews.
--   * Admins can also add a review themselves (e.g. a real message a customer sent
--     on WhatsApp/Instagram) — those are marked source = 'admin'.
-- product_id NULL = a review of the store in general.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reviews (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  product_id BIGINT REFERENCES products(id) ON DELETE CASCADE,
  name VARCHAR(80) NOT NULL CHECK (char_length(trim(name)) BETWEEN 1 AND 80),
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  body TEXT NOT NULL CHECK (char_length(trim(body)) BETWEEN 3 AND 1000),
  status VARCHAR(12) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  source VARCHAR(12) NOT NULL DEFAULT 'customer' CHECK (source IN ('customer', 'admin')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS reviews_status_idx ON reviews (status, created_at DESC);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read approved reviews" ON reviews;
CREATE POLICY "Public can read approved reviews" ON reviews
  FOR SELECT USING (status = 'approved');

DROP POLICY IF EXISTS "Admins can read all reviews" ON reviews;
CREATE POLICY "Admins can read all reviews" ON reviews
  FOR SELECT USING (public.is_admin());

-- A visitor can only create a PENDING, customer-sourced review — never an approved one.
DROP POLICY IF EXISTS "Anyone can submit a pending review" ON reviews;
CREATE POLICY "Anyone can submit a pending review" ON reviews
  FOR INSERT WITH CHECK (status = 'pending' AND source = 'customer');

DROP POLICY IF EXISTS "Admins can add reviews" ON reviews;
CREATE POLICY "Admins can add reviews" ON reviews
  FOR INSERT WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can update reviews" ON reviews;
CREATE POLICY "Admins can update reviews" ON reviews
  FOR UPDATE USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete reviews" ON reviews;
CREATE POLICY "Admins can delete reviews" ON reviews
  FOR DELETE USING (public.is_admin());
