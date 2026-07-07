---
'@modern-js/plugin-bff': patch
'@modern-js/server-utils': patch
---

feat: retarget bff-core import types at declaration emit (`afterDeclarations` transformer in api compilation) via an internal `clientTypesPackage` option injected by upper-layer frameworks, so generated crossProject client d.ts references a framework-owned types package instead of `@modern-js/bff-core`; `server-utils` compile now accepts `declarationTransformers`
feat: 在 api 编译的 declaration emit 阶段（`afterDeclarations` transformer）将 bff-core 的 import type 引用重定向到上层框架注入的内部 `clientTypesPackage`，crossProject 生成的 client d.ts 不再引用 `@modern-js/bff-core`；`server-utils` 的 compile 支持传入 `declarationTransformers`
