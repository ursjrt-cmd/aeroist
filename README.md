# JRT Mart — Complete Storefront, CMS Admin and Payment Integration

This project combines the two uploaded HTML references:

- `reference/jrt-mart-original.html` supplies the JRT Mart identity, B2B/wholesale copy, original route/category terminology and Supabase project values.
- `reference/factori-original.html` supplies the corresponding cleaner Factori source asset/CDN references and visual/content reference material.

The public experience is rebuilt as a responsive multi-route storefront rather than relying on the captured HTML's missing server routes. The JRT Mart brand is used in the application. The seed imports 116 source categories, nine page shells and 11 home-page content sections. The product catalogue is intentionally empty until you add approved products and prices.

## What is included

### Public storefront

- Responsive home page, desktop mega menu, full mobile category menu and search.
- All 116 source categories, including editable groups, icons, images and menu ordering.
- Product catalogue, category filters, sorting, product detail pages, galleries, specifications, variants text, MOQ, inventory and quantity price tiers.
- Persistent cart, checkout, order request creation and order confirmation.
- Customer registration, sign-in, password reset and signed-in order history.
- Bulk quote, contact and enquiry submission.
- About, manufacturing, shipping, returns/refund, pricing/payment, privacy and terms pages, plus other source-linked information routes.
- Store identity, announcement, contact details, social links, SEO text, footer copy and public payment instructions loaded from Supabase.

### Separate admin console

Open `/admin` (or `/admin.html`). Access is through Supabase Auth plus an explicit row in `public.admin_users`; there is no default username/password and public customer registration does not grant admin access.

The console includes:

- **Overview:** catalogue, order and enquiry summaries.
- **Products & pricing:** create/edit/publish/unpublish/delete products; SKU, category, base price, MRP/compare-at price, MOQ, stock, tax rate, unit name, main image upload, gallery URLs, short/full descriptions, specifications JSON, variant JSON, quantity-tier pricing JSON, SEO metadata and featured status.
- **Categories & menus:** add/edit/hide/reorder categories, groups, icons and category imagery; rename propagation updates linked product category labels.
- **Pages & sections:** create/edit/publish pages, SEO titles/descriptions, and add/edit/reorder/hide/delete content sections. Section types include hero, trust strip, category/product grids, manufacturing, clients/logos, offerings, credentials, values, media, FAQ, CTA, rich text, image/text and stats. Section and category images can be uploaded to Supabase Storage.
- **Orders & payments:** customer/company/address/notes, items, SKUs, unit prices, line tax snapshot, subtotal, freight, total, order status, payment method and payment audit references. Staff can set final gross freight for unpaid offline orders. Online Razorpay payment states are changed only by verified callbacks/webhooks.
- **Enquiries:** view quote/contact enquiries and update their handling state.
- **Store information:** name, tagline, logo, footer, support contacts, address, GSTIN, currency/locale, SEO, announcement, social links and shipping configuration.
- **Payment setup:** Razorpay test/live mode, gateway enable/disable, currency, manual bank/UPI display details and customer instructions. Provider secret keys are not entered into the public site or the admin browser form.

## 1. Confirm the Supabase project configuration

`config.js` is prefilled from the JRT Mart upload with the project URL and a **public publishable key**. Confirm that it is the intended production project before deploying. If you are using another project, change `supabaseUrl` and `supabaseAnonKey` in `config.js` to that project's URL and public publishable/anon key.

Never add a Supabase `service_role` key, Supabase secret key, database password, Razorpay key secret or webhook secret to `config.js`, HTML, JavaScript, Git or browser storage.

## 2. Apply the database schema and source seed

1. Back up the target Supabase project.
2. Open Supabase Dashboard → **SQL Editor**.
3. Run `supabase/schema.sql`.
4. Run `supabase/seed.sql` once after the schema succeeds.
5. Check that the tables/policies exist and that Storage contains the `jrt-product-images` bucket.

**Database caution:** the schema is written for a clean JRT Mart project and contains a small set of additive migrations for the earlier starter schema. If your project already contains customised tables or production orders, do not blindly run the file. Compare the existing schema and create a reviewed migration/backup first.

