---
title: tools.esbuild
sidebar_label: esbuild
---

- Type: `Object`
- Default: `undefined`

## Introduction

:::tip About esbuild
[esbuild](https://esbuild.github.io/) is a front-end build tool based on Golang. It has the functions of bundling, compiling and minimizing JavaScript code. Compared with traditional tools, the performance is significantly improved. When minimizing code, compared to webpack's built-in terser minimizer, esbuild has dozens of times better performance.
:::

Modern.js provides esbuild plugin that allow you to use esbuild instead of babel-loader, ts-loader and terser for transformation and minification process.

## Configuration

You can set the esbuild compilation behavior through the `tools.esbuild` config.

```js title="modern.config.ts"
import { defineConfig } from '@modern-js/app-tools';

export default defineConfig({
  tools: {
    esbuild: {
      loader: {
        target: 'chrome61',
      },
      minimize: {
        target: 'chrome61',
      },
    },
  },
});
```

For config details, please refer to [Modern.js Builder - Esbuild Plugin Configuration](https://modernjs.dev/builder/en/plugins/plugin-esbuild.html#config).
