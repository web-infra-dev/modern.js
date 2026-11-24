<p align="center">
  <a href="https://modernjs.dev" target="blank"><img src="https://lf3-static.bytednsdoc.com/obj/eden-cn/ylaelkeh7nuhfnuhf/modernjs-cover.png" width="300" alt="Modern.js Logo" /></a>
</p>

<h1 align="center">Modern.js</h1>

<p align="center">
  A Progressive React Framework for modern web development.
</p>

## @modern-js/tsconfig

Shared TypeScript presets for Modern.js projects.

| Preset   | Import path                  | Purpose                                                                                                                                                                                                                                                                        |
| -------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `base`   | `@modern-js/tsconfig/base`   | Main project config: `module: ESNext`, `moduleResolution: bundler`, `jsx: react-jsx`, `target: ES2022`, `strict`. Used by the editor, Rspack and type-checking.                                                                                                                |
| `server` | `@modern-js/tsconfig/server` | Reference preset with the four server-side emit overrides: `module: NodeNext`, `moduleResolution: NodeNext`, `noEmit: false`, `declaration: false`. For tools that support `extends` arrays (tsc >= 5.0); the recommended `tsconfig.server.json` inlines the same four fields. |
| `legacy` | `@modern-js/tsconfig/legacy` | The previous `base` preset (`module: commonjs`, `moduleResolution: node`, `target: ES2015`). Rollback aid only; TypeScript 6 reports these options as deprecated.                                                                                                              |
| `react`  | `@modern-js/tsconfig/react`  | Deprecated alias of `base`. Use `base` instead.                                                                                                                                                                                                                                |

Keep `@modern-js/tsconfig` and `@modern-js/app-tools` on the same version: the framework needs to know how to compile `api/`, `server/` and `shared/` from a bundler-mode `tsconfig.json`.

## Two-file layout

A project keeps one main `tsconfig.json` and, when it has server-side code, a `tsconfig.server.json` that only changes module options.

`tsconfig.json` (editor, Rspack aliases, type-check):

```json
{
  "extends": "@modern-js/tsconfig/base",
  "compilerOptions": {
    "noEmit": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmitOnError": true,
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

`tsconfig.server.json` (used by Modern.js to compile and type-check `api/`, `server/` and `shared/`, and to run them at dev time):

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "noEmit": false,
    "declaration": false
  },
  "include": ["api", "server", "shared"]
}
```

The four `compilerOptions` are exactly what `@modern-js/tsconfig/server` carries. They are inlined rather than added as a second `extends` entry so tools still on ts-node 10, which does not support `extends` arrays, can read the file.

Rules:

- `paths` stays in `tsconfig.json`. TypeScript replaces `paths` wholesale across `extends`, so never declare `paths` in `tsconfig.server.json`.
- Modern.js picks the server config in this order: `server.tsconfigPath` → `<appDir>/tsconfig.server.json` → `<appDir>/tsconfig.json`.
- Server code is transpiled with SWC and its output format follows `package.json#type`; the type check runs the project's own `tsc` command (TypeScript 5, 6 and 7 all work).
- Only the last fallback is rewritten, for the type check: when `tsconfig.json` resolves to an ESM `module` (for example `ESNext`) and `package.json#type` is not `module`, it runs with `module: NodeNext` / `moduleResolution: NodeNext`.

## Migrating an existing project

Modern.js does not generate `tsconfig.server.json`, and it does not rewrite your `tsconfig.json`. Projects created from the previous template still carry `"baseUrl": "./"`, which TypeScript 6 reports as TS5101 and TypeScript 7 rejects (TS5102). The `modernjs-migrate-tsconfig` Skill rewrites it into equivalent `paths`:

```bash
npx skills add web-infra-dev/modern.js --skill modernjs-migrate-tsconfig
node <skillDir>/scripts/migrate-tsconfig.mjs <projectDir>
```

It prefixes every `paths` target with the old `baseUrl`, adds `"*"` when source files use bare imports resolved through `baseUrl`, adds `"@api/*": ["./api/lambda/*"]` for BFF projects, and writes the `tsconfig.server.json` above for CommonJS projects with `api/` or `server/`. A `baseUrl` or `paths` declared in an `extends` parent is reported as a manual step instead. See [TypeScript Configuration](https://modernjs.dev/en/guides/basic-features/typescript) for the full rules.

## Getting Started

Please follow [Quick Start](https://modernjs.dev/en/guides/get-started/quick-start) to get started with Modern.js.

## Documentation

- [English Documentation](https://modernjs.dev/en/)
- [中文文档](https://modernjs.dev)

## Contributing

Please read the [Contributing Guide](https://github.com/web-infra-dev/modern.js/blob/main/CONTRIBUTING.md).

## License

Modern.js is [MIT licensed](https://github.com/web-infra-dev/modern.js/blob/main/LICENSE).