The seed inserts the 116 categories, nine page shells, 11 homepage sections, public store settings and disabled Razorpay defaults. It does **not** invent product SKUs, prices, stock or inventory. Add real products using the admin console after creating your first admin.

## 3. Create the first administrator

1. In Supabase Dashboard → **Authentication → Users**, create a staff user with the intended admin email and a strong password.
2. Copy that Auth user's UUID.
3. In SQL Editor, run this with the real UUID:

```sql
insert into public.admin_users(user_id, role)
values ('PASTE-AUTH-USER-UUID-HERE', 'owner');
```

4. Visit `https://YOUR-DOMAIN/admin` and sign in with that Auth email/password.
5. Use **Forgot password?** on the admin sign-in screen for a reset email. The reset link returns to `/reset-password`.

Only users listed in `public.admin_users` can use the admin console. Database RLS policies, not just front-end visibility, protect product/category/CMS writes, customer order access and payment reconciliation. The schema intentionally limits staff roles to `owner` and `admin` for this release; both are currently full administrators.

## 4. Configure Supabase Auth URLs

In Supabase Dashboard → Authentication → URL Configuration:

- Set Site URL to your final HTTPS production domain.
- Add the production redirect URL and local development URL to the allowed redirect URLs (for example `https://YOUR-DOMAIN/**` and `http://localhost:5500/**`).
- Ensure `/reset-password` is allowed.
- Configure email confirmation and SMTP for customers/admins according to your production policy.

## 5. Run locally

Use a local web server; do not open the entry page through `file://` because the application uses ES modules and Supabase Auth.

```bash
cd JRT-MART-COMPLETE-STORE
python -m http.server 5500
```

Then open `http://localhost:5500`. The separate admin page is `http://localhost:5500/admin.html` (or `/admin` when served with the included host rewrite).

Run the static smoke test with Node.js:

```bash
node tests/smoke-test.cjs
```

The test checks JavaScript syntax, required files, seed counts, admin/database feature markers and public/private key separation. It is a **static smoke test**, not a live Supabase/PostgreSQL, Razorpay or full visual-browser test.

## 6. Deploy the site

### Netlify

Set the publish directory to the project folder (the folder containing `index.html`). The included `_redirects` and `netlify.toml` handle the SPA routes and `/admin` route.

### Vercel

Import the folder as a static project. The included `vercel.json` routes public paths to `index.html` and the `/admin` path to `admin.html` while preserving the standalone admin page.

After the domain is live, update Supabase Auth URLs and test the home page, catalogue, category/product URLs, customer account, admin, password reset and forms on the deployed HTTPS site.

## 7. Configure Razorpay online payments

The payment flow is implemented, but **real payments stay disabled until you add your own Razorpay API credentials, webhook secrets, deploy all three Supabase Edge Functions and complete successful test transactions**. No merchant account or secret credentials were supplied with the uploads.

### Add server-only secrets

Copy `.env.edge.example` to `.env.edge`, replace every placeholder with the values from your Razorpay Dashboard, and keep `.env.edge` out of version control. It is ignored by `.gitignore`.

Required Edge Function secrets:

```text
RAZORPAY_TEST_KEY_ID
RAZORPAY_TEST_KEY_SECRET
RAZORPAY_TEST_WEBHOOK_SECRET
RAZORPAY_LIVE_KEY_ID
RAZORPAY_LIVE_KEY_SECRET
RAZORPAY_LIVE_WEBHOOK_SECRET
```

Use the Supabase CLI from the project root:

```bash
supabase login
supabase link --project-ref pnkligkfknzmqyclbbqz
supabase secrets set --env-file .env.edge
supabase functions deploy razorpay-create-order
supabase functions deploy razorpay-verify-payment
supabase functions deploy razorpay-webhook
```

The function config in `supabase/config.toml` enables JWT verification on customer create/verify functions and disables JWT verification only for the webhook endpoint. Supabase injects its own project URL/server credentials into Edge Functions; do not copy a server key into the frontend.

### Configure the Razorpay webhook

Set the webhook URL in the Razorpay Dashboard to:

```text
https://YOUR-SUPABASE-PROJECT.supabase.co/functions/v1/razorpay-webhook
```

Subscribe to these events:

- `payment.authorized`
- `payment.captured`
- `payment.failed`
- `order.paid`
- `refund.processed`

