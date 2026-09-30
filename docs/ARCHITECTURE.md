# CoverGrail Architecture

## Purpose

CoverGrail is a Next.js application for pre-submission comic grading support. The system separates browser-safe operations from trusted server operations and keeps comic images private by default.

## Request flow

```text
Browser
  |
  v
Next.js App Router
  |
  +-- Supabase Auth
  |     +-- magic-link session
  |
  +-- Supabase Postgres
  |     +-- user-owned scans/results/collection
  |     +-- RLS authorization
  |
  +-- Supabase Storage
  |     +-- private scan-images bucket
  |
  +-- Grading route
  |     +-- ownership check
  |     +-- grading lock
  |     +-- signed image URLs
  |     +-- mock/live grading adapter
  |     +-- structured result validation
  |     +-- idempotent quota debit
  |
  +-- Supabase Edge Function
        +-- JWT-protected account deletion
```

## Trust boundaries

### Browser

The browser receives only the Supabase project URL and a publishable/anon key. It never receives the Supabase secret key or Stripe secret.

### Next.js server

Server Actions and Route Handlers validate the current user and perform operations using the user's session whenever possible. Trusted billing operations may use the server-only Supabase secret client.

### Database

RLS is the final authorization layer for exposed tables. User-facing tables are owner-scoped. Billing and quota fields are not directly writable by browser clients.

### Storage

Comic photos are stored in the private `scan-images` bucket. Object paths are namespaced by user ID and protected by owner-scoped policies.

## Grading lifecycle

1. User creates a scan and uploads validated JPEG/PNG/WebP files.
2. Server stores images under the authenticated user's private path.
3. User requests grading.
4. The scan row is atomically moved into `grading` state only from an allowed pre-grade state.
5. Signed URLs are produced for private images.
6. The grading adapter returns a structured result.
7. The result is validated and persisted.
8. Scan quota is consumed atomically and idempotently.
9. Product telemetry records operational status only, not private comic content.

The grading lock protects against repeated refreshes or double-clicks launching duplicate model calls.

## Account deletion

The browser invokes the JWT-protected `delete-account` Edge Function.

The function:

1. validates the user JWT,
2. pages through all owned image paths,
3. removes storage objects in batches,
4. deletes the Auth user,
5. relies on database foreign-key cascades to remove owned application records.

## Deployment model

- GitHub `main` is the production source branch.
- GitHub Actions validates dependencies, tests, lint, production build, browser accessibility, E2E behavior, and Edge Function types.
- Netlify builds and hosts the Next.js application.
- Supabase hosts Auth, Postgres, Storage, and Edge Functions.
- Production currently uses real auth/data infrastructure with mock grading enabled.
