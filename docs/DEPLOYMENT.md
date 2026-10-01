# CoverGrail Deployment

## Production services

- **Web:** Netlify
- **Source:** GitHub `main`
- **Auth / Database / Storage / Edge Functions:** Supabase
- **Payments:** Stripe-ready server integration
- **AI:** live grading paused during current validation; sample output is marketing/demo-only

## Required Netlify environment

Browser-safe:

```text
NEXT_PUBLIC_SITE_URL=https://covergrail.netlify.app
NEXT_PUBLIC_SUPABASE_URL=<CoverGrail Supabase URL>
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<publishable key>
NEXT_PUBLIC_DEMO_MODE=false
MOCK_GRADE=true
```

Server-only:

```text
SUPABASE_SECRET_KEY=<secret key>
```

Optional/live integrations:

```text
OPENAI_API_KEY=
OPENAI_MODEL=
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_SINGLE_SCAN=
STRIPE_PRICE_COLLECTOR_MONTHLY=
STRIPE_PRICE_DEALER_MONTHLY=
```

## Supabase Auth URL configuration

Production Auth should allow:

```text
Site URL:
https://covergrail.netlify.app

Redirect URL:
https://covergrail.netlify.app/auth/callback
```

Local development may also allow:

```text
http://localhost:3000/auth/callback
```

## Safe release sequence

For audit #1, keep `MOCK_GRADE=true` until calibration is complete.

1. Open a feature branch and run CI.
2. Merge/deploy the web code **before** applying migration 007. With mock mode still enabled, the web release disables checkout and refuses to create fake grades without depending on the new grading-lock column.
3. Smoke-test public pages and confirm checkout is paused.
4. Apply `007_audit_1_blockers.sql` to the production Supabase project.
5. Verify the new `grading_started_at` column, restricted `comic_scans` grants, revoked `scan_results` insert grant, and `scan-images` bucket limits.
6. Re-run Supabase Security Advisor.
7. Smoke-test login, upload, saved history, feedback, and account deletion.
8. Keep live AI off. Enable it only in a private calibration environment after the production safety patch is verified.

## Beta rollout

Current production posture:

```text
real auth:     ON
real database: ON
real storage:  ON
demo mode:     OFF
mock results:   OFF
grading gate:   ON
live AI:        OFF
```

The next rollout gate is a successful non-grading smoke test through:

```text
login
  -> upload
  -> grading-paused state
  -> saved history
  -> feedback
  -> account deletion
```

After that, run a private calibration set of already-graded books before enabling live AI for any outside user.

## Rollback

Application rollback should use a known-good Netlify production deploy or a Git revert on `main`.

Database migrations should generally be forward-fixed rather than destructively rolled back unless the rollback plan has been tested and data impact is understood.
