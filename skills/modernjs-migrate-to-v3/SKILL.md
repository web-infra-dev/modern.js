---
name: modernjs-migrate-to-v3
description: 将一个 Modern.js 2.0 应用迁移到 3.0，优先做可安全自动化的依赖/配置/入口/import 改写，剩余复杂项收敛为人工清单。在「升级 Modern.js 大版本、modern.config 报废弃、要从 webpack/pages 迁到 Rspack/routes、自定义 server 报错」时使用。
---

# Migrate Modern.js 2.0 to 3.0

本 skill 用于单个 Modern.js 应用的 v2→v3 迁移。目标：完成可安全改写的部分，剩余风险收敛成明确人工清单。规则与示例以仓库 `guides/upgrade/*` 的真实文档为准。

## 使用原则

- 调用方先确定 `projectDir`，所有修改仅限 `projectDir`
- 不在开始时读取全部 `references/`；仅在命中人工项时按需加载
- 每个成功步骤结束后提交一次（见 `references/commit-changes.md`）

## 输出要求

- 进度简短：`[X/6] 开始/完成/跳过/失败`
- 非阻断问题记录后继续；阻断问题立即停止并说明步骤、原因、恢复方式

## 前置检查

```bash
git -C <projectDir> status --porcelain
```

工作区非空时停止，提示先 `git commit`/`git stash`。建议在干净分支或 worktree 上迁移，便于回滚。

## 执行步骤

### 步骤 1：扫描项目，生成迁移上下文

```bash
node scripts/scan-project.mjs <projectDir>
```

产出 `<projectDir>/.agents/runs/modernjs-migrate/context.json`：判定 v2/v3、Node 版本、入口类型、命中的 `features` 与 `v2Signals`。脚本失败（非 v2/v3、Node 过低）时直接停止并展示原因。`migrationState=v3` 按续迁移处理。

> **monorepo / workspace 项目**：`@modern-js/app-tools` 用 `workspace:*` / `link:` / `catalog:` 等协议时无法从版本号判定大版本。此时只有命中**v2-only 结构信号**（顶层 `runtime`、`appTools({ bundler })`、`applyBaseConfig`、`@modern-js/plugin-tailwindcss`、`@modern-js/runtime/bff|server` import、`App.config/init`、`src/pages`、自定义 `server/index`）才判为 v2；**无任何信号则视为 ambiguous 并阻断**（非 0 退出、不写 context），避免把已是 v3 的 workspace 应用误迁。`routes` / `src/modern.runtime.ts` / `appTools()` 不算 v2 信号（v3 也有）。

> **约定式路由红线**：`entryType=routes` 时，`src/routes/page.*` 和 `src/routes/layout.*` 是 v3 标准结构，必须保留。不要把 `page.tsx` 改名为 `index.tsx`，不要把 `layout.tsx` 挪到 `legacy-*`，不要凭空生成 `src/entry.*` 或 `src/legacy-app` / `src/legacy-routes`。如需处理 `routes/layout` 的 `config/init` 导出，只迁运行时配置逻辑，不改路由文件命名。

### 步骤 2：执行可安全自动化的改写

```bash
node scripts/migrate.mjs <projectDir>
```

自动完成（依据 `guides/upgrade/*`）：

