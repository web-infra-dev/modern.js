<p align="center">
  <a href="https://modernjs.dev" target="blank"><img src="./assets/modernjs-banner.png" width="260" alt="Modern.js Logo" /></a>
</p>

<h1 align="center">Modern.js</h1>

<p align="center">
  Inspire creativity in modern web development.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@modern-js/core"><img src="https://img.shields.io/npm/v/@modern-js/core?style=flat-square&color=00a8f0" alt="npm version" /></a>
  <a href="https://npm-compare.com/@modern-js/core/#timeRange=THREE_YEARS"><img src="https://img.shields.io/npm/dm/@modern-js/core.svg?style=flat-square&color=00a8f0" alt="downloads" /></a>
  <a href="https://github.com/web-infra-dev/modern.js/blob/main/LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square&color=00a8f0" alt="License" /></a>
</p>

English | [简体中文](./README.zh-CN.md)

## Introduction

The Modern.js framework is a progressive web framework based on React. At ByteDance, we use Modern.js to build upper-level frameworks that have supported the development of thousands of web applications.

When developing React applications, developers usually need to design implementation plans for certain features or use other libraries and frameworks to solve these problems. Modern.js supports all configurations and tools needed by React applications, and has built-in additional features and optimizations. Developers can use React to build the UI of the application, and then gradually adopt the features of Modern.js to solve common application requirements, such as routing, data acquisition, and state management.

## Getting Started

See [Quick Start](https://modernjs.dev/en/guides/get-started/quick-start).

## Ecosystem

The following solutions and libraries are available within the Modern.js ecosystem:

- 🦀 [Rspack](https://github.com/web-infra-dev/rspack): A fast Rust-based web bundler.
- 🐬 [Rsbuild](https://github.com/web-infra-dev/rsbuild): An Rspack-based build tool for the web, rebranded from Modern.js Builder.
- 🐹 [Rspress](https://github.com/web-infra-dev/rspress): A fast Rspack-based static site generator.
- 🦄 [Rslib](https://github.com/web-infra-dev/rslib): An Rspack-based library development tool.

## Benchmark

We use [Modern.js Benchmark](https://web-infra-qos.netlify.app/) to observe the trend of key metrics, such as bundle size, compile speed and install size.

## Roadmap

Please refer to the [Modern.js Roadmap](https://github.com/web-infra-dev/modern.js/issues/4741). We will update the Roadmap content regularly. Please stay tuned.

## Examples

Modern.js provides a collection of ready-to-use examples that you can find and use in the [modern-js-examples](https://github.com/web-infra-dev/modern-js-examples) repository.
For the in-repo first-class RSC + Module Federation plugin-first fixture contract (direct exposes map, no fixture runtime helpers), see [`tests/integration/rsc-mf/README.md`](./tests/integration/rsc-mf/README.md).

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

## Community

Come and chat with us on [Discord](https://discord.gg/qPCqYg38De)! The Modern.js team and users are active there, and we're always looking for contributions.


## Credits

Some implementations of Modern.js are modified from existing projects, such as [create-react-app](https://github.com/facebook/create-react-app), [remix](https://github.com/remix-run/remix), [jest](https://github.com/facebook/jest) and [bundle-require](https://github.com/egoist/bundle-require). Thanks for them.

- `@modern-js/bundle-require`: is modified from [bundle-require](https://github.com/egoist/bundle-require).
- `@modern-js/plugin`: the hooks API is referenced from [farrow-pipeline](https://github.com/farrow-js/farrow/tree/master/packages/farrow-pipeline).
- `@modern-js/plugin-data-loader`: some code is referenced from [remix](https://github.com/remix-run/remix).
- `@modern-js/babel-plugin-module-resolver`: is modified from [babel-plugin-module-resolver](https://github.com/tleunen/babel-plugin-module-resolver).
- [Netlify](https://www.netlify.com/) for hosting this site, Thanks for the great service and support for open source.

## License

Modern.js is [MIT licensed](https://github.com/web-infra-dev/modern.js/blob/main/LICENSE).

Third party licenses are listed in [THIRD-PARTY-LICENSE](./THIRD-PARTY-LICENSE).
