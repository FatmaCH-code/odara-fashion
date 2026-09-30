# Odara Fashion — Supabase Setup

Your site works right now with no database (it reads `src/data/products.js`).
Follow these steps whenever you're ready to switch to a real Postgres database
with an admin panel. Nothing breaks if you do this later — the storefront
already knows how to use either source.

## 1. Get your real API key

1. Go to your project: https://supabase.com/dashboard/project/oidmhnqdhwcoqckeffeo/settings/api
2. Copy the **Project URL** and the **anon / public** key (a long string starting `eyJ...`, a few hundred characters).
3. Open `.env.local` in the project root and replace the two Supabase lines:
   ```
   VITE_SUPABASE_URL=https://oidmhnqdhwcoqckeffeo.supabase.co
   VITE_SUPABASE_ANON_KEY=<paste the full anon key here>
   ```
4. Restart `npm run dev` after saving — Vite only reads `.env.local` on startup.

The site auto-detects a real key vs. the old placeholder, so nothing else changes yet.

## 2. Create the database tables

1. In Supabase: **SQL Editor → New query**.
2. Open `sql/schema.sql` from this project, paste the whole file in, click **Run**.
   This creates the `products`, `profiles`, `orders`, `newsletter_subscribers`,
   `cart_items` and `testimonials` tables, plus the security rules (public can
   read products; only a signed-in admin can add/edit/delete, or read orders
   and subscribers). If you already ran an older version of this file, it's
   still safe to run again — it now patches missing columns onto existing
   tables instead of skipping them.
3. New query again, paste the whole `sql/seed_products.sql`, click **Run**.
   This loads your current 50 products — the same ones already on the live site —
   into the database so the admin panel isn't empty on day one.

## 3. Create the image storage bucket

1. **Storage → New bucket**.
2. Name it exactly `product-images`, toggle **Public bucket** on, create it.
3. (The upload/view permissions for this bucket are already set by `schema.sql` — no extra step needed there.)

## 4. Create your admin login

1. **Authentication → Users → Add user** (or have your own account sign up once
   at `/admin/login` if you add a sign-up form later — for now, easiest is to
   create it directly here).
2. Set the email and a password you'll remember.
3. Back in **SQL Editor**, run this once (replace the email):
   ```sql
   update profiles set is_admin = true where email = 'you@odarafashion.com';
   ```
   This is the one flag that unlocks `/admin` — anyone else who ever signs up
   stays a normal (non-admin) account until you do this for them too.

## 5. Sign in

Go to `yoursite.com/admin/login`, sign in with that email/password. You'll land
on the dashboard: **Overview** (charts — products by category, sale vs. regular,
average price) and **Products** (search, add, edit, delete, upload photos).

## What changes once this is live

- The public storefront (Home/Shop/Perfumes/product pages) keeps working
  instantly from the bundled catalog, then quietly swaps in live data from
  Supabase a moment later — so if the database is ever unreachable, customers
  still see a working site.
- Anything you add/edit/delete in `/admin` shows up on the live site on refresh.
- Product photos you upload in the admin go to Supabase Storage and get a
  permanent public URL — no need to touch code.
- Every "Subscribe"/"Join" form on the site now actually saves the email —
  see it under the admin's **Subscribers** tab (with a CSV export button).
- Checkout now creates a real order (customer name, email, phone, address,
  the exact items and total) even though online payment isn't wired up yet —
  it's captured as "pending" so you can follow up manually. See it under the
  admin's **Orders** tab, where you can also update its status and expand it
  to see full customer + item details.
- Each product can now have multiple photos (e.g. one per color) — the admin's
  photo uploader lets you add several, star one as the cover photo, and remove
  any. The storefront product page shows the extra photos as clickable thumbnails.

## Notes on today's catalog

- 50 products are already seeded: your real partner-store items, your real
  `CatalogueODARA.xlsx` items (23 with their real photos), plus a few
  placeholder items (stock photo hijabs, perfumery oils) clearly marked in
  `src/data/products.js` — replace those anytime from the admin panel once
  it's live.
- The 91 extra photos in `OdaraPIC.zip` weren't auto-attached to products —
  there was no reliable way to match them to the right item automatically.
  Use the admin panel's photo upload to attach the right one to each product
  by hand.
