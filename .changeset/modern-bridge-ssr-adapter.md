---
'@modern-js/runtime': minor
'@modern-js/plugin-module-federation': minor
---

Add createModernBridgeComponent and public render, hydrate and renderStream callbacks for Modern application exports. Select browser and Node implementations from the same route scope and connect the built-in Module Federation Host to Core's shared streaming SSR engine. Preserve existing unified consumers, ordinary component SSR, noSSR and CSR providers.

新增 createModernBridgeComponent 以及 render、hydrate、renderStream 回调，让 Modern 应用导出使用同一选区的浏览器与 Node 实现，并将内置 Module Federation Host 接入 Core 共享流式 SSR。保留统一消费入口、普通组件 SSR、noSSR 和已有 CSR 生产者。

Separate browser and Node producer/consumer implementations and verify both ESM and CommonJS runtime import graphs during the runtime build. Keep shared remote selection, props inference and route basename calculation in common modules.

拆分浏览器与 Node 的生产者和消费者实现，在构建时检查 ESM 与 CommonJS 入口依赖图。远端选择、props 推导及路由 basename 计算继续共享。

Use progressive hydration exclusively for Modern application exports and require a Core version that accepts progressive results without a final snapshot. Resolve both legacy and conditional Core SSR export maps and unify their ESM and CommonJS context entries.

Modern 应用导出统一使用渐进式水合，需要支持省略最终快照的配套 Core 版本。兼容 Core 的旧式和条件 SSR 导出表，并统一对应的 ESM 与 CommonJS 上下文入口。

Use the published Core preview `0.0.0-feat-enhanced-runtime-unification-20261104092109`, including progressive SSR results without a final snapshot. Keep runtime, adapter, examples and integration applications on the matching preview.

接入真实发布的 Core 预览版本 `0.0.0-feat-enhanced-runtime-unification-20261104092109`，支持省略最终快照的渐进式 SSR 结果。运行时、适配器、示例和集成应用统一使用配套预览版本。
