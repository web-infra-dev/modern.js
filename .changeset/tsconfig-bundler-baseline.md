---
'@modern-js/tsconfig': minor
'@modern-js/utils': minor
'@modern-js/server-utils': minor
'@modern-js/app-tools': minor
'@modern-js/plugin-bff': minor
'@modern-js/create': minor
'@modern-js/sandpack-react': minor
'@modern-js/types': minor
---

feat: move the shared tsconfig baseline to bundler mode and add the `tsconfig.server.json` convention. `@modern-js/tsconfig/base` now uses `module: ESNext` / `moduleResolution: bundler` / `jsx: react-jsx` / `target: ES2022`; a new `@modern-js/tsconfig/server` preset carries only the server emit overrides (`module: NodeNext`, `moduleResolution: NodeNext`, `noEmit: false`, `declaration: false`), and the previous baseline is kept as `@modern-js/tsconfig/legacy`. The server tsconfig is resolved as `server.tsconfigPath` → `<appDir>/tsconfig.server.json` → `<appDir>/tsconfig.json`; only the last fallback is rewritten to NodeNext (with a one-time warning) when it would emit ESM in a CommonJS project. Path aliases are now read through the whole `extends` chain, so `paths` stays in `tsconfig.json`. `@modern-js/tsconfig` declares an optional peer dependency on `@modern-js/app-tools >= 3.10.0`, the create / sandpack templates drop `baseUrl` in favor of the new layout, and `@modern-js/utils` / `@modern-js/types` add `types` conditions (and the `@modern-js/types/cli` subpath) to their `exports` so bundler / NodeNext resolution finds their declarations.
feat: 共享 tsconfig 基线切换到 bundler 模式，并新增 `tsconfig.server.json` 约定。`@modern-js/tsconfig/base` 改为 `module: ESNext` / `moduleResolution: bundler` / `jsx: react-jsx` / `target: ES2022`；新增 `@modern-js/tsconfig/server` 预设，仅包含服务端产物所需的四个覆盖项（`module: NodeNext`、`moduleResolution: NodeNext`、`noEmit: false`、`declaration: false`），旧基线保留为 `@modern-js/tsconfig/legacy`。服务端 tsconfig 按 `server.tsconfigPath` → `<appDir>/tsconfig.server.json` → `<appDir>/tsconfig.json` 解析；只有最后的回退项在 CommonJS 项目中会产出 ESM 时才被改写为 NodeNext，并打印一次警告。路径别名现在沿整条 `extends` 链读取，因此 `paths` 只需留在 `tsconfig.json`。`@modern-js/tsconfig` 声明了对 `@modern-js/app-tools >= 3.10.0` 的可选 peer 依赖，create / sandpack 模板移除 `baseUrl` 并采用新布局；`@modern-js/utils` 与 `@modern-js/types` 的 `exports` 补充了 `types` 条件（以及 `@modern-js/types/cli` 子路径），使 bundler / NodeNext 解析能找到类型声明。
