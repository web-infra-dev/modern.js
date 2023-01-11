---
sidebar_label: router
---

import RouterLegacyTip from '@site-docs-en/components/router-legacy-tip.md'

<RouterLegacyTip />

# runtime.router

- Type: `boolean | Object`
- Default: `false`

When `router` is enabled, routing management of conventional routes provided by Modern.js is supported. Based on [React Router 6](https://reactrouter.com/).

## basename

- Type: `string`
- Default: ``

The basename of the app for situations where you can't deploy to the root of the domain, but a sub directory.

## supportHtml5History

- Type: `boolean`
- Default: `true`

If the value of `supportHtml5History` is `true`, `BrowserRouter` would be used, otherwise `HashRouter` would be used. `BrowserRouter` is recommended.

:::warning
When SSR is enabled, `supportHtml5History` is not supported.
:::
