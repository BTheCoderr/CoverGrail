# CoverGrail

Premium Next.js MVP for comic collectors who want **pre-submission grade estimates** before paying third-party grading fees. Positioning: **before you slab it, scan it.** CoverGrail is **not affiliated with CGC or CBCS**; predictions are **educational pre-submission estimates**.

## Stack

- Next.js App Router (TypeScript)
- Tailwind CSS v4
- Supabase Auth + Postgres + Storage
- OpenAI vision → structured JSON (`lib/ai`) server-side only (or `MOCK_GRADE=true` for demos)
- Stripe-ready pricing UI + stub checkout route

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Create a Supabase project and run [`supabase/migrations/001_initial_schema.sql`](supabase/migrations/001_initial_schema.sql) in the SQL editor (or Supabase CLI).

3. In Supabase Authentication → URL configuration, add redirect URLs:

- `http://localhost:3000/auth/callback`
- Your production `/auth/callback`

4. Copy environment variables:

```bash
cp .env.example .env.local
```

Fill `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SITE_URL`, and `OPENAI_API_KEY` (unless using mock grading).

5. Run the dev server:

```bash
npm run dev
```

Visit `http://localhost:3000`.

## Product flows

- Landing: headline/subhead, problem → how it works → example result → pricing preview → dealer CTA → disclaimer.
- Magic-link auth at `/login`.
- App: `/dashboard`, `/scans/new`, `/scans/[id]`, `/collection`, `/pricing`.
- Uploads go to private bucket `scan-images` at `{user_id}/{scan_id}/…`.
- `POST /api/grade-scan` with `{ "scanId": "…" }` signs image URLs, runs OpenAI (or mock), writes `scan_results`, decrements `profiles.free_scans_remaining` on **free** plan after success.

## Stripe

Enable subscribe buttons when both `STRIPE_SECRET_KEY` and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` are set. Implement Checkout Session creation in [`src/app/api/create-checkout-session/route.ts`](src/app/api/create-checkout-session/route.ts) and verify webhooks in [`src/app/api/webhooks/stripe/route.ts`](src/app/api/webhooks/stripe/route.ts).

## Disclaimer

Language emphasizes **likely grade range**, **pre-submission**, and non-affiliation with CGC/CBCS everywhere.
