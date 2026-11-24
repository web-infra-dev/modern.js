---
'@modern-js/server-utils': patch
'@modern-js/plugin-bff': patch
---

fix(plugin-bff): fail the build on type errors in api/ and keep the dev server running on compile errors; set "noEmitOnError": false in the server tsconfig to only report them

fix(plugin-bff): api/ 有类型错误时构建失败，dev 时编译错误只打印不中断；在服务端 tsconfig 设置 "noEmitOnError": false 可只报错不中断构建
