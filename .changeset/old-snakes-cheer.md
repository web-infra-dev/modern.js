---
'@modern-js/app-tools': patch
---

fix: entry detection not work when `src/xx/index.tsx` export a default function

fix: 修复当存在 `src/xx/index.tsx` 并导出一个默认函数时，entry 检测不生效的问题
