# Odara Fashion — Supabase Setup

Your site works right now with no database (it reads `src/data/products.js`).
These steps connect it to a real Postgres database with a full admin panel.
Nothing breaks if you do this later — the storefront already knows how to
use either source.

## 1. Get your real API key

1. Go to your project: https://supabase.com/dashboard/project/oidmhnqdhwcoqckeffeo/settings/api
2. Copy the **Project URL** and the **anon / public** key (a long string starting `eyJ...`, a few hundred characters).
3. Open `.env.local` in the project root and set:
   ```
   VITE_SUPABASE_URL=https://oidmhnqdhwcoqckeffeo.supabase.co
   VITE_SUPABASE_ANON_KEY=<paste the full anon key here>
   ```
4. Restart `npm run dev` after saving.

## 2. Create/update the database tables

1. In Supabase: **SQL Editor → New query**.
2. Open `sql/schema.sql` from this project, paste the whole file in, click **Run**.
   This is always safe to re-run, even if you've run an older version before —
   it patches missing columns/tables/policies instead of skipping them.
3. New query, paste the whole `sql/seed_products.sql`, click **Run**. This loads
   the current catalog into the database.

**If you ever see an error like `column "X" of relation "Y" does not exist`**,
it means your database has an older table shape than this `schema.sql`
expects — just re-run the current `schema.sql` again, it'll add whatever's missing.

## 3. Create the image storage bucket

1. **Storage → New bucket**.
2. Name it exactly `product-images`, toggle **Public bucket** on, create it.

## 4. Create your first admin login

1. **Authentication → Users → Add user.** Set an email and password.
2. Back in **SQL Editor**, run (replace the email):
   ```sql
   insert into profiles (id, email, is_admin)
   select id, email, true from auth.users where email = 'you@odarafashion.com'
   on conflict (id) do update set is_admin = true;
   ```
   This is the one-time SQL step. It works whether or not a `profiles` row
   already exists for that user (covers both cases).

## 5. Sign in

Go to `yoursite.com/admin/login`, sign in with that email/password. You'll land
on the dashboard: **Overview** (charts), **Products** (search, add, edit,
delete, upload photos), **Orders**, **Subscribers**, and **Team**.

## Adding more admins (no SQL needed after the first one)

Step 4 above is the *only* time you need SQL for this.
1. Have the new person sign in once at `/admin/login` (they'll see "This
   account doesn't have admin access" — that's expected, it just means their
   account now exists in the system).
2. You sign in, go to the **Team** tab, flip the toggle next to their email.

They can sign in normally from then on — no more SQL.

## What changes once this is live

- The public storefront keeps working instantly from the bundled catalog,
  then quietly swaps in live data from Supabase in the background — so if the
  database is ever unreachable, customers still see a working site.
- Anything you add/edit/delete in `/admin` shows up on the live site on refresh.
- Product photos you upload in the admin go to Supabase Storage and get a
  permanent public URL.
- Every "Subscribe"/"Join" form saves the email — see it under **Subscribers**
  (with a CSV export button).
- Checkout creates a real order (name, email, phone, address, items, total)
  even though online payment isn't wired up yet — captured as "pending" so you
  can follow up manually. See it under **Orders**; click a row to expand full
  details, and change its status from the dropdown.
- Each product can have multiple photos (e.g. one per color) — the admin's
  photo uploader lets you add several, star one as the cover, remove any.

## If checkout ever shows "something went wrong placing your order"

The error message now includes the actual database error (not just a generic
message) — read what it says first. The most common cause is the same as
above: your `orders` table is missing a column this version expects. Re-run
`sql/schema.sql` and try again.

## Accepting real payments (Stripe)

Customers pay on Stripe's own secure page (cards, Apple Pay, Google Pay). Your site
never sees card numbers. Payment is created by two small server functions on Supabase;
your Stripe **secret** key lives only there, never in the website.

**What's protected for you:** the server looks up every price from your products table,
so nobody can edit a request to pay less. Shipping, discount codes and the total are
all calculated on the server and Stripe is charged exactly that amount.

### One-time setup

1. **Stripe account** — create one at stripe.com and finish business verification.
   Add your bank account inside Stripe (Settings → Business → Bank accounts) so payouts reach you.
2. **Supabase CLI** (once, on your computer): `npm install -g supabase`, then in this folder:
   ```
   supabase login
   supabase link --project-ref oidmhnqdhwcoqckeffeo
   ```
3. **Re-run `sql/schema.sql`** in Supabase → SQL Editor (safe to re-run any time).
4. **Secrets** (Stripe Dashboard → Developers → API keys → *Secret key*, starts `sk_test_` while testing):
   ```
   supabase secrets set STRIPE_SECRET_KEY=sk_test_...
   supabase secrets set SITE_URL=https://odara-fashion.vercel.app
   supabase secrets set ADMIN_EMAIL=you@yourmail.com
   ```
   `SITE_URL` is where customers return after paying — set it to your real site address.
