<p align="center">
  <a href="https://modernjs.dev" target="blank"><img src="https://lf3-static.bytednsdoc.com/obj/eden-cn/ylaelkeh7nuhfnuhf/modernjs-cover.png" width="260" alt="Modern.js Logo" /></a>
</p>

<h1 align="center">Modern.js</h1>

<p align="center">
  Inspire creativity in modern web development.
</p>

<p align="center">
  <img src="https://img.shields.io/npm/v/@modern-js/core?style=flat-square&color=00a8f0" alt="npm version" />
  <img src="https://img.shields.io/npm/dm/@modern-js/core.svg?style=flat-square&color=00a8f0" alt="downloads" />
  <img src="https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square&color=00a8f0" alt="License" />
</p>

English | [简体中文](./README.zh-CN.md)

## Introduction

Modern.js is an open source web engineering system from ByteDance, including:

- 🦄 [Modern.js Framework](https://modernjs.dev/en/): A progressive React framework for web development.
- 🐧 [Modern.js Module](https://modernjs.dev/module-tools/en/): A powerful solution for npm package development.

## Getting Started

- Use [Modern.js Framework](https://modernjs.dev/en/guides/get-started/quick-start) to develop a web application.
- Use [Modern.js Module](https://modernjs.dev/module-tools/en/guide/intro/getting-started.html) to develop an npm package.

## Ecosystem

The following solutions and libraries are available within the Modern.js ecosystem:

- 🦀 [Rspack](https://github.com/web-infra-dev/rspack): A fast Rust-based web bundler.
- 🐬 [Rsbuild](https://github.com/web-infra-dev/rsbuild): An Rspack-based build tool for the web, rebranded from Modern.js Builder.
- 🐹 [Rspress](https://github.com/web-infra-dev/rspress): A fast Rspack-based static site generator.
- 🐟 [Garfish](https://github.com/web-infra-dev/garfish): A powerful micro front-end framework.
- 🦆 [Reduck](https://github.com/web-infra-dev/reduck): An redux-based state management library.
- 🐴 [SWC Plugins](https://github.com/web-infra-dev/swc-plugins): Built-in SWC plugins for Modern.js.

## Benchmark

We use [Modern.js Benchmark](https://web-infra-qos.netlify.app/) to observe the trend of key metrics, such as bundle size, compile speed and install size.

## Roadmap

Please refer to the [Modern.js Roadmap](https://github.com/web-infra-dev/modern.js/issues/4741). We will update the Roadmap content every quarter. Please stay tuned.

## Examples

Modern.js provides a collection of ready-to-use examples that you can find and use in the [modern-js-examples](https://github.com/web-infra-dev/modern-js-examples) repository.

## Contributing

> New contributors welcome!

Please read the [Contributing Guide](https://github.com/web-infra-dev/modern.js/blob/main/CONTRIBUTING.md).

### Code of Conduct

This repo has adopted the Bytedance Open Source Code of Conduct. Please check [Code of Conduct](./CODE_OF_CONDUCT.md) for more details.

### All Contributors

Thanks to the following friends for their contributions to Modern.js:

<a href="https://github.com/web-infra-dev/modern.js/graphs/contributors">
  <img src="https://opencollective.com/modernjs/contributors.svg?width=890&button=false" alt="contributors">
</a>

## Credits

Some implementations of Modern.js are modified from existing projects, such as [create-react-app](https://github.com/facebook/create-react-app), [remix](https://github.com/vuejs/remix), [jest](https://github.com/facebook/jest) and [bundle-require](https://github.com/egoist/bundle-require). Thanks for them.

- `@modern-js/bundle-require`: is modified from [bundle-require](https://github.com/egoist/bundle-require).
- `@modern-js/plugin`: the hooks API is referenced from [farrow-pipeline](https://github.com/farrow-js/farrow/tree/master/packages/farrow-pipeline).
- `@modern-js/plugin-testing`: the jest runner is referenced from [jest-cli](https://github.com/facebook/jest/blob/fdc74af37235354e077edeeee8aa2d1a4a863032/packages/jest-cli/src/cli/index.ts#L21).
- `@modern-js/plugin-data-loader`: some code is referenced from [remix](https://github.com/remix-run/remix).
- `@modern-js/babel-plugin-module-resolver`: is modified from [babel-plugin-module-resolver](https://github.com/tleunen/babel-plugin-module-resolver).

## License

Modern.js is [MIT licensed](https://github.com/web-infra-dev/modern.js/blob/main/LICENSE).

Third party licenses are listed in [THIRD-PARTY-LICENSE](./THIRD-PARTY-LICENSE).
