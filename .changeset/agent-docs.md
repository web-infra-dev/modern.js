---
'@modern-js/app-tools': patch
'@modern-js/create': patch
---

feat: ship version-matched docs inside the package so AI coding agents read documentation matching the installed version instead of their training data

`@modern-js/app-tools` now bundles the docs site's build output as `docs/`, with `llms.txt` as its index. `@modern-js/create` writes an `AGENTS.md` / `CLAUDE.md` pair pointing there, and `--agents-md-only` adds or refreshes them in an existing project. Both capabilities are exported for downstream frameworks to reuse.

feat: 随包分发与版本匹配的文档，让 AI 编码助手读到与所装版本一致的内容，而不是训练数据里的旧知识

`@modern-js/app-tools` 将文档站构建产物打包为 `docs/`，并附 `llms.txt` 索引；`@modern-js/create` 生成指向该路径的 `AGENTS.md` / `CLAUDE.md`，`--agents-md-only` 可为已有项目补齐或更新。两项能力均已导出，供下游框架复用。
