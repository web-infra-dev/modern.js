# Modern.js App

## Setup

Install the dependencies:

```bash
pnpm install
```

This also installs Chromium for Playwright. Set
`PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1` to skip the browser download. The release
pipeline's existing `PUPPETEER_SKIP_DOWNLOAD=true` flag also skips this download.

If the download was skipped, install Chromium before running browser tests:

```bash
pnpm exec playwright install chromium
```

## Get Started

Start the dev server:

```bash
pnpm dev
```

Build the app for production:

```bash
pnpm build
```

Preview the production build locally:

```bash
pnpm serve
```

For more information, see the [Modern.js documentation](https://modernjs.dev/en).
