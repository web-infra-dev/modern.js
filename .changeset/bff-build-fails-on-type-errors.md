---
'@modern-js/server-utils': patch
'@modern-js/plugin-bff': patch
'@modern-js/create': patch
---

fix(plugin-bff): fail the build on type errors in api/ when the server tsconfig sets "noEmitOnError": true, and keep the dev server running on compile errors

fix(plugin-bff): 服务端 tsconfig 设置 "noEmitOnError": true 时，api/ 的类型错误让构建失败；dev 时编译错误只打印不中断
