---
'@modern-js/runtime': patch
---

fix: 修复 SSR 物理降级时，获取不到请求上下文的问题
fix: should get ssrContext anyway if entry is ssr enable
