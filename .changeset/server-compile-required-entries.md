---
'@modern-js/server-utils': patch
'@modern-js/app-tools': patch
---

fix(server-utils, app-tools): always emit the server config and server cache. The server build now compiles `server/<meta>.server.ts|js` and `server/cache.ts|js` even when the tsconfig sets `noEmit` or `emitDeclarationOnly` or does not include them, and fails the build when a required server file is not emitted instead of reporting success. These files are now type-checked, so type errors in them fail the build. For a CommonJS app whose tsconfig targets ES modules, the server build emits CommonJS. Under `allowImportingTsExtensions`, `.ts` import specifiers are rewritten on TypeScript 5.7 and later; on older versions, imports with a `.ts` extension report an error. BFF compilation gets the same `noEmit` and `emitDeclarationOnly` override, so `api/` is emitted too.

fix(server-utils, app-tools)：服务端构建始终产出服务端配置和缓存文件。tsconfig 设置了 `noEmit` 或 `emitDeclarationOnly`，或没有包含 `server/<meta>.server.ts|js`、`server/cache.ts|js` 时，仍会编译这些文件。必需的服务端文件没有产出时构建失败，不再提示编译成功。这些文件现在会做类型检查，其中的类型错误会让构建失败。CommonJS 应用的 tsconfig 指定 ES 模块输出时，服务端构建改为产出 CommonJS。开启 `allowImportingTsExtensions` 时，TypeScript 5.7 及以上会改写 `.ts` 导入路径，更低版本中带 `.ts` 扩展名的导入会报错。BFF 编译同样覆盖 `noEmit` 和 `emitDeclarationOnly`，`api/` 也会产出。
