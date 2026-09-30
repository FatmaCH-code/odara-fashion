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

## Notes on today's catalog

- Real photos and prices from your partner store and your own
  `CatalogueODARA.xlsx` are already in `src/data/products.js`.
- A few placeholder items (stock-photo hijabs, perfumery oils) are clearly
  marked in that file — replace them anytime from the admin panel.
