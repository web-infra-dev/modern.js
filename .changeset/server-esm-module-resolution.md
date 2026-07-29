---
'@modern-js/app-tools': patch
'@modern-js/server-utils': patch
'@modern-js/utils': patch
---

fix: make custom server output runnable under native ESM (pass `moduleType`, resolve `.tsx` / `.jsx` entries, transform JSX)

fix: 修复自定义 Server 在原生 ESM 下的产物不可运行问题（透传 `moduleType`、支持 `.tsx` / `.jsx` 入口解析、编译 JSX）
