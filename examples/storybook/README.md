# storybook

Using [Storybook](https://storybook.js.org) with a Modern.js app via [`storybook-addon-modernjs`](https://www.npmjs.com/package/storybook-addon-modernjs) (on top of `storybook-react-rsbuild`).

The example includes:

- A conventional-route app (`src/routes/`) that calls a BFF API.
- A BFF API (`api/lambda/`) built with `@modern-js/plugin-bff` (Hono runtime), including schema validation with `zod`.
- Stories (`src/stories/`) for an Ant Design button component that also calls the BFF API through Modern.js' integrated BFF client.

## Run

```bash
pnpm install   # at the repo root

# run the Modern.js app (with BFF) at http://localhost:8088
pnpm dev

# run Storybook at http://localhost:6006
# (proxies /bff-api to the app dev server, so run `pnpm dev` or `pnpm dev:api` alongside)
pnpm storybook
```

## Build

```bash
# build the app
pnpm build

# build the static Storybook site
pnpm build:storybook
```
