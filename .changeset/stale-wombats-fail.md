---
'@modern-js/runtime': patch
'@modern-js/prod-server': patch
'@modern-js/types': patch
---

fix: remove header info from SSR ctx to avoid security issues, reserved a switch
fix: 移除 SSR 上下文中的 header 信息，避免造成安全问题，预留一个字段开启
