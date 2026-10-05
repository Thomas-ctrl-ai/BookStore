# P&K Book Store

A responsive Next.js App Router storefront for P&K Book Store, with a PostgreSQL/Prisma catalog and orders, secure administrator sign-in, customer order lookup, private PDF-print order uploads, and a protected store dashboard. The original P&K logo is kept in `public/pnk-bookstore-logo.jpg` and displayed without alteration. Brand blue and generous type/spacing live in `app/globals.css` design tokens; English text has Myanmar-friendly font fallbacks.

## Requirements

- Node.js 20.9+ (Node 22 LTS recommended)
- A PostgreSQL 14+ database with SSL in hosted environments (Neon or another Vercel Marketplace provider)
- An S3-compatible **private** bucket for customer print PDFs (Cloudflare R2 or AWS S3)
- A secure administrator email/password. For production, provision the first account through a one-off trusted bootstrap command; the gated seed described below is for owner-managed development/initial setup.

## Local development

1. Install dependencies: `npm install`.
2. Copy `.env.example` to `.env.local`. Set `DATABASE_URL` and a random `AUTH_SECRET` of at least 32 bytes. Configure S3 credentials for private print uploads. Keep `.env.local` out of Git.
3. Generate Prisma Client and apply the checked-in database migration: `npm run db:generate`, then `npm run db:deploy`.
4. For a one-time local owner account, run `npm run admin:bootstrap` from an interactive terminal after configuring `.env.local`. It asks for the email and twice for a hidden password (at least 20 characters). It locks the database while checking for existing admins and permanently refuses if any admin account exists. Alternatively, for development only, temporarily set `ENABLE_ADMIN_SEED=true`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` (at least 16 characters) before running `npm run db:seed`, then set the seed flag back to `false`. Never enable seed-time admin creation on an unattended production deployment.
5. Run `npm run dev` and visit `http://localhost:3000`. Sign in at `/admin`.

Run `npm run db:migrate -- --name describe-change` after changing the Prisma schema locally; check the new migration into Git. Deploy checked-in migrations with `npm run db:deploy`. `npm run db:seed` adds six shop categories, clearly identified zero-priced sample listings, and a disabled print-pricing record; it does not invent book prices or print rates.

## Environment

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Yes for persistence | PostgreSQL URL. Use the provider's serverless-friendly/pooler URL on Vercel; enable TLS. |
| `AUTH_SECRET` | Yes | 32+ bytes used to sign short-lived single-use PDF upload authorization tokens. Generate with `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`. Admin sessions are opaque random tokens, SHA-256 hashed in PostgreSQL, HTTP-only, SameSite=Lax, and expire after seven days. |
| `S3_REGION` | Yes for print upload | Region (`auto` for R2). |
| `S3_ENDPOINT` | For S3-compatible services | Provider endpoint, for example `https://<account>.r2.cloudflarestorage.com`. Omit for AWS S3. |
| `S3_BUCKET` | Yes for print upload | A dedicated **private**, non-public object-storage bucket. |
| `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` | Yes for print upload | Restricted service credentials for the print-upload bucket. Limit access to this bucket. |
| `NEXT_PUBLIC_SITE_URL` | Recommended | Canonical application origin; configure the exact deployed HTTPS origin. |
| `ENABLE_ADMIN_SEED` | No; development only | Only the literal `true` enables seed-time initial admin creation. |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Only for explicit admin seed | Initial administrator credentials; password must be at least 16 characters. Never hardcode or commit these. |

### Private object storage

The app requests a 5-minute, content-type-bound pre-signed **PUT** URL, then uploads the selected PDF directly to the configured bucket without proxying its bytes through a serverless function. Order submission independently checks the unguessable, time-limited storage-key authorization, uploaded object's actual MIME type and size, configured size limit and choices, and file ownership fields before writing the private key and safe file metadata to PostgreSQL. The bucket must block all public access; this app never issues a public download URL. An authenticated admin may create a 60-second signed read URL for fulfillment, with access recorded in `AuditLog`, or delete the file while retaining the order record. The print-retention setting records the desired retention; file deletion after fulfillment or retention expiry currently requires staff action in `/admin`. Configure bucket CORS to allow `PUT` from the precise `NEXT_PUBLIC_SITE_URL` origin with the `Content-Type` header and `ETag` response exposure. CORS is not access control; keep the bucket private.

