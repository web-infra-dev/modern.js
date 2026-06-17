---
'@modern-js/runtime': patch
---

fix(runtime): streaming SSR no longer skips route stylesheets when the same CSS URL already appears as a non-stylesheet `<link>` such as `rel="prefetch"`

fix(runtime): 流式 SSR 不再因为同一 CSS URL 已作为 `rel="prefetch"` 等非 stylesheet `<link>` 出现在模板中而跳过路由样式注入