Use the matching webhook secret from the current Razorpay mode. The handler verifies Razorpay's HMAC against the exact raw request body and uses event IDs for idempotency. It checks stored order/payment references, amount, currency and test/live mode before changing an order.

### Enable and test it in the admin console

1. Deploy the functions and configure **test** API keys and the test webhook secret.
2. In `/admin` → **Payment setup**, select Razorpay, choose **Test / sandbox**, keep currency as INR and enable online payments only after the test credentials are set.
3. Set store shipping mode to **Fixed** or **Free above order threshold** for online checkout. If freight is still `Quote freight after order review`, Razorpay is intentionally hidden and the database rejects online payment; customers may submit an offline/pay-after-confirmation order instead.
4. Place a test order with a signed-in customer account. Confirm the browser callback and webhook both update the payment ledger/order correctly. Test a failed payment and retry on the same gateway order.
5. After test success, add the live API/webhook secrets, configure the live webhook endpoint with the live secret, select **Live payments**, and complete a small real-money transaction/refund test before public launch.

Razorpay checkout creates the gateway order on the server using the server-calculated JRT Mart order total. The callback signature is checked, then the payment is fetched from Razorpay and verified for order ID, amount, currency and captured state. Webhooks provide the server-to-server reconciliation path. The browser never marks a Razorpay order paid on its own.

### Offline payments and shipping quotes

- The admin can publish bank transfer and UPI instructions in **Payment setup**. These details are visible to customers at checkout when manual payment is enabled; enter only the intended public payee information.
- For bank/UPI receipts, an admin must independently verify that funds have cleared before using the offline reconciliation control to mark an order paid.
- With shipping mode set to **Quote freight after order review**, staff can use **Set freight** on an unpaid offline order. The database updates the freight amount and payable total. Enter the final gross shipping amount, including any shipping-related tax amount that your invoicing process requires; shipping GST is not independently itemised by this build.
- Fixed shipping and free-above-threshold shipping are calculated server-side when the order is created.

## 8. Pricing, tax, inventory and order behavior

- Quantity price tiers are stored on each product and the order RPC selects the highest valid `min_qty` tier. Browser-submitted prices/totals are not trusted.
- The database checks MOQ, product activity and tracked stock, locks the product rows and reserves stock as part of order creation. Cancelled orders restore tracked stock once.
- Product-level `tax_rate` is calculated and snapshotted to the order item. Confirm applicable GST, tax rates, rounding, shipping tax, export tax and invoice treatment with your accountant before use.
- Shipping can be `quote`, `flat`, or `free_over_threshold`. Quote freight is set by staff on the unpaid offline order; online Razorpay checkout is restricted until final shipping is known.
- No automatic courier booking, shipping label, email/SMS notifications, invoice PDF generation, promo-code engine or automatic Razorpay refund initiation is included. Razorpay refunds can be initiated through the Razorpay Dashboard; the verified webhook updates the payment history when Razorpay sends the refund event. Partial refunds are recorded without incorrectly marking the full order refunded.

## 9. Review before public launch

- Verify store name, address, email, phone, GSTIN, social URLs and legal business entity information.
- Review every source-derived company/factory/country/delivery statistic for accuracy before publication. The two supplied HTML versions contain different claims in some places.
- Confirm that all client logos, brand names, videos and Factori CDN images are authorised for JRT Mart's use on the new domain.
- Add approved product records, prices, MOQ, quantity tiers, tax rates, stock and real product photographs.
- Replace/review the starter privacy, terms, shipping, returns/refunds and payment wording with your approved policies.
- Set shipping mode/rates and confirm gross freight/tax handling.
- Verify Razorpay test/live credentials, webhook secret, webhook events and callback verification before charging a real customer.
- Add anti-spam/rate limiting and order notification/operations integrations appropriate to your traffic.
- Add your final canonical domain, social preview assets, analytics IDs and search console setup.

## Known boundaries / verification status

The source code and static checks are prepared, but this environment has not applied the schema/seed to your live Supabase database, created the production admin user, deployed the Edge Functions, or executed a real Razorpay test payment. A real-browser visual/interactivity test and PostgreSQL execution were not completed here. The downloadable package is ready for your environment setup and deployment; live payments are **not active** until the steps above are completed.
