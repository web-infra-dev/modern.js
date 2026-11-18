---
'@modern-js/plugin-ssg': minor
'@modern-js/runtime': minor
'@modern-js/types': minor
'@modern-js/utils': patch
---

feat: support a build-time `ssgParams` export alongside a conventional page's data loader to generate static paths from route parameters. Combine generated paths with explicit SSG route lists, giving explicit options precedence for duplicate URLs. Global SSG settings apply to every entry unless an entry map is provided.

feat: 支持在约定式路由的数据加载文件中导出构建期 `ssgParams`，由路由参数生成静态路径。合并生成路径与显式 SSG 路径列表，重复 URL 使用显式配置。未提供入口映射时，全局 SSG 配置适用于所有入口。
