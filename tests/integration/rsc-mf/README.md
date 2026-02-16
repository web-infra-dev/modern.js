# RSC + Module Federation Fixture

This fixture is the canonical in-repo reference for Modern.js first-class React Server Components (RSC) with Module Federation.

## Goals

- `moduleFederationPlugin({ ssr: true })` in app config
- standard `createModuleFederationConfig(...)`
- direct exposes map for userland modules
- no fixture runtime helper glue in host or remote apps

## Paths

- host app: `tests/integration/rsc-mf/host`
- remote app: `tests/integration/rsc-mf/remote`
- integration tests: `tests/integration/rsc-mf/tests/index.test.ts`

## Key Runtime Contract

- remote actions post through host endpoint only
- action ids are bridge-prefixed: `remote:<alias>:<rawActionId>`
- internal bridge expose path `./__rspack_rsc_bridge__` is plugin-managed and acceptable when present
