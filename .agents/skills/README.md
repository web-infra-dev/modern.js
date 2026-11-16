# 维护者 Skills

本目录用于存放仅供 Modern.js 仓库维护者使用的 Skills。依赖检查由仓库 scripts、Git hooks 和 CI 执行，入口见[检查指南](../../scripts/lint-package-json/README.md)。

本目录的 Skill 在 frontmatter 中设置 `metadata.internal: true`，避免出现在 `skills` CLI 的默认安装列表中。

直接在本目录新增或修改 Skill。`.claude/skills` 是指向这里的相对软链接，与源码一起提交到 Git，无需安装或同步。`.agents/runs/` 和工具的本地配置不提交。

面向 Modern.js 应用开发者分发的 Skills 放在根目录 [`skills/`](../../skills/README.md)。
