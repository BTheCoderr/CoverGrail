# CoverGrail

**AI-assisted pre-grading decision support for comic collectors — before you slab it, scan it.**

CoverGrail helps collectors review comic-book photos before paying for professional grading. Users upload a structured photo set, receive a predicted grade range with visible defect cues, and save the result to a private collection for later comparison with an official grade.

> CoverGrail is not affiliated with CGC, CBCS, or any grading company. Results are educational pre-submission estimates, not official grades, certifications, or appraisals.

**Live app:** https://covergrail.netlify.app

![CoverGrail production landing page](https://d33wubrfki0l68.cloudfront.net/6abc67e0109b6900087bdb37/screenshot_2026-09-30-01-38-08-0000.webp)

[Architecture](docs/ARCHITECTURE.md) · [Security model](docs/SECURITY.md) · [Deployment](docs/DEPLOYMENT.md)

## Product status

CoverGrail is running against its dedicated production Supabase backend.

- Real Supabase authentication and user-scoped persistence
- Private comic-image storage
- Row Level Security across user data
- Self-service account deletion
- Feedback and privacy-safe product telemetry
- Production grading currently runs in **mock mode** while the complete user flow is validated
- Live AI grading can be enabled independently after beta validation
- Stripe infrastructure is present but paid actions remain server-gated

Current runtime flags:

```text
NEXT_PUBLIC_DEMO_MODE=false
MOCK_GRADE=true
```

## What it does

### Pre-grade a comic

A collector uploads:

- front cover
- back cover
- spine
- up to four optional corner/detail photos

CoverGrail validates the images server-side and creates a private scan workspace.

### Review a structured grading estimate

The grading pipeline is designed to return:

- predicted grade range
- visible defect observations
- grading confidence/context
- pre-submission decision support

Duplicate grading requests are locked so a refresh or double-click cannot trigger multiple AI runs for the same scan.

### Build a private collection

Users can save scans and later record confirmed grades, making CoverGrail useful as both a pre-submission tool and a personal grading-history workspace.

## Architecture

```text
Browser
  |
  v
Next.js 16 / React 19
  |
  +--> Supabase Auth
  |
  +--> Supabase Postgres
  |      - profiles
  |      - comic_scans
  |      - scan_images
  |      - scan_results
  |      - confirmed_grades
  |      - beta_feedback
  |      - product_events
  |
  +--> Supabase Storage
  |      - private scan-images bucket
  |
  +--> Supabase Edge Functions
  |      - delete-account
  |
  +--> AI grading adapter
  |      - deterministic mock mode for beta
  |      - OpenAI-compatible live vision path
  |
  +--> Stripe-ready billing layer
```

## Security and privacy

CoverGrail treats uploaded comic photos and collection data as private user content.

Implemented safeguards include:

- Row Level Security on all exposed user-data tables
- owner-scoped database policies
- private Supabase Storage bucket
- owner-scoped storage policies
- server-only Supabase secret key
- publishable key only in browser-facing configuration
- atomic/idempotent scan-quota consumption
- browser users cannot modify billing, plan, or scan-credit fields
- grading concurrency lock
- server-side image signature validation
- JWT-protected account-deletion Edge Function
- full account cleanup including stored comic images
- privacy-safe telemetry that excludes comic titles, notes, photos, and grading reasoning
- dependency audit gates in CI
- no secrets committed to the repository

The Supabase Security Advisor currently reports no security findings for the production project.

## Upload safeguards

Accepted image formats:

- JPEG
- PNG
- WebP

Validation is performed from the file signature, not only the filename or browser-provided MIME type.

Limits:

- 12 MB per image
- up to 4 optional corner/detail images
- 60 MB combined upload limit

## Reliability

The repository includes automated checks for:

- regression tests
- ESLint
- production Next.js build
- production dependency audit
- critical vulnerability gate
- Deno type checking for Supabase Edge Functions
- Chromium end-to-end browser tests
- automated WCAG 2.0/2.1 A/AA checks with axe

Regression coverage currently includes core quota rules, scan-image ordering, and image-signature validation.

## Tech stack

- **Frontend:** Next.js 16, React 19, TypeScript
- **Styling:** Tailwind CSS v4
- **Authentication:** Supabase Auth
- **Database:** Supabase Postgres
- **Storage:** Supabase Storage
- **Serverless:** Supabase Edge Functions
- **AI:** OpenAI-compatible vision adapter / deterministic beta mock
- **Payments:** Stripe-ready integration
- **Hosting:** Netlify
- **CI:** GitHub Actions

## Routes

Public:

- `/` — landing page
- `/login` — magic-link authentication
- `/grading-guide`
- `/pricing`
- `/disclaimer`
- `/privacy`
- `/terms`

Authenticated:

- `/dashboard`
- `/scans/new`
- `/scans/[id]`
- `/collection`
- `/feedback`
- `/account`

Operational:

- `/api/health/auth-config` — safe Supabase connectivity diagnostics

## Local development

Install dependencies:

```bash
npm ci
```

Create local environment configuration:

```bash
cp .env.example .env.local
```

At minimum configure:

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
MOCK_GRADE=true
NEXT_PUBLIC_DEMO_MODE=false
```

For trusted server operations, configure one server-only Supabase admin credential:

```text
SUPABASE_SECRET_KEY=
```

Never prefix the secret key with `NEXT_PUBLIC_`.

Then run:

```bash
npm run dev
```

Open http://localhost:3000.

## Supabase setup

Database changes are tracked under:

```text
supabase/migrations/
```

The current production schema includes migrations for:

1. core scan and grading tables
2. billing fields
3. billing indexes
4. RLS/storage/quota security hardening
5. scan-image ownership indexing
6. beta feedback and privacy-safe telemetry

The account-deletion Edge Function lives under:

```text
supabase/functions/delete-account/
```

For magic-link authentication, Supabase Auth URL Configuration should include:

```text
Site URL:
https://covergrail.netlify.app

Redirect URL:
https://covergrail.netlify.app/auth/callback
```

For local development also allow:

```text
http://localhost:3000/auth/callback
```

## Testing

Run regression tests:

```bash
npm test
```

Run lint:

```bash
npm run lint
```

Run a production build:

```bash
npm run build
```

Run browser E2E + accessibility checks:

```bash
npx playwright install chromium
npm run test:e2e
```

GitHub Actions runs these checks automatically, installs Chromium for Playwright, runs the browser/accessibility suite, uploads the Playwright report, and validates the Supabase Edge Function with Deno.

## Production rollout

The safer rollout sequence is intentionally split:

1. real authentication + production Supabase
2. mock grading through the complete real user/data flow
3. live AI grading
4. paid billing after end-to-end validation

This keeps account, storage, RLS, deletion, and collection behavior testable without spending model credits during infrastructure validation.

## Disclaimer

CoverGrail provides educational pre-submission estimates based on submitted information and visible image evidence. Professional grading outcomes may differ because of image quality, defects not visible in photos, restoration, page quality, grader judgment, and other factors.
