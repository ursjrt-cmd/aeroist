# JRT Mart — jrt.com.in e-commerce website

This is the JRT Mart rebrand of the supplied storefront build. It preserves the supplied homepage structure, visual styling and mega-menu/category links, and adds a Supabase-powered catalogue, customer accounts, cart/checkout, Razorpay payment functions and an admin CMS.

## Included

- `index.html` — JRT Mart storefront and supplied homepage layout.
- `assets/jrtmart-app.css` and `assets/jrtmart-app.js` — storefront routes, cart, checkout, account login, admin dashboard and CMS.
- `config.js` — public Supabase URL and anon/publishable key placeholders.
- `categories.seed.json` — 116 category records extracted from the supplied menu.
- `supabase/schema.sql` — database tables, indexes, RLS policies, Storage bucket, category/page seed data and inventory trigger.
- `supabase/functions/` — Razorpay create-order, verify-payment and webhook Edge Functions.
- `vercel.json`, `netlify.toml`, `.htaccess` — SPA rewrite examples.
- `robots.txt` and `sitemap.xml` — JRT Mart domain references.

## 1. Supabase setup

1. Create a new Supabase project for JRT Mart.
2. Run the complete `supabase/schema.sql` in Supabase SQL Editor.
3. In Authentication → Users, create your owner/admin user.
4. Copy that user's UUID and run:

```sql
insert into public.user_roles(user_id, role)
values ('YOUR_AUTH_USER_UUID', 'admin')
on conflict (user_id) do update set role='admin';
```

5. In Project Settings → API, copy the Project URL and anon/publishable key into `config.js`:

```js
window.JRTMART_CONFIG = {
  supabaseUrl: 'https://YOUR_PROJECT_REF.supabase.co',
  supabaseAnonKey: 'YOUR_PUBLIC_ANON_OR_PUBLISHABLE_KEY'
};
```

The anon/publishable key is intended for browser use. Never place a `service_role` key, Razorpay secret, webhook secret or database password in browser code.

## 2. Razorpay payment setup

Install and link the Supabase CLI, then deploy the functions:

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase functions deploy create-razorpay-order --no-verify-jwt
supabase functions deploy verify-razorpay-payment --no-verify-jwt
supabase functions deploy razorpay-webhook --no-verify-jwt
```

Set secrets (start with Razorpay test keys):

```bash
supabase secrets set RAZORPAY_KEY_ID=rzp_test_xxxxxxxxx
supabase secrets set RAZORPAY_KEY_SECRET=YOUR_RAZORPAY_KEY_SECRET
supabase secrets set RAZORPAY_WEBHOOK_SECRET=YOUR_WEBHOOK_SECRET
supabase secrets set SITE_URL=https://jrt.com.in
```

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are used server-side by Supabase Edge Functions. Never expose the service-role key to the browser.

In Razorpay Dashboard, configure webhook URL `https://YOUR_PROJECT_REF.supabase.co/functions/v1/razorpay-webhook` and subscribe to `payment.captured` and `payment.failed`. Use the same webhook secret in Supabase. Test the complete order/payment/stock workflow before enabling live keys.

## 3. Admin panel

After deployment, visit `https://jrt.com.in/admin` and sign in with the Supabase Auth user assigned the `admin` role. Admin modules include:

- Products: create, edit, publish/unpublish and delete; SKU, prices, sale price, stock, description, image URL and upload.
- Categories: create, edit, sort, show/hide, image URL and upload.
- Pages and sections: create/edit/publish CMS pages and selector-based homepage content blocks.
- Navigation: manage top-level menu items and dropdown links.
- Orders: view orders and update fulfilment status.
- Quote requests: review and update enquiries.
- Store settings/design: brand name, tagline, logo, support details, announcement bar, theme colours, policies, shipping and tax settings, custom CSS and Razorpay enable/disable.

## 4. Routes

- `/` — homepage.
- `/products` — all published products.
- `/category/{slug}` and legacy category paths — category listings.
- `/product/{slug}` — product details.
- `/pages/{slug}` — CMS pages.
- `/account/login` — customer login/sign-up.
- `/account/orders` — signed-in customer order history.
- `/get-quote` — bulk enquiry form.
- `/admin` — protected admin dashboard.

Hosting must rewrite unknown routes to `/index.html`. Use the included Vercel, Netlify or Apache rewrite example.

## 5. Domain and publishing

1. Confirm you own/control `jrt.com.in` and add it to your hosting provider.
2. Deploy the contents of this project folder to your host (Vercel, Netlify or another static host).
3. Configure DNS records exactly as instructed by your hosting provider and enable HTTPS.
4. Add the Supabase URL and anon key to `config.js`.
5. Add `jrt.com.in` to Supabase Authentication → URL Configuration → Site URL and allowed redirect URLs, if required by your auth setup.
6. Deploy Edge Functions and configure Razorpay secrets/webhook.
7. Sign in at `/admin`, upload the JRT Mart logo, set support details, policies, shipping/tax settings and publish your real products.
8. Test on desktop/mobile, including direct category/product URLs, customer login, checkout, webhook and order status.
9. Only after test transactions and security review, activate Razorpay live credentials and enable Razorpay in Store Settings.

## Important launch requirements

- This package is generated source code, not a website already hosted at `jrt.com.in`. DNS, hosting, Supabase credentials, admin account and Razorpay merchant credentials must be supplied/configured by the site owner.
- The supplied source contained category/menu references but not a complete real product catalogue. The build includes 116 category entries; product SKUs, descriptions, prices, images, stock and shipping rules must be added and verified in Admin.
- Some original homepage stylesheets and images are still loaded from `factori.com` / `cdn.factori.com` to preserve the uploaded design. Confirm that you have permission to use these assets, or replace/self-host them with JRT Mart-owned/licensed assets before commercial launch.
- Social and WhatsApp contact destinations from the source operator have been neutralised. Add JRT Mart's verified social profiles, phone, email and address in the HTML/Admin before publishing.
- Policy pages are draft/unpublished. Add accurate company/legal details, GSTIN, privacy, terms, returns/refunds, shipping, pricing, consumer grievance and support disclosures before accepting orders. Do not publish placeholder or unverified business claims.
- Shipping and tax defaults are zero; configure actual rates and tax handling. Only Razorpay is integrated in this baseline; COD, other payment gateways, refunds, shipping-carrier integrations and tax invoice automation are not included.
- Have a qualified developer review RLS, payment idempotency, inventory oversell/race conditions, refund handling, tax calculation, rate limiting, spam prevention and privacy/legal compliance before production.

## Database tables

`user_roles`, `categories`, `products`, `pages`, `site_content`, `navigation_items`, `site_settings`, `orders`, `order_items`, `quote_requests` and `payment_events`. Public catalogue reads are limited to published records; admin mutations are protected by `public.is_admin()` and RLS. Payment Edge Functions use the service role server-side only.
