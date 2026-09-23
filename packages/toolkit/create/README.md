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

The experimental MCP templates use `mcp_apps.ts` definitions. From this source
repository, generate a project with:

```sh
node packages/toolkit/create/bin/run.js examples/my-app --template mcp-apps --sub
node packages/toolkit/create/bin/run.js examples/my-server --template mcp-server --sub
```

`mcp-apps` includes a local React card and MCP server plugin. Add `--mf` to
opt into Module Federation configuration and remote components. `mcp-server` has no UI directory or React application dependency.
Both use `modern dev/build/serve/deploy`; `app` remains the default template.
The new packages must be released together before installing generated projects
from the public registry. Inside this repository, use the workspace example
`@examples/mcp-apps-modern` to try the implementation before publication.
Generated projects initially reference the creator's package version, not workspace
packages. For local source development, set a valid package name and use
`workspace:*` for Modern.js dependencies available in this workspace before
installing. The [MCP Apps creation skill](../../../skills/modernjs-create-mcp-apps/SKILL.md)
describes the full workflow and host validation.

After a version containing the templates and dependencies is published:

```sh
pnpm dlx @modern-js/create@<version> my-app --template mcp-apps
cd my-app
pnpm install
pnpm dev
```

## Documentation

- [English Documentation](https://modernjs.dev/en/)
- [中文文档](https://modernjs.dev)

## Contributing

Please read the [Contributing Guide](https://github.com/web-infra-dev/modern.js/blob/main/CONTRIBUTING.md).

## License

Modern.js is [MIT licensed](https://github.com/web-infra-dev/modern.js/blob/main/LICENSE).
