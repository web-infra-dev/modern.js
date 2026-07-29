---
'@modern-js/app-tools': patch
'@modern-js/create': patch
---

feat: expose the docs bundling and agent-file generation as reusable APIs, so frameworks built on Modern.js can ship the same capability without reimplementing it — `modern-bundle-docs` bin / `bundleDocs()` for the docs bundle, and `@modern-js/create/agent-files` for the idempotent AGENTS.md + CLAUDE.md writer.

feat: 将随包文档打包与 agent 指引文件生成能力对外暴露为可复用 API，使基于 Modern.js 的框架无需重复实现——文档打包提供 `modern-bundle-docs` 命令与 `bundleDocs()`，agent 文件写入提供 `@modern-js/create/agent-files`。
