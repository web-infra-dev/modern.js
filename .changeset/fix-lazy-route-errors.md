---
'@modern-js/runtime': patch
'@modern-js/runtime-utils': patch
---

fix: preserve original module evaluation and chunk loading errors in generated nested routes by sharing import results between non-blocking preloading and component rendering, including string SSR client navigation. Allow later preloads to retry JS/CSS chunk request failures before React.lazy consumes the loader, and retain loadable's existing request retry behavior.

fix: 让生成的嵌套路由在非阻塞预加载与组件渲染之间共享导入结果，保留原始模块执行和 chunk 加载异常，并覆盖 string SSR 客户端导航。React.lazy 尚未接手的 JS/CSS chunk 请求失败允许后续预加载重试，同时保留 loadable 现有的请求重试行为。
