# CoverGrail Deployment

## Production services

- **Web:** Netlify
- **Source:** GitHub `main`
- **Auth / Database / Storage / Edge Functions:** Supabase
- **Payments:** Stripe-ready server integration
- **AI:** mock grading during current beta validation; live provider can be enabled independently

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

1. Open a feature branch.
2. Update code and migration/function source.
3. Run CI.
4. Apply verified database migration if required.
5. Deploy/update Edge Functions if required.
6. Merge only after checks pass.
7. Confirm Netlify deploy points to the merge commit.
8. Run production smoke tests on desktop and mobile viewports.
9. Re-run Supabase Security Advisor after DDL/security changes.

## Beta rollout

Current production posture:

```text
real auth:     ON
real database: ON
real storage:  ON
demo mode:     OFF
mock grading:  ON
live AI:       OFF
```

The next rollout gate is a successful real-user smoke test through:

```text
login
  -> upload
  -> mock grade
  -> collection
  -> feedback
  -> account deletion
```

After that, live AI can be enabled with the existing timeout/retry bounds, per-user in-flight grading guard, usage limits, and cost monitoring.

## Rollback

Application rollback should use a known-good Netlify production deploy or a Git revert on `main`.

Database migrations should generally be forward-fixed rather than destructively rolled back unless the rollback plan has been tested and data impact is understood.