Initial maximum upload is 10 MiB; an admin may configure 1–100 MiB. PDF only. MIME type, suffix and size are validated at selection and on the server against object metadata. For higher assurance, add a malware-scanning/quarantine workflow and content-disposition download relay before operationally accepting sensitive files. File bytes are not stored in Postgres. Unsubmitted uploads expire through the signed URL but require a bucket lifecycle rule to clean up abandoned objects.

## Features and honest limits

- `/`: home, the supplied P&K logo and brand-blue tokens, categories, featured and recent inventory, printing, and delivery/payment information.
- `/shop`, `/shop?category=young-learners`, `/products/[slug]`: catalog search across title, author, ISBN and tags; categories, availability, relevance/newest/price sorting, responsive product details and load-more. The development seed is clearly marked and zero-priced; it cannot be purchased. Replace every sample with verified catalog facts, images, price and stock.
- `/cart`, `/checkout`: editable client cart; server re-pricing against active database products; conditional stock decrement in a transaction; generated P&K order reference; idempotency key; configurable delivery fee/free-delivery threshold; COD and configurable manual bank/mobile instructions. Checkout never declares an external transfer paid. No online card gateway, delivery carrier integration or customer email/SMS notification is configured.
- `/print`: validated PDF upload to private S3-compatible storage; print format, A4/A3, simplex/duplex, page range, copies, binding, pickup/delivery, address and copyright confirmation; review step; request/order reference. Page count is never guessed; requests start as **Quote required**. MMK estimates become possible only once the admin configures real per-page rates, activates pricing and a trustworthy page count is available; the current flow does not calculate PDF page counts, so quote review remains the correct default.
- `/account/orders`: order-reference-plus-phone lookup; normalized phone matching; no customer addresses, uploaded-file keys or download URLs are exposed.
- `/admin`: bcrypt-protected, role-checked admin session; sales dashboard/date range/chart; stock and order metrics; product create/edit/archive; customer-order and print-order status workflow with transition guardrails and audit records; authenticated file review/deletion; store settings and owner-entered print prices. Admin APIs repeat the server-side authorization check. Status records retain history.
- PostgreSQL stores inventory, users/sessions, orders, safe print-file metadata and storage keys, store configuration and audit records. Money uses whole MMK integers; no floating-point money values.

Payment instructions, the actual contact details, delivery fees, real books/prices/stock, and printing prices must be supplied by the owner in `/admin`. Add an email/SMS provider for customer notifications. Enable MFA and rate limiting at the deployment/provider edge for stronger admin protection. Initial-admin provisioning is intentionally opt-in; do not ship development seed credentials to production.

## Vercel deployment

1. Push this repository to GitHub and import it into Vercel.
2. Attach a PostgreSQL database from the Vercel Marketplace; set production `DATABASE_URL` to its application/pooler endpoint.
3. Create a private R2/S3-compatible bucket and a least-privilege credential. Set `S3_REGION`, `S3_ENDPOINT` when required, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `AUTH_SECRET`, and `NEXT_PUBLIC_SITE_URL` as Vercel environment variables. Configure the exact-site-origin bucket CORS above. Do not enable public bucket access.
4. Keep `ENABLE_ADMIN_SEED` off. For an initial production admin, use the linked Vercel project and database connection in a private local terminal: `npx vercel link`, then `npx vercel env pull .env.local --environment production`, `npm run db:deploy`, and `npm run admin:bootstrap`. The final command prompts for the owner email and a twice-entered, non-echoed password and is permanently closed after the first admin exists. Do not commit `.env.local`; delete it after bootstrap. Add store payment/delivery/contact config and verified catalog records in `/admin`.
5. Run `npm run db:deploy` once with the production database connection before promoting the deployment; deploy/build via `npm run build`.
6. In GitHub Actions or your release procedure run `npm run typecheck`, `npm run lint` and `npm test` before merging.

`npm run build` generates Prisma Client before compiling Next.js. The root `outputs/index.html` is the original standalone UI preview from before the complete-application brief; the application source lives at the repository root and uses `app/`.
