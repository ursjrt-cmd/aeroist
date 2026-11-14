# JRT Mart complete-store release report

## Build contents

- Combined the uploaded JRT Mart and Factori HTML references, retaining JRT Mart storefront identity and source business/category content while using the cleaner Factori source asset/CDN references where applicable.
- Responsive multi-route storefront with 116 source categories, desktop mega menu and mobile category navigation.
- Searchable catalogue, category routes, individual product details, image gallery, specifications, variant information, MOQ, quantity-tier pricing and inventory checks.
- Persistent cart, checkout and order confirmation, customer authentication/password recovery and signed-in order history.
- Quote/contact forms and informational/policy routes.
- Separate Supabase-authenticated admin console for products/pricing, categories/navigation, page and section CMS, orders, freight, enquiries, store information, bank/UPI display settings and Razorpay mode toggles.
- Supabase schema/seed, RLS policies, Storage bucket, price/MOQ/stock validating order RPC, cancellation/restock trigger, offline payment reconciliation and admin freight update RPC.
- Supabase Edge Functions for Razorpay order creation, payment verification and webhook reconciliation.
- Netlify and Vercel route configuration and secret environment example.

## Source-derived data imported

- 116 product categories.
- 9 page shells.
- 11 editable homepage sections.
- Store/contact/SEO/shipping defaults and disabled Razorpay defaults.
- No product SKUs, inventory, product prices or tax rates were invented.

## Checks completed in this runtime

- `node --check app.js` — passed.
- `node --check admin-console.js` — passed.
- `node tests/smoke-test.cjs` — passed. It checks required artifacts, source seed counts, app/admin feature markers, RLS/payment control markers and ensures only a public key is present in `config.js`.
- The test is static; it does not establish that Supabase/PostgreSQL, Razorpay, email delivery or a full browser flow works in production.

## Important launch dependencies

1. Confirm `config.js` points to the intended Supabase project.
2. Back up the database and apply `supabase/schema.sql` to a clean project or a reviewed migration target.
3. Run `supabase/seed.sql` once.
4. Create the first Supabase Auth staff user, then insert its UUID into `public.admin_users` as an owner/admin.
5. Configure Auth URLs, email delivery and storage.
6. Add real catalogue records and review source-derived business claims, client logos, business/legal details and policies.
7. Deploy the three Razorpay Edge Functions and set mode-specific API and webhook secrets. Configure Razorpay webhook events.
8. Complete end-to-end test-mode transactions and verified webhook tests before enabling live mode.
9. Verify tax, freight, order notifications, refund handling, fulfilment and customer support operations for the actual business.

## Not verified here

- SQL was not executed by a PostgreSQL server and was not applied to the live Supabase project.
- Edge Functions were not deployed or compiled in the Supabase/Deno runtime.
- No live Razorpay API credentials or webhook secret were provided, and no card/UPI transaction was attempted.
- No full visual/interactivity browser test was completed. A headless browser run did not complete within the available runtime.
- No production admin user, business data, customer data or product inventory was created.

The package is prepared for environment setup and deployment. It is not claiming a live, configured store or an activated production payment gateway.
