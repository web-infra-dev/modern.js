---
'@modern-js/app-tools': minor
---

feat: enable Rspack lazy compilation by default in CSR and stream SSR dev (string SSR / RSC / SSG stay disabled)
feat: keep stream SSR first-screen assets correct under lazy compilation by forcing route components eager

feat: CSR 与 stream SSR 开发环境下默认开启 Rspack 按需编译（string SSR / RSC / SSG 仍默认关闭）
feat: 通过强制路由组件 eager 编译，保证 stream SSR 在按需编译下首屏资源仍正确
