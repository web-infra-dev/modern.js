---
'@modern-js/app-tools': patch
'@modern-js/utils': patch
---

fix(app-tools, utils): centralize CLI plugin loading in `compatibleRequire`. Fall back to ESM imports only when `require` reports an incompatible ESM module, including modules with top-level await. Preserve other loading errors without retrying, avoiding misleading Windows URL scheme errors, and report the actual ESM execution error if the fallback fails.

fix(app-tools, utils)：统一使用 `compatibleRequire` 加载 CLI 插件，仅在 `require` 无法加载 ESM 模块时回退到 ESM 导入，支持包含顶层 await 的模块。其他加载错误直接抛出，避免被 Windows URL 协议错误覆盖。ESM 回退执行失败时，报告实际的 ESM 执行错误。