5. **Deploy both functions:**
   ```
   supabase functions deploy create-checkout-session
   supabase functions deploy stripe-webhook --no-verify-jwt
   ```
6. **Connect the webhook** — Stripe Dashboard → Developers → Webhooks → Add endpoint:
   `https://oidmhnqdhwcoqckeffeo.supabase.co/functions/v1/stripe-webhook`
   Events: `checkout.session.completed` and `checkout.session.expired`. Stripe then shows a
   *Signing secret* (`whsec_...`):
   ```
   supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
   ```
7. **Turn payments on in the website.** `.env.local` only works on your own computer. For your
   live site on Vercel: *Project → Settings → Environment Variables*, add
   `VITE_PAYMENTS_ENABLED` = `true` (plus `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` if
   they aren't there already), then **Redeploy**.
8. **Customer receipts** — Stripe Dashboard → Settings → Customer emails → switch on
   *Successful payments*. (Stripe only sends receipts for real payments, not test ones.)

### Using a restricted Stripe key (rk_live_… / rk_test_…)

Restricted keys are the safer choice. The checkout function only needs **one** permission:
**Checkout Sessions → Write**. Discount codes no longer create Stripe coupons (the discount is built
into the prices Stripe shows), so **no "Coupons" permission is needed**. After updating the function
code, redeploy it so the change goes live:
`supabase functions deploy create-checkout-session`
If a checkout ever fails, customers see a short friendly message; the real reason is in
Supabase → Edge Functions → create-checkout-session → Logs.

### Emails from your own site (optional)

The webhook can also email the customer and you through Resend (resend.com):
```
supabase secrets set RESEND_API_KEY=re_...
supabase secrets set EMAIL_FROM="Odara Fashion <orders@yourdomain.com>"
```
**Important:** until you verify your own domain in Resend, Resend only delivers to the address you
signed up with. So the "new paid order" email to **you** works straight away, but emails to
**customers** need a verified domain. Until then, rely on Stripe's receipts (step 8).
Never put the Resend or Stripe secret keys in `.env.local` or any file in this project.

### Test first

With `sk_test_...`, pay with card `4242 4242 4242 4242`, any future date, any CVC. The order
appears in **Admin → Orders** as *paid*. Try a discount code and a wrong code too.

### Going live (do this once, in order)

1. Stripe: switch the dashboard from *Test mode* to *Live*, and finish activating the account.
2. Copy the **live** secret key: `supabase secrets set STRIPE_SECRET_KEY=sk_live_...`
3. Live mode has its **own** webhook: add the same endpoint URL again while in *Live* mode, then
   `supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...` with the **new** live signing secret.
   (Using the test one is the #1 reason live payments get charged but never show as paid.)
4. Redeploy the functions (step 5) so they pick up the new keys.
5. Place one real small order yourself and confirm it shows as paid in Admin → Orders.

### What the admin sees

Admin → Orders shows a **Payment** column (unpaid / paid / failed) separate from the fulfilment
**Status**. Orders include the customer's color/size, any discount code, shipping, and — for
custom scents — the exact blend recipe to make. Abandoned checkouts become *failed* after ~35 minutes.

### Not handled yet

- **Sales tax** isn't added. Ask your accountant what you must collect in Ohio and for out-of-state
  customers (Stripe Tax can automate it).
- **Stock** is checked at checkout (a sold-out product can't be bought) but isn't reduced
  automatically when an order is paid — update stock in Admin → Products.

## Notes on today's catalog

- Real photos and prices from your partner store and your own
  `CatalogueODARA.xlsx` are already in `src/data/products.js`.
- A few placeholder items (stock-photo hijabs, perfumery oils) are clearly
  marked in that file — replace them anytime from the admin panel.

## Perfumes, Perfumery Oils and The Odara Muse

- **Perfumes** and **Perfumery Oils** are now two separate sections. Perfumes are
  split by company (Almas, Lattafa, Armaf, Afnan, Rasasi, Al Haramain, Ard Al
  Zaafaran). When you add/edit a product in the admin, pick the **Perfumes**
  category and a **Brand** chip appears. Type any other brand name and it gets
  its own tab automatically. Perfumery Oils have no sub-categories.
- **The Odara Muse** is a showcase you control from the admin's **Muse** tab:
  click **Add Look**, pick a product, upload the photo to show for it (a tall
  photo of a woman wearing the piece looks best), and optionally label it
  *New Arrival* or *Best Seller*. Use the arrows to reorder and the switch to
  hide a look. The first 5 shown appear on the home page and all of them on
  `/muse`. Until you add one, the section automatically shows your newest products.
- After updating the code, **re-run `sql/schema.sql`** once in Supabase. It adds
  the `brand` column, the `muse_items` table (for the Muse showcase) and merges the old "Fragrances"/"Dubai Fragrances"
  categories into "Perfumes". (Don't re-run `seed_products.sql` on a live store —
  it wipes the products table.)
- Existing perfumes have no brand yet — open each one in the admin and tick its
  brand. Until then they show under **All** only.

## Home page, search, New Arrivals, Best Sellers and the 10% pop-up

Everything below is managed from the admin — no code needed.

- **New Arrivals** and **Best Sellers** sections on the home page: open a product
  in **Admin → Products** and tick **New Arrival** and/or **Best Seller**. Ticked
  products appear in those sections (newest first) and on `/shop?tag=new` and
  `/shop?tag=best`. A section with nothing ticked simply doesn't show.
- **The Odara Muse** (how the pieces look on real customers) sits right before
  "Create Your Signature Scent". Manage it in **Admin → Muse**.
- **Shop by Category** tiles are built automatically from your product categories.
- **Search**: the magnifier in the menu searches names, categories, brands, colors
  and descriptions. Results page: `/search?q=…`.
- **10% welcome pop-up + announcement bar**: **Admin → Offers**. Turn each on/off,
  change the percentage, the code and the delay. Emails the pop-up collects appear
  under **Subscribers**. The code is applied automatically at checkout and can be used
  once per email address (checked on the server).
- **Re-run `sql/schema.sql`** once. It adds the Best Seller flag, the `site_settings`
  table (Offers), discount columns on orders, and the secure `create_order` /
  `validate_promo` functions. (`sql/orders_fix.sql` contains just those functions and
  is only needed if you can't re-run the whole schema.)
- **If online payments are switched on**, re-deploy the checkout function once so it
  understands discount codes:
  `supabase functions deploy create-checkout-session`
  (I could only check this file's syntax here — test one discounted payment with
  Stripe's test card before going live.)

## The redesigned home page: New Arrivals, Best Sellers, Reviews, Quick Add

- **Hero**: full-width photo slider (three slides, your own photos). The photos live in
  `src/assets/hero/`; swap files there to change them.
- **Admin → New & Best**: pick which products appear under **New Arrivals** and **Best Sellers**
  and put them in order with the arrows. (The star on a product in Admin → Products still works
  for Best Sellers.) The menu items *New Arrivals* and *Best Sellers* open those lists.
- **Admin → Reviews**: customers can write reviews on each product page. They stay hidden until you
  press **Publish**. You can also add a genuine review you received elsewhere (WhatsApp, Instagram…).
  Nothing is shown on the home page until at least one review is published — no made-up reviews.
- **Announcement bar**: rotates through your real offers by itself — *Free shipping over $X* (set
  the amount in Admin → Offers & shipping) and the welcome discount. Add an extra message if you want.
- **Quick Add** on every product card, a slide-in bag instead of pop-ups, and a mobile-first checkout
  (collapsible summary, sticky pay button, state/country fields, autofill).
- **Re-run `sql/schema.sql`** once. It adds the reviews table and the New & Best ordering, and it
  also fixes an "infinite recursion in policy for relation profiles" error that made every admin
  permission check fail on a freshly built database.

## Colors, names, photos and your own sizes (Admin → Products → edit a product)

- **Colors & names**: add a **Color** (shows a color dot) or a **Name** (shows its name as a button — use this for the
  different scents of one perfume). Each one has its **own photo** and its **own sizes**.
- **Photo per color/name**: pick one of the product's photos, or upload a new one. On the shop, clicking the color/name
  changes the big photo (and the photo in Quick Add and in the bag). Hovering a color dot on a product card previews it.
- **Sizes**: clothes get US/letter sizes, perfumes and oils get **30 ml / 50 ml / 100 ml** — and for any product you can
  **type your own size** (e.g. "75 ml", "One size") and press Enter. Sizes always show in a sensible order.
- **Price for each size**: below the sizes, every size the product is sold in has its own price box (e.g. 50 ml → 59.99,
  100 ml → 89.99). Leave one empty to use the normal product price. Shoppers see "From $59.99" on the shop and the exact
  price once they pick a size; the bag, checkout and Stripe all charge that size's price. The server does the pricing, so it
  can't be changed from the browser.
  **One-time step:** run `sql/size_prices.sql` in Supabase → SQL Editor (new query → paste → Run). Until you do, the
  price boxes show but saving a price tells you to run it. (If you re-run `RUN_ME_FIRST.sql` instead, it includes this too.)
