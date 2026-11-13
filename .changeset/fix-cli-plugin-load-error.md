---
'@modern-js/app-tools': patch
---

fix(app-tools): use a file URL when falling back to ESM imports for CLI plugins on Windows, and preserve the original plugin load error if the fallback also fails.

fix(app-tools)：修复 Windows 上 CLI 插件回退到 ESM 加载时的文件路径处理，并在回退加载也失败时保留原始插件加载错误。
