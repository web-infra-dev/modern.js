---
'@modern-js/app-tools': patch
---

fix: compile server TypeScript files to CommonJS with swc when ts-node is not installed, so the dev server can reload them and syntax like enum and decorators works on every Node.js version

fix: 未安装 ts-node 时用 swc 把服务端 TypeScript 文件编译为 CommonJS，使 dev server 能热更新这些文件，并在所有 Node.js 版本下支持 enum、装饰器等语法
