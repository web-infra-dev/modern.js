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

## Template maintenance

Templates live under `templates/`. `common/` owns engineering files and renders the final package.json and tsconfig. `ui/` owns the shared React shell, `app/` owns the ordinary application, and `mcp/` owns shared MCP documentation. `mcp-apps/`, `mcp-server/` and `mf/` contain only their mode-specific files.

The generator selects directories before copying. Each output file has one owner, and conflicting paths fail instead of overwriting existing files. No generated files are deleted or patched afterward.

## Contributing

Please read the [Contributing Guide](https://github.com/web-infra-dev/modern.js/blob/main/CONTRIBUTING.md).

## License

Modern.js is [MIT licensed](https://github.com/web-infra-dev/modern.js/blob/main/LICENSE).
