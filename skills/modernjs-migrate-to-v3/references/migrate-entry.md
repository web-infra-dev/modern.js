# 入口 / 运行时配置迁移（人工项）

> `migrate.mjs` 已自动处理：`index.*`→`entry.*`（含 bootstrap 改写）、`App.config` 抽取到 `src/modern.runtime.ts`。
> 本文覆盖**需人工**的：`App.init`、`routes/layout` 的 `config`/`init` 导出、多入口。依据 `guides/upgrade/entry`。

## App.init → 运行时插件

**迁移前（src/App.tsx）**
```tsx
App.init = context => {
  context.store = createStore();
};
```
**迁移后（src/modern.runtime.ts）**
```ts
import type { RuntimePlugin } from '@modern-js/runtime';
import { defineRuntimeConfig } from '@modern-js/runtime';

const initPlugin = (): RuntimePlugin => ({
  name: 'init-plugin',
  setup: api => ({
    init({ context }) {
      context.store = createStore();
    },
  }),
});

export default defineRuntimeConfig({ plugins: [initPlugin()] });
```
步骤：把 `App.init` 函数体移入插件 `setup` 的 `init({ context })`；从 `App.tsx` 删除 `App.init`。若 `modern.runtime.ts` 已有 `defineRuntimeConfig`（来自自动迁移的 `App.config`），把 `plugins` **合并**进去，不要覆盖。

## routes/layout.tsx 的 config / init 导出

- `export const config = () => ({...})` → 移到 `src/modern.runtime.ts` 的 `defineRuntimeConfig({...})`，删除 layout 的 `config` 导出。
- `export const init = context => {...}` → 同 `App.init`，改为运行时插件。

## 多入口

`src/modern.runtime.ts` 用函数式：`export default defineRuntimeConfig(entryName => { ... 按入口名返回配置 ... })`。合并同一入口的 `App.config/App.init` 与 `routes/layout` 的 `config/init`。

> v3 **不再支持在 `modern.config.ts` 配 runtime**，必须用 `modern.runtime.ts`。
