---
'@modern-js/plugin-ssg': minor
'@modern-js/runtime': minor
'@modern-js/types': minor
'@modern-js/server-core': patch
---

feat: support a build-time `ssgParams` export alongside a conventional page's data loader to generate static paths from route parameters. Preserve explicit SSG route lists, validate generated parameters, and match encoded SSG paths exactly in the production server.

feat: 支持在约定式路由的数据加载文件中导出构建期 `ssgParams`，由路由参数生成静态路径。保留显式 SSG 路径列表的优先级，校验生成参数，并在生产服务器中精确匹配编码后的 SSG 路径。
