---
'@modern-js/runtime': patch
---

fix(runtime): keep chunk IDs that would lose information when converted to numbers in `loadable-stats.json`, so `compact-hashed` IDs with leading zeros still match the ones registered by the runtime and string SSR hydration can finish.

fix(runtime): 修复 `loadable-stats.json` 将 `compact-hashed` 产生的前导零 chunk ID 转为数字，导致与实际注册的 ID 不匹配、string SSR 水合无法完成的问题。
