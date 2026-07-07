---
'@modern-js/runtime': minor
---

refactor: import react-dom/client statically in the browser render/hydrate entry and drop the React 17 render path (renderWithReact18/hydrateWithReact18 renamed to renderWithReact/hydrateWithReact); the react17-only IgnorePlugin for react-dom/client is removed
refactor: 浏览器端渲染/水合入口改为静态 import react-dom/client，移除 React 17 渲染路径（renderWithReact18/hydrateWithReact18 更名为 renderWithReact/hydrateWithReact），并删除 react17 专用的 react-dom/client IgnorePlugin
