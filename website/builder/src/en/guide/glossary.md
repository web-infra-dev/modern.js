# Glossary

## Bundler

Refers to module bundlers such as `webpack`, `turbopack` and `rspack`.

The main goal of bundlers is to bundle JavaScript, CSS and other files together, and the bundled files can be used in the browser, Node.js or other environments. When bundler processes the Web application, it builds a dependency graph and then combines every module into one or more bundles.

## Rspack

A Rust Bundler developed by the ByteDance Web Infra team. The core architecture of rspack is aligned with the implementation of webpack, and provides out-of-the-box support for commonly used build features. In the long run, rspack will align the main APIs of webpack and be compatible with the mainstream webpack loaders and plugins to ensure that developers can smoothly migrate from webpack to rspack.

Rspack optimizes compilation performance by:

- Highly LTO optimized Native code.
- Take full advantage of multi-core, and the entire compilation process is fully optimized for multi-threading.
- On-demand compilation based on request (Lazy Compilation), reducing the number of modules per compilation to improve the speed of cold start.

:::tip
Rspack is still in development and has not been open sourced yet.
:::

## Builder

Build Engine. The goal of Builder is to "reuse the best practices of build tools".

Bundlers are low-level, if we build a project based on webpack, we need to fully understand the webpack config and many webpack plugins and loaders, then spend a lot of time to combine them.

Builder is a out-of-box build tools. By using Builder, you can quickly gain the ability to build a modern web application.

The layers inside the Builder are as follows:

<img src="https://lf3-static.bytednsdoc.com/obj/eden-cn/zq-uylkvT/ljhwZthlaukjlkulzlp/builder-struct-10092.png" />

## Builder Provider

Builder Provider is a part of Builder. Providers implements corresponding build feature based on specific bundlers.

Currently there are two Providers:

- `@modern-js/builder-webpack-provider`: Based on webpack.
- `@modern-js/builder-rspack-provider`: Based on rspack.

## Modern.js

Modern web engineering system.

Modern.js is open sourced by the ByteDance Web Infra team, provides a series of best practices for modern web development, such as integrated development of frontend and backend, conventional routing, building solutions, style solutions, etc.

[Modern.js Website](https://modernjs.dev/).

## EdenX

ByteDance's internal web engineering system, implemented based on Modern.js.
