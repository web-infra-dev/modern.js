---
'@modern-js/runtime': patch
---

fix(runtime): string SSR waits for suspended content such as `React.lazy` components before outputting the HTML, so they are no longer left for the client to render.

fix(runtime)：string 模式 SSR 等 `React.lazy` 等挂起的内容就绪后再输出 HTML，这些内容不再留给浏览器渲染。
