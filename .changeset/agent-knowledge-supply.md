---
'@modern-js/app-tools': minor
'@modern-js/create': minor
---

feat: agent knowledge supply — bundle version-matched English docs into the app-tools tarball (`main-doc/docs/en/`) on publish, and generate `AGENTS.md` / `CLAUDE.md` in new projects created by `@modern-js/create` (skip with `--no-agents-md`); also fixes boolean flags swallowing the following positional argument (e.g. `create --sub my-app`)

feat: Agent 知识供给 —— 发布时将版本匹配的英文文档打进 app-tools tarball（`main-doc/docs/en/`），并在 `@modern-js/create` 新建项目时默认生成 `AGENTS.md` / `CLAUDE.md`（`--no-agents-md` 可跳过）；同时修复布尔参数吞掉后续位置参数的问题（如 `create --sub my-app`）
