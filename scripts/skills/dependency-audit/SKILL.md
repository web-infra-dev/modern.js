---
name: dependency-audit
description: 审计 Modern.js 仓库依赖健康度，默认直接扫描整仓并从维护者与 Modern 用户 app 两个视角输出报告，覆盖幽灵依赖、循环依赖、重复多版本、安装体积与安装耗时。在「review 依赖改动、pnpm 严格模式报错、构建变慢、包边界不清」时使用。
user-invocable: true
---

# dependency-audit

依赖健康体检 + 优化建议，面向**开发 Modern.js 仓库的维护者**。

> 状态：P1 进行中。`scripts/audit.mjs` 默认可直接扫描整个 Modern.js 仓库并输出双视角报告；仍支持显式传入单个包目录做聚焦分析。

## 何时触发
- `import` 的包在 pnpm 严格模式下报 "module not found"（疑似幽灵依赖）
- 构建/安装变慢、产物体积上涨，想定位归因
- review 一个改 `package.json` / 新增依赖的 PR
- 检查高风险包是否把运行时依赖误放到 `devDependencies`
- 例行依赖体检

## SOP
1. **直接跑整仓报告**（在仓库根执行）：
   ```bash
   node scripts/skills/dependency-audit/scripts/audit.mjs
   ```
   默认输出：
   - **维护者视角**：整仓 package manifest、源码依赖、lockfile 重复多版本、已安装体积；安装耗时默认不推断，可用 `--measure-install` 实测。
   - **Modern 用户 app 视角**：默认从 create 模板生成一个 user app fixture，并在该 fixture 内独立 install，输出用户应用依赖问题、重复版本、安装耗时和落盘体积；fixture 默认复用 `.agents/runs/dependency-audit/user-app-fixture`，需要保留当次现场时显式加 `--keep-user-app-fixture`，需要跳过 install 时显式加 `--skip-user-app-install`。
2. **按需聚焦单包**：
   ```bash
   node scripts/skills/dependency-audit/scripts/audit.mjs packages/solutions/app-tools
   ```
3. **机器可读 / CI**：
   ```bash
   node scripts/skills/dependency-audit/scripts/audit.mjs --json
   node scripts/skills/dependency-audit/scripts/audit.mjs --fail-on-findings
   node scripts/skills/dependency-audit/scripts/audit.mjs --skip-user-app-install
   node scripts/skills/dependency-audit/scripts/audit.mjs --keep-user-app-fixture
   ```
4. **解读 & 给修复**：
   - 幽灵依赖 → 补 `package.json` 声明，或移除多余 import；**不手改 lockfile**。
   - 循环依赖 → 给最短断环建议。
   - 重复多版本 → `pnpm dedupe` 视角收敛。
5. **验证**：修完跑 `pnpm install` + `pnpm --filter <pkg> build` / `pnpm --filter <pkg> test`，确认不回归。

## 安全红线
- 只读分析 + 给建议；**不自动改 lockfile / dist / node_modules**。
- 改 `package.json` 前先展示 diff、让人确认。

## 能力 roadmap
- [x] 幽灵依赖（import 的外部包未在 deps/devDeps/peerDeps/optionalDeps 声明）
- [x] 循环依赖（相对 import 构图找环 + 断环建议）
- [x] 重复多版本（读 `pnpm-lock.yaml`，找多版本包 + `pnpm dedupe`/overrides 建议）
- [x] 安装体积归因（`size-audit.mjs`，数据优先：无 node_modules 不推断）
- [ ] 安装耗时归因（需实测 install）
- [ ] peer/dev/prod 放置校验、`exports`/`types` 正确性
- [ ] 接 AST（替换正则提取，消除 codegen 模板字符串误报）
