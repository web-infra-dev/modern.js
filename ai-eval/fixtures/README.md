# eval fixtures

供 `ai-eval` 任务作为输入的最小工程片段。每个 fixture 只保留复现问题所需的最少文件。

- `phantom-dep/` — 含一个幽灵依赖（源码 import 了未在 package.json 声明的包），供 `dependency-audit-phantom` 任务定位。
- `v2-simple-pages/` — Modern.js v2 风格的简单 `src/pages` 静态路由，供 `migrate-pages-to-routes` 任务迁移到 v3 约定式 `src/routes`。

> 这些 fixture 不参与 workspace 安装（不在 `pnpm-workspace.yaml` 范围内），仅作为 eval 的只读输入样例。
