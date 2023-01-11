---
title: tools.swc
sidebar_label: swc
---

- Type: `Object`
- Default: `undefined`

## Introduction

[SWC](https://SWC.rs/) (Speedy Web Compiler) is a transformer and minimizer for JavaScript and TypeScript based on `Rust`. SWC can provide the same abilities with Babel, and it's more than 10x faster than Babel.

Modern.js Builder has a out-of-box plugin for SWC, power your Web application with Polyfill and minification, we also port some common used Babel plugins to SWC.

## Install

The `@modern-js/plugin-swc` plugin needs to be installed before use.

```bash
pnpm add @modern-js/plugin-swc -D
```

After the installation，please register the SWC plugin in the `modern.config.ts` file, then the SWC compilation and compression will be enabled.

```ts title="modern.config.ts"
import appTools, { defineConfig } from '@modern-js/app-tools';
import swcPlugin from '@modern-js/plugin-swc';

export default defineConfig({
  plugins: [appTools(), swcPlugin()],
});
```

## Config

You can set the SWC compilation behavior through the `tools.swc` config.

```js title="modern.config.ts"
import { defineConfig } from '@modern-js/app-tools';

export default defineConfig({
  tools: {
    swc: {
      jsMinify: {
        compress: {},
        mangle: true,
      },
    },
  },
});
```

For config details, please refer to [Modern.js Builder - SWC Plugin Configuration](https://modernjs.dev/builder/en/plugins/plugin-swc.html#config).
