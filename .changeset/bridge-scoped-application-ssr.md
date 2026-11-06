---
'@modern-js/runtime': minor
---

Support server rendering and progressive hydration of Modern Module Federation application exports using their existing route scopes. Restore an initial loader snapshot and deferred updates per instance without computing a duplicate final snapshot, reuse server DOM, and retain the root, router and page state during prop updates. Preserve consumer basenames and the existing Browser, Hash and explicit memory navigation modes.

复用已有路由选区，为 Modern Module Federation 应用导出接入服务端渲染与渐进式水合。按实例恢复初始 loader 快照和 deferred 更新，不重复计算最终快照，复用服务端 DOM，并在 props 更新时保留 Root、Router 和页面状态。保留消费者 basename，以及现有 Browser、Hash 和显式 memory 导航模式。
