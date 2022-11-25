# General

## The relationship between Modern.js Builder and Modern.js?

The building abilities of Modern.js 2.0 are based on Modern.js Builder.

When developing Modern.js 2.0, we designed Builder as an independent module, and clearly divided the responsibilities of Builder and Modern.js. Therefore, Builder can be used independently of the Modern.js framework and be applied to other frameworks or scenarios.

## Can Builder be used to build libraries or UI components?

Builder focuses on solving web application building scenarios. We do not recommend that you use Builder to build libraries or UI components.

If you need to build a library or UI components, it is recommended to use the [Modern.js module tools](https://modernjs.dev/docs/start/library).

## Will Builder support Turbopack?

[Turbopack](https://turbo.build/pack) is the rust-powered successor to webpack, we will continue to pay attention to it.

At present, Turbopack only supports use in Next.js. When Turbopack can be used independently, and the completion and community ecology reach a certain level, we will consider supporting it for sure.

## Will Builder support Vite?

[Vite](https://vitejs.dev/) is a great tool, but the goal of Builder is to replace webpack with Rust Bundler, Rust Builder can provide fast compilation speed, while maintaining the consistent behavior between development and production.

Builder will focus on the evolution from webpack to Rust Builder, so it will not be support Vite.
