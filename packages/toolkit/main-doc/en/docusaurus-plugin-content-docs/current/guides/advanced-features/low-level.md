---
title: Low-Level Tools
sidebar_position: 11
---

## Usage

Modern.js internally integrates tools such as [Babel](https://babeljs.io/), [TypeScript](https://www.typescriptlang.org/), [Webpack](https://webpack.js.org/), [PostCSS](https://postcss.org/), [Tailwind CSS] (https://tailwindcss.com/) by default.

Usually, the default configuration can meet most development needs. When there are special needs, it can be achieved through the underlying configuration.

Take configuring Webpack as an example, just add ['tools.webpack'] (/docs/configure/app/tools/webpack) to the modern.config.ts:

```ts title="modern.config.ts"
export default defineConfig({
  tools: {
    webpack: config => {},
  },
});
```

Configurations in the `tools` can be set to `Object` or `Function`.

When the value is `Object`, it will be merged with the default configuration. For the specific merging strategy, refer to the configuration options document (see table below).

When the value is `Function`, the first parameter is the default configuration value. You can directly modify this object without returning it, or you can return a new object or a merged object as the final result.

## Low-level Configuration Details

Currently provided is as follows:

| Tools             | Config                                                                |
| ----------------- | --------------------------------------------------------------------- |
| DevServer         | [tools.devServer](/docs/configure/app/tools/dev-server)               |
| Babel             | [tools.babel](/docs/configure/app/tools/babel)                        |
| styled-components | [tools.styledComponents](/docs/configure/app/tools/styled-components) |
| PostCSS           | [tools.postcss](/docs/configure/app/tools/postcss)                    |
| Less              | [tools.less](/docs/configure/app/tools/less)                          |
| Sass              | [tools.sass](/docs/configure/app/tools/sass)                          |
| webpack           | [tools.webpack](/docs/configure/app/tools/webpack)                    |
| Minify CSS        | [tools.minifyCss](/docs/configure/app/tools/minify-css)               |
| terser            | [tools.terser](/docs/configure/app/tools/terser)                      |
| Tailwind CSS      | [tools.tailwind](/docs/configure/app/tools/tailwindcss)               |
| Autoprefixer      | [tools.autoprefixer](/docs/configure/app/tools/autoprefixer)          |
