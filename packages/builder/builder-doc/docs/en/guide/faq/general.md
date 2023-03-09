# General

## The relationship between Modern.js Builder and Modern.js?

The building abilities of Modern.js are based on Modern.js Builder.

When developing Modern.js, we designed Builder as an independent module, and clearly divided the responsibilities of Builder and Modern.js. Therefore, Builder can be used independently of the Modern.js framework and be applied to other frameworks or scenarios.

## Can Builder be used to build libraries or UI components?

Builder focuses on solving web application building scenarios. We do not recommend that you use Builder to build libraries or UI components.

If you need to build a library or UI components, it is recommended to use the [Modern.js Module Tools](https://modernjs.dev/module-tools/en).

## Will Builder support Turbopack?

Builder is already supporting Rspack, and currently Turbopack supports use in Next.js, so there is no plan for Builder to support [Turbopack](https://turbo.build/pack).

## Will Builder support Vite?

[Vite](https://vitejs.dev/) is a great tool, but the goal of Builder is to replace webpack with Rust Bundler, Rust Builder can provide fast compilation speed, while maintaining the consistent behavior between development and production.

Builder will focus on the evolution from webpack to Rust Builder, so it will not be support Vite.
