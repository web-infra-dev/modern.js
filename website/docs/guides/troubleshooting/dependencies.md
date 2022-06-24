---
sidebar_position: 1
---

# 依赖安装问题

### 如何升级项目中的 Modern.js 到最新版本？

对于使用 yarn 的项目，可以执行：

```bash
yarn upgrade --scope @modern-js
```

对于使用 pnpm 的项目，可以执行：

```bash
pnpm update "@modern-js/*" -r
```

如果需要了解不同版本之间的更新内容，可以查看：

- Modern.js 发版日志：[Modern.js/releases](https://github.com/modern-js-dev/modern.js/releases)。
- 各个 package 下的 `CHANGELOG.md` 文件。
