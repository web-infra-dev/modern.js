---
name: modernjs-dependency-audit
description: 审计一个包/项目的依赖健康度 —— 幽灵依赖（用了未声明）、循环依赖、重复多版本、peer/dev/prod 放置、安装体积与耗时归因。在「依赖报错、pnpm 严格模式炸、构建变慢、想优化体积、review 依赖改动」时使用。
user-invocable: true
---

# modernjs-dependency-audit

依赖健康体检 + 优化建议，**维护者 / 用户双维度共用**（本仓 monorepo 一套、用户项目一套，同一 SOP、不同入口）。

> 状态：P1 进行中。`scripts/audit.mjs` 已落地**幽灵依赖 + 循环依赖 + 重复多版本**检测（支持 `--json`），其余按下方 roadmap 迭代。
> 建议针对**单个包/用户项目**跑；直接对整个 monorepo 根跑会因 codegen 模板字符串里的 `import` 文本产生正则误报（AST 化后解决）。

## 何时触发
- `import` 的包在 pnpm 严格模式下报 "module not found"（疑似幽灵依赖）
- 构建/安装变慢、产物体积上涨，想定位归因
- review 一个改 `package.json` / 新增依赖的 PR
- 例行依赖体检

## SOP
1. **确定范围**：单个包目录（monorepo 里 `packages/<x>`）或整个用户项目根。
2. **跑检测**（命令相对本 skill 目录）：
   ```bash
   node scripts/audit.mjs <target-dir>        # 幽灵 / 循环 / 重复多版本（--json 输出）
   node scripts/size-audit.mjs <target-dir>   # 安装体积归因（需 node_modules，无则不推断）
   ```
   输出分级报告（阻断 / 建议 / 可选）+ JSON（便于 CI 消费）。
3. **解读 & 给修复**：
   - 幽灵依赖 → 补 `package.json` 声明，或移除多余 import；**不手改 lockfile**。
   - 循环依赖 → 给最短断环建议。
   - 重复多版本 → `pnpm dedupe` 视角收敛。
4. **验证**：修完跑 `pnpm install` + 该包 `build` / `test`，确认不回归。

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
