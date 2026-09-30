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

Right now checkout captures orders as "pending" without collecting payment —
you follow up manually. Here's how to turn on real, international card
payments (plus Apple Pay / Google Pay automatically) using Stripe Checkout.
This also automatically emails the customer a payment receipt — no extra
email setup needed for that part.

**Why this approach:** your secret Stripe key must never be in frontend code
(anyone could read it and charge things to your account). So payment
creation happens in a Supabase Edge Function instead — a small server-side
function that runs on Supabase's infrastructure, not in the browser.

### One-time setup

1. **Create a Stripe account** at stripe.com if you don't have one. Complete
   their business verification (needed before you can accept live payments).

2. **Install the Supabase CLI** (only needed once, on your own computer):
   ```
   npm install -g supabase
   ```

3. **Link this project to your Supabase project**:
   ```
   cd odara-fashion
   supabase login
   supabase link --project-ref oidmhnqdhwcoqckeffeo
   ```

4. **Get your Stripe secret key**: Stripe Dashboard → Developers → API keys →
   copy the **Secret key** (starts `sk_test_...` while testing, `sk_live_...`
   when you're ready for real payments).

5. **Set your secrets** (replace the values):
   ```
   supabase secrets set STRIPE_SECRET_KEY=sk_test_...
   supabase secrets set SITE_URL=https://yoursite.com
   ```

6. **Deploy both functions**:
   ```
   supabase functions deploy create-checkout-session
   supabase functions deploy stripe-webhook --no-verify-jwt
   ```

7. **Connect the webhook**: Stripe Dashboard → Developers → Webhooks → Add
   endpoint. URL is:
   ```
   https://oidmhnqdhwcoqckeffeo.supabase.co/functions/v1/stripe-webhook
   ```
   Select event: `checkout.session.completed` (and `checkout.session.expired`
   if you want failed/abandoned payments tracked too). After creating it,
   Stripe shows a **Signing secret** (`whsec_...`) — copy it and run:
   ```
   supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
   ```

8. **Turn on automatic receipt emails** (so customers get a payment
   confirmation with zero extra code): Stripe Dashboard → Settings →
   Customer emails → enable "Successful payments".

9. **Flip the switch**: in `.env.local`, set `VITE_PAYMENTS_ENABLED=true`,
   redeploy your site (or restart `npm run dev` locally).

### Testing before going live

Use Stripe's test card `4242 4242 4242 4242`, any future expiry date, any
CVC. Orders will show up in the admin's **Orders** tab with `payment_status:
paid` once the test payment completes. Switch `sk_test_...` → `sk_live_...`
(and redeploy the functions) only once you're ready for real charges.

### What the admin sees

The **Orders** tab now shows a **Payment** column (unpaid / paid / failed)
separate from the fulfillment **Status** column (pending / processing /
shipped / delivered) — so you can tell "paid, not shipped yet" apart from
"placed but never paid."

## Notes on today's catalog

- Real photos and prices from your partner store and your own
  `CatalogueODARA.xlsx` are already in `src/data/products.js`.
- A few placeholder items (stock-photo hijabs, perfumery oils) are clearly
  marked in that file — replace them anytime from the admin panel.
