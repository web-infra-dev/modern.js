---
'@modern-js/builder': minor
---

feat(builder): support customizing RSC server/client environment names via `server.rsc.environments`

`server.rsc` now accepts an object form `{ environments?: { server?: string; client?: string } }` in addition to a boolean. This forwards the existing `environments` option of `rsbuild-plugin-rsc`, letting frameworks that declare their own Rsbuild environments map RSC onto them instead of having the plugin create new empty `server`/`client` environments (which otherwise fall back to the default `./src` entry and fail to resolve in non-convention setups). Passing `true`/`false` keeps the previous default behavior, so the change is fully backward compatible.

feat(builder): 支持通过 `server.rsc.environments` 自定义 RSC server/client 环境名

`server.rsc` 在原有 boolean 之外新增对象形式 `{ environments?: { server?: string; client?: string } }`，透传 `rsbuild-plugin-rsc` 已有的 `environments` 选项，使已声明自有 Rsbuild 环境的框架可将 RSC 映射到这些环境，而不必让插件新建空的 `server`/`client` 环境（否则会回落到默认入口 `./src` 而无法解析）。传 `true`/`false` 时行为不变，完全向后兼容。
