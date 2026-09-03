# Staging-to-production promotion checklist

Promote a reviewed staging commit through a pull request to `main`. Never push directly to `main`, reuse staging credentials in production, or deploy a different commit than the one verified here.

## 1. Identify the candidate

- [ ] Record the exact `staging` commit SHA and linked pull requests.
- [ ] Confirm the staging working tree and GitHub branch contain no unreviewed changes.
- [ ] Confirm the Railway staging deployment reports `SUCCESS` for that same SHA.
- [ ] Confirm no database or credential migration is implicit in the diff. When those features arrive, migrations and secrets must remain environment-specific.

## 2. Quality and security gates

- [ ] GitHub Actions backend and mobile Node 20 jobs pass from clean installs.
- [ ] Run `npm run check` in `backend/` and `mobile/` under Node 20.
- [ ] Run `npm audit --omit=dev` in both workspaces and review the full audit when findings remain.
- [ ] Check the diff for secrets, `.env` files, native signing material, generated builds, caches, `node_modules`, and unrelated changes.
- [ ] Confirm mobile `EXPO_PUBLIC_API_BASE_URL` will point to the intended production API; provider credentials must remain server-only.

## 3. Staging acceptance

- [ ] `/health` returns HTTP 200 without contacting a weather provider.
- [ ] Resort catalog and a representative resort forecast return valid data.
- [ ] Unknown measurements remain `null`/Unavailable rather than becoming zero, clear weather, or closed operations.
- [ ] Weather metadata identifies the source and server fetch time; model-run time is displayed only when supplied.
- [ ] Existing staging web behavior and Today → Resort Detail → Base/Mid/Peak mobile behavior pass smoke tests.
- [ ] Provider attribution and freshness labels are visible.

## 4. Promote

- [ ] Open a pull request from `staging` to `main` and review the complete diff.
- [ ] Require green checks and approval before merging.
- [ ] Merge without adding post-staging changes, then record the production merge SHA.
- [ ] Wait for Railway production to report `SUCCESS` for that exact SHA and `/health` configuration.

## 5. Production verification and rollback readiness

- [ ] Smoke-test the production web client, `/health`, catalog, and one forecast without exposing credentials in logs.
- [ ] Confirm production still uses its own variables, domains, and provider credentials.
- [ ] Monitor startup and request logs for new errors while retaining the previous successful deployment as the rollback target.
- [ ] If verification fails, stop promotion work, capture the failing evidence, and revert the promotion commit or redeploy the recorded previous successful image.
- [ ] Do not submit or release a mobile binary until its production API configuration, signing, accessibility, and device checks are independently complete.
