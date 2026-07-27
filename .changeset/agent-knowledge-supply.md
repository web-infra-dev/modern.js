---
'@modern-js/app-tools': minor
'@modern-js/create': minor
---

feat: agent knowledge supply — bundle version-matched English docs into the app-tools tarball (`docs/`) on publish, and generate `AGENTS.md` / `CLAUDE.md` in new projects created by `@modern-js/create` (skip with `--no-agents-md`). Existing projects can run `npx @modern-js/create agents-md` to add or idempotently refresh these files after an upgrade (managed marker block is updated in place, user content is preserved). Also fixes boolean flags swallowing the following positional argument (e.g. `create --sub my-app`).

feat: Agent 知识供给 —— 发布时将版本匹配的英文文档打进 app-tools tarball（`docs/`），并在 `@modern-js/create` 新建项目时默认生成 `AGENTS.md` / `CLAUDE.md`（`--no-agents-md` 可跳过）。已有项目可运行 `npx @modern-js/create agents-md` 在升级后补齐或幂等更新这两个文件（就地更新托管标记块，保留用户自定义内容）。同时修复布尔参数吞掉后续位置参数的问题（如 `create --sub my-app`）。
