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
  <img src="https://img.shields.io/npm/l/@modern-js/core?style=flat-square&color=00a8f0" alt="License" />
</p>

English | [简体中文](./README.zh-CN.md)

## Introduction

Modern.js is a modern web engineering system, including multiple solutions:

- 🦄 [Modern.js Framework](https://modernjs.dev/en/): A progressive React framework for web development.
- 🐧 [Modern.js Module](https://modernjs.dev/module-tools/en/): A powerful solution for npm package development.
- 🐹 [Modern.js Doc](https://modernjs.dev/doc-tools): A documentation site solution with modern tech stack.
- 🐱 [Modern.js Builder](https://modernjs.dev/builder/en/): A build engine for web development.

## Getting Started

- Use [Modern.js Framework](https://modernjs.dev/en/guides/get-started/quick-start) to develop a web application.
- Use [Modern.js Module](https://modernjs.dev/module-tools/en/guide/intro/getting-started.html) to develop an npm package.
- Use [Modern.js Doc](https://modernjs.dev/doc-tools/guide/getting-started.html) to develop a documentation site.
- Use [Modern.js Builder](https://modernjs.dev/builder/en/guide/quick-start.html) to provide build capabilities for your own web framework.

## Ecosystem

The following solutions are available within the Modern.js ecosystem:

- 🦀 [Rspack](https://github.com/web-infra-dev/rspack): A fast Rust-based web bundler.
- 🐟 [Garfish](https://github.com/web-infra-dev/garfish): A powerful micro front-end framework.
- 🐈 [Reduck](https://github.com/web-infra-dev/reduck): A redux-based state management library.

## Contributing

> New contributors welcome!

Please read the [Contributing Guide](https://github.com/web-infra-dev/modern.js/blob/main/CONTRIBUTING.md).

## Credits

Some implementations of Modern.js are modified from existing projects, such as [create-react-app](https://github.com/facebook/create-react-app), [vitepress](https://github.com/vuejs/vitepress), [remix](https://github.com/vuejs/remix), [jest](https://github.com/facebook/jest) and [bundle-require](https://github.com/egoist/bundle-require). Thanks for them.

- `@modern-js/bundle-require`: is modified from [bundle-require](https://github.com/egoist/bundle-require).
- `@modern-js/plugin`: the hooks API is referenced from [farrow-pipeline](https://github.com/farrow-js/farrow/tree/master/packages/farrow-pipeline).
- `@modern-js/builder`: the moduleScope and fileSize plugins are referenced from [create-react-app](https://github.com/facebook/create-react-app), the TsConfigPathsPlugin is referenced from [tsconfig-paths-webpack-plugin](https://github.com/dividab/tsconfig-paths-webpack-plugin)。
- `@modern-js/plugin-testing`: the jest runner is referenced from [jest-cli](https://github.com/facebook/jest/blob/fdc74af37235354e077edeeee8aa2d1a4a863032/packages/jest-cli/src/cli/index.ts#L21).
- `@modern-js/plugin-data-loader`: some code is referenced from [remix](https://github.com/remix-run/remix)。
- `@modern-js/doc-tools`: some styles are referenced from [vitepress](https://github.com/vuejs/vitepress).
- `@modern-js/utils`: the generateMetaTags function is referenced from [html-webpack-plugin](https://github.com/jantimon/html-webpack-plugin).

## License

Modern.js is [MIT licensed](https://github.com/web-infra-dev/modern.js/blob/main/LICENSE).
