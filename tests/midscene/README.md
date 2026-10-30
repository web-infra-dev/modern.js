# Midscene E2E

UI flows reuse the existing Modern.js integration fixtures. Each fixture/mode
runs in a separate temporary directory, and each case file gets a fresh browser
context. Actions use `aiAct` with separate `aiAssert` checks.

## Run

From the repository root:

```sh
pnpm install --frozen-lockfile --ignore-scripts
pnpm run prepare-build
pnpm --dir tests/midscene exec playwright install chromium
cp tests/midscene/.env.example tests/midscene/.env
# Set your model configuration in .env, then:
pnpm --filter modernjs-midscene-e2e check:model
pnpm --filter modernjs-midscene-e2e test
```

`MIDSCENE_FILE_CONCURRENCY` accepts 1, 5, or 15 (local default 1, CI 5).
`MIDSCENE_INCLUDE_TAGS` selects comma-separated case or mode tags.
Case retries are disabled. Production variants cover the existing dev/build
matrix for the ESM navigation and CSR action flows.

## CI

PRs only validate the harness without model credentials. Relevant main pushes
run the model tests after merge. Upstream manual runs must select main.
Configure the `Model` environment or repository with:

- Secret `MIDSCENE_MODEL_API_KEY`
- Variables `MIDSCENE_MODEL_NAME`, `MIDSCENE_MODEL_BASE_URL`,
  `MIDSCENE_MODEL_FAMILY` (Secrets also accepted)

The official Midscene Action provides the native Summary and `midscene-results`
artifact, retained for 14 days. For optional online HTML reports and screenshots,
configure Secret `CLOUDFLARE_API_TOKEN` and Variable `CLOUDFLARE_ACCOUNT_ID`, with
permission to deploy the `modernjs-midscene-reports` Worker. Missing either
setting skips publication without failing tests. Download and extract the
artifact to view reports locally. Invalid configured credentials still fail
publication. Manual `publish_pages=false` also disables publication.

Eight UI scenarios replace ten existing test registrations across the i18n,
pure-ESM, partial-SSR navigation, and CSR action fixtures. The ESM navigation
and CSR action scenarios each run in both dev and build modes.
SSR responses, URL contracts, request counts, hydration timing, and build
assertions remain in the deterministic integration suite.
