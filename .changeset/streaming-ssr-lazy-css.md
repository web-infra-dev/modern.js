---
'@modern-js/app-tools': patch
'@modern-js/runtime': patch
---

fix(runtime,app-tools): inject CSS of React.lazy descendants into streaming SSR shell to prevent FOUC; slim inline route manifest to only `chunkIds` when RSC is disabled

fix(runtime,app-tools): 流式 SSR 注入 React.lazy 子 chunk 的 CSS 到首屏 shell, 避免懒加载组件出现样式闪烁; 非 RSC 场景下 inline 路由 manifest 仅保留 `chunkIds`, 减少 HTML 体积
