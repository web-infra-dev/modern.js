---
'@modern-js/runtime': minor
'@modern-js/plugin-module-federation': minor
---

Add createModernBridgeComponent and public render, hydrate and renderStream callbacks for Modern application exports. Select browser and Node implementations from the same route scope and connect the built-in Module Federation Host to Core's shared streaming SSR engine. Preserve existing unified consumers, ordinary component SSR, noSSR and CSR providers.

新增 createModernBridgeComponent 以及 render、hydrate、renderStream 回调，让 Modern 应用导出使用同一选区的浏览器与 Node 实现，并将内置 Module Federation Host 接入 Core 共享流式 SSR。保留统一消费入口、普通组件 SSR、noSSR 和已有 CSR 生产者。
