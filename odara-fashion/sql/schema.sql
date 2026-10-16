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
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

DROP POLICY IF EXISTS "Admins can update products" ON products;
CREATE POLICY "Admins can update products" ON products
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

DROP POLICY IF EXISTS "Admins can delete products" ON products;
CREATE POLICY "Admins can delete products" ON products
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

DROP POLICY IF EXISTS "Users can read their own profile" ON profiles;
CREATE POLICY "Users can read their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;
CREATE POLICY "Admins can read all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );

DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;
CREATE POLICY "Admins can update any profile" ON profiles
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
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
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

DROP POLICY IF EXISTS "Admins can update orders" ON orders;
CREATE POLICY "Admins can update orders" ON orders
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

DROP POLICY IF EXISTS "Anyone can create cart items" ON cart_items;
CREATE POLICY "Anyone can create cart items" ON cart_items
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can read cart items" ON cart_items;
CREATE POLICY "Admins can read cart items" ON cart_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

DROP POLICY IF EXISTS "Anyone can subscribe" ON newsletter_subscribers;
CREATE POLICY "Anyone can subscribe" ON newsletter_subscribers
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can read subscribers" ON newsletter_subscribers;
CREATE POLICY "Admins can read subscribers" ON newsletter_subscribers
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

DROP POLICY IF EXISTS "Admins can delete subscribers" ON newsletter_subscribers;
CREATE POLICY "Admins can delete subscribers" ON newsletter_subscribers
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
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
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

DROP POLICY IF EXISTS "Admins can delete product images" ON storage.objects;
CREATE POLICY "Admins can delete product images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'product-images'
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
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
  FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

DROP POLICY IF EXISTS "Admins can insert muse items" ON muse_items;
CREATE POLICY "Admins can insert muse items" ON muse_items
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

DROP POLICY IF EXISTS "Admins can update muse items" ON muse_items;
CREATE POLICY "Admins can update muse items" ON muse_items
  FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

DROP POLICY IF EXISTS "Admins can delete muse items" ON muse_items;
CREATE POLICY "Admins can delete muse items" ON muse_items
  FOR DELETE USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

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
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

DROP POLICY IF EXISTS "Admins can update site settings" ON site_settings;
CREATE POLICY "Admins can update site settings" ON site_settings
  FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

-- ---------------------------------------------------------------------------
-- DISCOUNT CODES on orders + the two secure functions the checkout uses.
-- (Same content as orders_fix.sql — safe to run either/both.)
-- ---------------------------------------------------------------------------
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
