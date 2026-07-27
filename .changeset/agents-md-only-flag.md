---
'@modern-js/create': patch
---

feat: replace the `create agents-md` subcommand with a `--agents-md-only` flag for updating agent files in existing projects. A flag never collides with a project name and is position-independent; it is mutually exclusive with a project name and `--no-agents-md`.

feat: 将 `create agents-md` 子命令改为 `--agents-md-only` 标志，用于为已有项目补齐/更新 agent 指引文件。标志不会与项目名冲突、也不受参数位置影响；不能与项目名或 `--no-agents-md` 同时使用。
