---
'@modern-js/app-tools': patch
---

fix: exclude react-dom from the default dev lazy compilation so hydration never waits on a lazy-compile round trip
fix: 默认的 dev 懒编译配置排除 react-dom，避免每次页面加载的 hydration 都要等待一次懒编译往返
