---
'@modern-js/app-tools': minor
---

feat(app-tools): simplify the default HTML meta tags to UTF-8 charset and `width=device-width, initial-scale=1` viewport. Remove the default zoom restrictions, `shrink-to-fit`, `viewport-fit`, `x-ua-compatible`, `renderer`, `layoutmode`, `imagemode`, `wap-font-scale`, and `format-detection` settings. Existing applications using these defaults will receive the new tags after upgrading and rebuilding. Configure `html.meta` explicitly if the application needs any of the removed settings, such as `viewport-fit=cover` for edge-to-edge layouts or `format-detection: telephone=no` to disable phone number detection.

feat(app-tools)：将默认 HTML meta 标签精简为 UTF-8 字符编码和 `width=device-width, initial-scale=1` 视口配置。移除默认缩放限制、`shrink-to-fit`、`viewport-fit`、`x-ua-compatible`、`renderer`、`layoutmode`、`imagemode`、`wap-font-scale` 和 `format-detection` 设置。使用默认配置的已有应用在升级并重新构建后也会采用这些新值。如需保留已移除的设置，请通过 `html.meta` 显式配置，例如使用 `viewport-fit=cover` 保持页面铺满屏幕，或使用 `format-detection: telephone=no` 关闭电话号码自动识别。
