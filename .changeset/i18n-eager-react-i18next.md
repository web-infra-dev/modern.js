---
'@modern-js/plugin-i18n': patch
---

fix(plugin-i18n): bundle the runtime's react-i18next and i18next dynamic imports eagerly so they no longer add an async chunk request before the first render.

fix(plugin-i18n): 运行时对 react-i18next 和 i18next 的动态引入改为打进当前 chunk，首屏渲染前不再多请求一个异步 chunk。
