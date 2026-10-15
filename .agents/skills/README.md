# 维护者 Skills

本目录存放开发 Modern.js 仓库时使用的 Skills，目前提供 [dependency-audit](dependency-audit/SKILL.md) 做依赖健康检查。

本目录的 Skill 在 frontmatter 中设置 `metadata.internal: true`，避免出现在 `skills` CLI 的默认安装列表中。

直接在本目录新增或修改 Skill。`.claude/skills` 是指向这里的相对软链接，与源码一起提交到 Git，无需安装或同步。`.agents/runs/` 和工具的本地配置不提交。

面向 Modern.js 应用开发者分发的 Skills 放在根目录 [`skills/`](../../skills/README.md)。
