<p align="center">
  <a href="https://modernjs.dev" target="blank"><img src="https://lf3-static.bytednsdoc.com/obj/eden-cn/ylaelkeh7nuhfnuhf/modernjs-cover.png" width="300" alt="Modern.js Logo" /></a>
</p>

<h1 align="center">Modern.js</h1>

<p align="center">
  A Progressive React Framework for modern web development.
</p>

## Getting Started

Please follow [Quick Start](https://modernjs.dev/en/guides/get-started/quick-start) to get started with Modern.js.

### MCP Apps templates

```sh
npx @modern-js/create@<version> my-app --template mcp-apps
npx @modern-js/create@<version> my-mf-app --template mcp-apps --mf
npx @modern-js/create@<version> my-server --template mcp-server
```

Replace `<version>` with a release containing MCP Apps support. Choose `mcp-apps` for interactive React cards, add `--mf` for Module Federation, or use `mcp-server` for tools without UI. See the [MCP Apps guide](https://modernjs.dev/en/guides/advanced-features/mcp-apps).

## Documentation

- [English Documentation](https://modernjs.dev/en/)
- [中文文档](https://modernjs.dev)

## MCP starter verification

After building workspace dependencies, run `pnpm --filter @modern-js/create test:mcp` to generate local UI, MF and tool-only projects. This check links built workspace dependencies, typechecks and builds each project, then calls its production MCP endpoint. The MF case also verifies custom manifest and JS directories.

Run `pnpm --filter @modern-js/mcp-apps test:deployment` to additionally pack the SDK and install it in an isolated production project.

## Contributing

Please read the [Contributing Guide](https://github.com/web-infra-dev/modern.js/blob/main/CONTRIBUTING.md).

## License

Modern.js is [MIT licensed](https://github.com/web-infra-dev/modern.js/blob/main/LICENSE).
