# 安装依赖参考

> 改完 `package.json` 后，按当前仓库的包管理器安装。

## 1. 确定仓库根目录

```bash
git rev-parse --show-toplevel
```

失败（非 Git）则用项目目录。

## 2. 检测包管理器（按优先级，命中即停）

| 锁文件 / 标记 | 包管理器 | 安装命令 |
| --- | --- | --- |
| `pnpm-lock.yaml` | pnpm | `pnpm install` |
| `yarn.lock` | yarn | `yarn install` |
| `bun.lockb` | bun | `bun install` |
| `package-lock.json` | npm | `npm install` |
| 以上都没有 | 默认 pnpm | `pnpm install` |

## 3. 执行

在仓库根目录执行对应命令，非交互。失败则明确告知用户并给出手动命令，不重试、不回滚、不中断上层流程：

```
❌ 自动安装依赖失败，请在项目根目录手动执行：<对应命令>
```

## 版本一致性

新装的 `@modern-js/*` 官方包版本必须与 `@modern-js/app-tools` 一致（统一版本号发布）。
`enable.mjs` 已按 app-tools 的版本/协议写入新依赖。
