# CoverGrail Security Model

## Principles

CoverGrail uses defense in depth:

- authenticate at the application boundary,
- authorize again with Postgres RLS,
- keep uploads private,
- keep privileged credentials server-only,
- make sensitive state changes atomic,
- test security assumptions in CI.

## Credentials

Browser-safe:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` or legacy anon key

Server-only:

- `SUPABASE_SECRET_KEY`
- Stripe secret/webhook credentials
- live AI provider credentials

Server-only credentials must never use a `NEXT_PUBLIC_` prefix.

## Database authorization

All exposed CoverGrail user-data tables have RLS enabled.

Owner predicates use `auth.uid()` and restrict users to their own rows. UPDATE policies use both `USING` and `WITH CHECK`.

Billing fields such as plan, credits, and subscription state are intentionally excluded from normal authenticated UPDATE grants.

## Private storage

The `scan-images` bucket is private.

Storage policies require the first path segment to equal the authenticated user's ID. Application uploads also persist ownership metadata in `scan_images`.

## Upload controls

The server validates image signatures rather than trusting browser MIME labels or filename extensions.

Accepted formats:

- JPEG
- PNG
- WebP

Limits:

- 12 MB per image
- up to four optional corner/detail images
- 60 MB total upload set

## AI / grading controls

- duplicate grading requests are locked before model execution,
- structured responses are schema-validated,
- successful scans debit quota through an atomic idempotent RPC,
- mock grading is available for infrastructure validation without model spend.

## Account deletion

Account deletion runs in a JWT-protected Supabase Edge Function. Uploaded storage objects are deleted before the Auth user is removed.

## Telemetry

Product telemetry is intentionally limited to operational events such as scan creation or grading success/failure. It does not copy comic titles, user notes, uploaded images, or grading reasoning.

## Dependency and CI controls

CI runs:

- production dependency audit,
- critical-vulnerability gate,
- regression tests,
- lint,
- production build,
- Playwright E2E checks,
- axe accessibility checks,
- Deno Edge Function type checking.

## Reporting

Do not open a public issue containing credentials, private user data, or exploit details. Use a private contact channel for sensitive security reports.
