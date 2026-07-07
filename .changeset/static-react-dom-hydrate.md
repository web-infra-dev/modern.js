---
'@modern-js/runtime': minor
---

refactor: drop React 17 support in the browser runtime: react-dom/client is now imported statically in the render/hydrate entry (renderWithReact18/hydrateWithReact18 renamed to renderWithReact/hydrateWithReact), all isReact18 branches, the IS_REACT18 define and the react17-only IgnorePlugin are removed, and peerDependencies now require react/react-dom >=18
refactor: 浏览器运行时不再支持 React 17：渲染/水合入口改为静态 import react-dom/client（renderWithReact18/hydrateWithReact18 更名为 renderWithReact/hydrateWithReact），移除所有 isReact18 分支、IS_REACT18 define 与 react17 专用 IgnorePlugin，peerDependencies 要求 react/react-dom >=18
