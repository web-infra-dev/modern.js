# Modern.js Examples

Example projects for [Modern.js](https://modernjs.dev).

Each example depends on the `latest` published Modern.js packages, so you can copy any example directory out of this repo and use it directly — `pnpm install && pnpm dev` just works, and you always get the newest release without editing versions.

To run one inside this repo (examples are also members of the pnpm workspace, resolved against the published packages, pinned by the root lockfile):

```bash
pnpm install   # at the repo root
cd examples/<example>
pnpm dev
```

> Note: `latest` follows the npm dist-tag. When the next major version of Modern.js is published, these examples must be updated together with it.

## Examples

| Example | Description |
| --- | --- |
| [basic-withZephyr](./basic-withZephyr) | Basic app deployed with [Zephyr Cloud](https://zephyr-cloud.io) via `zephyr-modernjs-plugin` |
| [deploy/self-built-node](./deploy/self-built-node) | Deploying the build output on a self-hosted Node.js (Express) server |
| [modern-js-deploy-csr](./modern-js-deploy-csr) | CSR app deployment (Vercel / Netlify configs included) |
| [modern-js-deploy-ssr](./modern-js-deploy-ssr) | SSR app deployment (Vercel / Netlify configs included) |
| [module-federation/base](./module-federation/base) | Module Federation basics: host consumes a remote component |
| [module-federation/app-export](./module-federation/app-export) | Module Federation app-level export: remote exports a full app via bridge |
| [react-compiler](./react-compiler) | Enabling React Compiler with `@rsbuild/plugin-babel` |
| [sse](./sse) | Server-Sent Events with BFF (Hono) and custom server middlewares |
| [storybook](./storybook) | Storybook integration via `storybook-addon-modernjs`, with a BFF api |
| [test-cypress](./test-cypress) | E2E testing with Cypress |
| [test-jest](./test-jest) | Unit testing with Jest |
| [test-playwright](./test-playwright) | E2E testing with Playwright |
| [test-vitest](./test-vitest) | Unit testing with Vitest |
