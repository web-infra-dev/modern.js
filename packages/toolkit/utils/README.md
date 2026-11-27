<p align="center">
  <a href="https://modernjs.dev" target="blank"><img src="https://lf3-static.bytednsdoc.com/obj/eden-cn/ylaelkeh7nuhfnuhf/modernjs-cover.png" width="300" alt="Modern.js Logo" /></a>
</p>

<h1 align="center">Modern.js</h1>

<p align="center">
  A Progressive React Framework for modern web development.
</p>

## Getting Started

Please follow [Quick Start](https://modernjs.dev/en/guides/get-started/quick-start) to get started with Modern.js.

## Documentation

- [English Documentation](https://modernjs.dev/en/)
- [中文文档](https://modernjs.dev)

## Contributing

Please read the [Contributing Guide](https://github.com/web-infra-dev/modern.js/blob/main/CONTRIBUTING.md).

## Glob

The v3 `glob` export from `@modern-js/utils` and the default export of
`@modern-js/utils/glob` support glob 7 callbacks, events and synchronous
matching. Import `glob`, `globSync` and the `GlobOptions` type from
`@modern-js/utils/glob/v14` to use glob 14. For example,
`await glob('**/*.ts', { cwd: 'src' })` resolves to the matching source files.

## Environment variable expansion

Use `dotenvExpand.expand(config)` from `@modern-js/utils` for dotenv-expand 11.
The v3 form, `dotenvExpand(config)`, retains its original expansion rules and
supports isolating a file from the host environment with `ignoreProcessEnv`.

## License

Modern.js is [MIT licensed](https://github.com/web-infra-dev/modern.js/blob/main/LICENSE).
