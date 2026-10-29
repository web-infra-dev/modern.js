---
'@modern-js/bff-core': patch
---

fix(bff-core): accept both Zod 3 and Zod 4 in the `zod` peer range (`^3.25.76 || ^4.6.7`). Zod 4.6.7+ is recommended. After upgrading to Zod 4, validate uploaded files in `Upload` schemas with `z.file()` instead of `z.record()`.

fix(bff-core)：`zod` peer 依赖范围同时支持 Zod 3 和 Zod 4（`^3.25.76 || ^4.6.7`），推荐使用 4.6.7 及以上。升级到 Zod 4 后，`Upload` 的 schema 校验上传文件请改用 `z.file()`，不要再用 `z.record()`。
