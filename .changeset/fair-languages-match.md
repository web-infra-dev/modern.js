---
'@modern-js/plugin-i18n': patch
---

fix: fall back to supported base languages when detecting SSR query and cookie languages for custom i18n wrappers, while preserving exact language tag matches.

fix: 修复自定义 i18n wrapper 在 SSR 中通过 URL 参数和 cookie 检测语言时缺少基础语言回退的问题，同时保留完整语言标签的优先匹配。
