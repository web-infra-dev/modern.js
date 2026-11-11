---
'@modern-js/runtime': patch
---

fix(runtime): isolate Helmet state per SSR render so concurrent string and streaming renders preserve their own head tags without serialization

fix(runtime): 按 SSR 渲染独立收集 Helmet 状态，避免字符串和流式渲染之间的 head 串扰并保留并发

Use upstream react-helmet-async 2.0.5 and remove the legacy react-helmet implementation and type dependencies. React 19 projects may receive peer warnings or fail strict peer checks because the upstream peer range excludes React 19. Directly declaring both react-helmet-async 2.0.5 and React 19 may also cause npm 10 to fail with ERESOLVE under default settings.

使用官方 react-helmet-async 2.0.5，移除旧 react-helmet 实现及类型依赖。由于上游 peer 范围未包含 React 19，React 19 项目可能收到 peer 警告或无法通过严格 peer 检查。直接同时声明 react-helmet-async 2.0.5 和 React 19 时，npm 10 默认安装也可能因 ERESOLVE 失败。
