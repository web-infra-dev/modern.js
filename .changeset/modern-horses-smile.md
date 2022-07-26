---
'@modern-js/core': patch
'@modern-js/plugin-ssg': patch
---

fix: the SSG callback is called once for each baseUrl, when a user configures multiple baseUrl.
fix: 当用户配置了多个 baseUrl 时，将会为每个 baseUrl 调用一次 SSG 回调函数。
