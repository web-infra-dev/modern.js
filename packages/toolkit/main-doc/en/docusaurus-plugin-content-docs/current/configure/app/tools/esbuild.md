---
title: tools.esbuild
sidebar_label: esbuild
---

* Type: `Object`
* Default: `undefined`

## Introduction

Esbuild is a JavaScript Bundler/Minifier written in Go language, which is characterized by extremely fast speed. In terms of code compression, esbuild has dozens of times the performance improvement compared to webpack's built-in terser compressor.

Modern.js provides the ability to compile and compress code based on esbuild. After opening it in a large project, ** can greatly reduce the time required for code compression, while effectively avoiding OOM (heap out of memory) problems **.

Although the use of esbuild compression has brought about an improvement in construction efficiency, the compression ratio of esbuild is lower than that of terser, so the size of the ** bundle will increase **, please use it according to the business situation (more suitable for middle and back-end scenarios).

For a detailed comparison between compression tools, see [mining-benchmarks](https://github.com/privatenumber/minification-benchmarks).

:::info
In addition to code compression, esbuild can also replace babel for code compilation. The advantage is that it can improve the compilation speed, but the disadvantage is that it cannot use the rich babel plug-in capabilities.
:::

## Configuration

### target

* Type: `string | string[]`
* Default `'esnext'`

Set the target environment for the generated JavaScript and CSS code.

Can be set directly to the JavaScript language version, such as `es5`, `es6`, `es2020`. It can also be set to several target environments, each target environment is an environment name followed by a version number. For example: `['chrome58', 'edge16', 'firefox57']`.

The following environments are supported:

- chrome
- edge
- firefox
- ie
- ios
- node
- opera
- safari

By default, ES6 code, such as template string, is introduced into the esbuild compression process. If you need to be ES5 compatible, you can set `target` to `es5`.

```typescript title="modern.config.ts"
export default defineConfig({
  tools: {
    esbuild: {
      target: 'es5',
    },
  },
});
```

:::info
When setting `target` to `es5`, you need to ensure that all code is escaped to es5 code by babel, otherwise it will cause an esbuild compilation error: `Transforming 'xxx' to the configured target environment ("es5") is not supported yet`.

A detailed description of the `target` field can be found in [esbuild-target](https://esbuild.github.io/api/#target).
:::
