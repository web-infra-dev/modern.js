---
'@modern-js/app-tools': patch
---

fix(app-tools): scope adapterSSR's SSR entry filtering to Modern server / service-worker environments

`builderPluginAdapterSSR` ran `applyFilterEntriesBySSRConfig` for every `target === 'node'` environment, which wrongly captured custom node environments added via the new `modifyBuilderEnvironments` hook — their entry was filtered out (it is not a Modern SSR entry) and the bundler fell back to its default `./src` entry. Gate the entry filtering to Modern's own `server` and service-worker environments by name, so a custom node environment keeps its own entry. Modern SSR behavior is unchanged (the `server` / service-worker envs are still filtered).

fix(app-tools): 把 adapterSSR 的 SSR entry 过滤限定到 Modern server / service-worker 环境

`builderPluginAdapterSSR` 原先对所有 `target === 'node'` 环境执行 `applyFilterEntriesBySSRConfig`，这会误伤通过新 `modifyBuilderEnvironments` hook 注入的自定义 node 环境——它们的 entry 被过滤空（不是 Modern SSR entry），打包器回落到默认 `./src` entry。现按环境名把 entry 过滤限定到 Modern 自己的 `server` 与 service-worker 环境，自定义 node 环境保留自己的 entry。Modern SSR 行为不变（`server` / service-worker 环境仍会被过滤）。
