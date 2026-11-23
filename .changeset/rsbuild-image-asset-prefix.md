---
'@modern-js/image': patch
---

fix(image): pass the IPX path prefix as `ipx.assetPrefix`, which replaces `ipx.basename` in `@rsbuild-image/core` 0.0.1-next.36; `ipx.basename` is still accepted as a deprecated alias.

fix(image): `@rsbuild-image/core` 0.0.1-next.36 将 `ipx.basename` 改名为 `ipx.assetPrefix`，插件改为传 `ipx.assetPrefix`；`ipx.basename` 作为已废弃的别名继续兼容。
