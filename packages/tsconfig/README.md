<p align="center">
  <a href="https://modernjs.dev" target="blank"><img src="https://lf3-static.bytednsdoc.com/obj/eden-cn/ylaelkeh7nuhfnuhf/modernjs-cover.png" width="300" alt="Modern.js Logo" /></a>
</p>

<h1 align="center">Modern.js</h1>

<p align="center">
  A Progressive React Framework for modern web development.
</p>

## @modern-js/tsconfig

Shared TypeScript presets for Modern.js projects.

| Preset   | Import path                   | Purpose                                                                                                                                                                  |
| -------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `base`   | `@modern-js/tsconfig/base`    | Main project config: `module: ESNext`, `moduleResolution: bundler`, `jsx: react-jsx`, `target: ES2022`, `strict`, `isolatedModules`. Used by the editor, Rspack and type-checking. |
| `server` | `@modern-js/tsconfig/server`  | Server-side emit overrides only: `module: NodeNext`, `moduleResolution: NodeNext`, `noEmit: false`, `declaration: false`. Layer it on top of your `tsconfig.json`.         |
| `legacy` | `@modern-js/tsconfig/legacy`  | The previous `base` preset (`module: commonjs`, `moduleResolution: node`, `target: ES2015`). Rollback aid only; TypeScript 6 reports these options as deprecated.          |
| `react`  | `@modern-js/tsconfig/react`   | Deprecated alias of `base`. Use `base` instead.                                                                                                                          |

`@modern-js/tsconfig >= 3.10.0` requires `@modern-js/app-tools >= 3.10.0`: the framework needs to know how to compile `api/`, `server/` and `shared/` from a bundler-mode `tsconfig.json`.

## Two-file layout

A project keeps one main `tsconfig.json` and, when it has server-side code, a `tsconfig.server.json` that only changes module options.

`tsconfig.json` (editor, Rspack aliases, type-check):

```json
{
  "extends": "@modern-js/tsconfig/base",
  "compilerOptions": {
    "noEmit": true,
    "types": ["node"],
    "paths": {
      "@/*": ["./src/*"],
      "@shared/*": ["./shared/*"]
    }
  },
  "include": ["src", "shared", "config", "modern.config.ts"]
}
```

When the project has a BFF (`api/`) or a custom server (`server/`), add `"@api/*": ["./api/lambda/*"]` to `paths` and `api` / `server` to `include`.

`tsconfig.server.json` (used by Modern.js to compile `api/`, `server/` and `shared/`, and by ts-node at dev time):

```json
{
  "extends": ["./tsconfig.json", "@modern-js/tsconfig/server"],
  "include": ["api", "server", "shared"]
}
```

Rules:

- `paths` stays in `tsconfig.json`. TypeScript replaces `paths` wholesale across `extends`, so never declare `paths` in `tsconfig.server.json`.
- Modern.js picks the server config in this order: `server.tsconfigPath` → `<appDir>/tsconfig.server.json` → `<appDir>/tsconfig.json`.
- Only the last fallback is rewritten: when `tsconfig.json` resolves to an ESM `module` (for example `ESNext`) and `package.json#type` is not `module`, Modern.js compiles server code with `module: NodeNext` / `moduleResolution: NodeNext` and prints a one-time warning suggesting `tsconfig.server.json`.

## Getting Started

Please follow [Quick Start](https://modernjs.dev/en/guides/get-started/quick-start) to get started with Modern.js.

## Documentation

- [English Documentation](https://modernjs.dev/en/)
- [中文文档](https://modernjs.dev)

## Contributing

Please read the [Contributing Guide](https://github.com/web-infra-dev/modern.js/blob/main/CONTRIBUTING.md).

## License

Modern.js is [MIT licensed](https://github.com/web-infra-dev/modern.js/blob/main/LICENSE).