- **前置自保护**：`workspace`/`link`/`catalog` 协议 + 无任何 v2-only 信号 → 直接中止（exit 1，不改任何文件），不依赖 scan
- **目标版本**：未传 `--to` 时会通过 npm 检测 `@modern-js/app-tools@3` 的最新稳定 v3 版本作为目标版本；只有需要锁定版本时才显式传 `--to=<version>`。如果当前环境无法访问 npm registry，脚本会中止并提示显式传入目标版本，**不会回退到 `3.0.0`**。
- **依赖**：固定版本（`^2.x`）的 `@modern-js/*` 升到检测到的最新 v3 目标版本；**`workspace`/`link`/`catalog` 协议依赖保留不改**（随 monorepo 整体升级，进人工清单）；移除 `@modern-js/plugin-tailwindcss`
- **配置入口形态**：`defineConfig({})` / `defineConfig<'rspack'>({})` / `export default {}` / `module.exports = {}`（JS 静态配置）均按主路径处理；函数式/动态 `defineConfig(() => ({}))` 含 runtime 时进人工清单
- **import 路径**：`@modern-js/runtime/bff`→`@modern-js/plugin-bff/client`、`@modern-js/runtime/server`→`@modern-js/server-runtime`，并**补充对应依赖**（`@modern-js/plugin-bff` / `@modern-js/server-runtime`；版本协议：普通 semver 用目标版本；`workspace:` / `catalog:`（名称无关）沿用现有 `app-tools`/`runtime` 的 spec；`link:` / `file:` / `portal:` / `npm:`（指向具体包路径/别名）**不照搬**、进人工清单）；命中 BFF 时给 `modern.config` 顶层 plugins **末尾追加** `bffPlugin()`（保持 `[appTools(), bffPlugin()]` 顺序；必要时在 `@modern-js/app-tools` import 上补 `appTools`；无法补则进人工清单，不写半成品）
- **健壮性（注释/字符串）**：import 的**检测与改写共用同一套真实 specifier 扫描器**（`eachModuleSpecifier`，覆盖 `import`/`export-from`/side-effect import/`import()`/`require()`，含 `import(/* magic */ '...')` 这类带注释的动态 import）；`dev`/`server` 只在**配置对象顶层**迁移（嵌套 `tools.dev.port` 不动）；tailwind 仅删真实 import 行与真实 `tailwindcssPlugin()` 调用（按真实 specifier offset，不伤普通字符串/注释示例，移除后清理悬挂逗号）；注释/普通字符串里的 `defineConfig`/`runtime`/`appTools({ bundler })`/`applyBaseConfig`/`dev: { port }`/`@modern-js/runtime/bff|server` 都不会被误当真实配置、v2 信号或 import；需要字符串「值」的判断（如 `ssr.mode`）才保留字符串
- **配置**：`appTools({ bundler })`→`appTools()`（v3 默认 Rspack，只删 `bundler` 参数）；`modern.config` 顶层 `runtime` 块 → 合并进 `src/modern.runtime.ts`（v3 不再支持在 config 配 runtime；只合并进**空的** `defineRuntimeConfig({})`，非空/函数式进人工清单不覆盖）；`dev.port`→`server.port`（只移顶层 `port`，保留 dev 块其余字段；嵌套如 `dev.client.port` 不动）；移除 tailwind 插件并写 `postcss.config.cjs`
- **v3 配置项改名**（依据 `guides/upgrade/config.mdx`，结构化逐项）：`output.cssModuleLocalIdentName`→`output.cssModules.localIdentName`、`disableCssExtract`→`injectStyles`、`disableFilenameHash`/`disableMinimize`/`disableSourceMap`→`filenameHash`/`minify`/`sourceMap`（布尔取反）、`enableInlineScripts`/`enableInlineStyles`→`inlineScripts`/`inlineStyles`；`source.moduleScopes`/`enableCustomEntry`/`disableEntryDirs` 移除，`resolveMainFields`/`resolveExtensionPrefix`、`output.enableLatestDecorators=true` 进人工；`html.appIcon` 字符串→`{ icons:[{src,size:180}] }`、`disableHtmlFolder`→`outputStructure`、`xxxByEntries` 进人工；`tools.webpack`→`rspack`、`webpackChain`→`bundlerChain`、`devServer` 进人工（拆 `dev.*`）。非布尔/非字面量值不静默改、进人工
- **自定义 Server**：移除 v3 已废的 `@modern-js/plugin-server` 依赖 + `serverPlugin()` 调用 + import；`server/index.*` 有 `unstableMiddleware`/`afterRender` 时 → 生成**可构建**的 `server/modern.server.*` 骨架（空 `defineServerConfig`，原逻辑作为注释保留），Hono Context 语义迁移进人工清单
- **入口**：`src/index.*`→`src/entry.*`（bootstrap **箭头或函数声明**形态都改写为 `createRoot()`/`render()`；无法识别的 bootstrap 形态进人工、不假装成功）；`App.config` 抽取到 `src/modern.runtime.ts`（**已存在则不覆盖**，进人工清单）
- **运行时**：`useRuntimeContext()` → React 19+ 用 `use(RuntimeContext)`、<19 用 `useContext(RuntimeContext)`（保留 react default/namespace import；`useRuntimeContext as 别名` 进人工清单不假改写）
- **路由**：`src/pages`→`src/routes`（无 routes 时），并按 v3 约定把 `pages/index.*` 映射为 `routes/page.*`、`pages/foo/index.*` 映射为 `routes/foo/page.*`，同步改写相对 import 引用，残留进人工清单；迁移产物中禁止出现 `routes/**/index.*` 作为页面文件；**缺根 `routes/layout.*` 时自动生成最小 `Outlet` 布局**（v3 约定式路由需根布局）
- **脚本**：删除 `package.json` 中调用 `modern new` / `modern upgrade` 的 scripts（v3 已移除这两个命令）

> **`applyBaseConfig(...)` 包装的配置**（仓库 integration 测试 helper / 非标准用户配置）：`runtime` / `plugins` / `dev.port` / `appTools bundler` 等**结构性迁移一律进人工清单**（报告标注「结构迁移未完成」），只做依赖升级 / import 路径 / tailwind 移除等文件级安全改写，不在包装内半自动改坏配置。`package.json` 的 `modernConfig.runtime` 同样进人工清单。

完成后查看 `.agents/runs/modernjs-migrate/report.json` 的 `changed` / `manual`。本步骤成功后执行 `references/commit-changes.md`。

### 步骤 3：按人工清单逐项处理（按需读 references）

依据 report 的 `manual` 列表，命中哪项读哪份：

| 人工项 | 参考 |
| --- | --- |
| `App.init` / `routes/layout` 的 `config`/`init` 导出、`modernConfig.runtime`、非空/函数式 `runtime` | `references/migrate-entry.md` |
| 自定义 Web Server（`unstableMiddleware` / `afterRender`） | `references/migrate-custom-server.md` |
| `html.appIcon` 字符串、`server.ssr.mode`、webpack 自定义配置、`applyBaseConfig(...)` 结构性迁移 | `references/migrate-config.md` |
| `useRuntimeContext as 别名` 调用 | `references/migrate-entry.md` |

每处理完一项执行 `references/commit-changes.md`。

### 步骤 4：安装依赖

```bash
bash scripts/install-deps.sh <projectDir>
```

锁文件变更后执行 `references/commit-changes.md`（带 `--include-lockfiles`）。

### 步骤 5：Lint 自动修复

```bash
bash scripts/run-lint.sh <projectDir>
```

失败记录后继续，不视为迁移失败。

### 步骤 6：构建验证 + 最终报告

跑 `modern build`（必要时关键路由 smoke）。最终报告：成功步骤、跳过项、失败项、人工处理项、后续建议。

## 安全红线

- 改写优先结构化；纯文本替换仅用于无歧义项（import 路径）。
- **不手改** `pnpm-lock.yaml` / `dist` / `CHANGELOG` / `node_modules` / secret。
- 复杂、不确定项一律进人工清单，不盲目改。
