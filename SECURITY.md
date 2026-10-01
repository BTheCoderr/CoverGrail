# Security Policy

Security fixes target the current default branch and production release.

Report vulnerabilities privately through GitHub when they could expose user accounts, private comic images, collection records, Supabase data, signed URLs, quotas, or privileged Edge Function behavior.

Extra review is expected for Auth/RLS policies, Storage ownership, image validation, duplicate grading locks, quota enforcement, provider secrets, and collection privacy.

Never commit service-role keys, AI-provider secrets, private scans, or real user data.
