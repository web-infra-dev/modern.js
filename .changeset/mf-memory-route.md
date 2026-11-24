---
'@modern-js/runtime': minor
---

feat(runtime): support extended `memoryRoute` (`initialEntries`, `initialIndex`, `initialState`, `basename`), decouple `createModernReactRemote` from Host route basename when `memoryRoute` is configured, and follow same-origin 3xx loader redirects internally during MF Bridge / Service App SSR with seamless client hydration.

feat(runtime): 增强 MF Bridge 与 Service App 的 `memoryRoute` 协议（支持 `initialEntries`、`initialIndex`、`initialState`、`basename`），在配置 `memoryRoute` 时解耦 `createModernReactRemote` 与 Host basename 推导，并支持 `memoryRoute` 模式下的 SSR 内部同源 3xx 重定向与无错水合。
