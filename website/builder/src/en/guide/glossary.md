# Glossary

## Bundler

Refers to module bundlers such as `webpack` and `rspack`.

When Bundler processes the JavaScript application, it builds a dependency graph and then combines every module into one or more bundles.

## Rspack

A Rust Bundler, developed by the ByteDance Web Infra team.

Rspack is still in development and will be open sourced in the future.

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

A modern web engineering system.

Modern.js is open sourced by the ByteDance Web Infra team, provides a series of best practices for modern web development, such as integrated development of frontend and backend, conventional routing, building solutions, style solutions, etc.

[Modern.js Website](https://modernjs.dev/).
