---
name: modernjs-feature-enable
description: 在已有的 Modern.js 3.0 应用里启用可选功能：自动启用 BFF、SSG、styled-components，并脚手架化 Tailwind CSS、自定义 Web Server。v3 已移除 `modern new`，本 skill 是其手动等价物：装插件 + 改 modern.config + 必要的 tsconfig/scaffold/report。在「想给现有 Modern.js 项目加 BFF/SSG/Tailwind/自定义 Web Server 等能力」时使用。
---

# Enable Modern.js Features

为**已有的 Modern.js v3 应用**启用可选功能。

> ⚠️ **`modern new` 在 Modern.js 3.0 已移除**（见 `packages/document/docs/zh/guides/upgrade/other.md:107`、`:111`：「移除了 `modern new` 和 `modern upgrade` 命令，需要按照文档手动操作」「`modern new` 命令在 Modern.js 3.0 中不再支持，无法通过命令添加入口或启用功能」）。
> `packages/document/docs/{zh,en}/apis/app/commands.mdx` 里残留的 `## modern new` 是 **stale doc**，不可作为现行依据，**不要让用户去跑 `modern new`**。本 skill 即官方推荐的「按文档手动操作」的自动化等价物。

## 能力矩阵（按自动化级别分层）

> **不是「Modern.js v3 只能启用这几个」**。v3 里很多能力是**内置约定/配置**（Less/Sass 默认支持、Data Loader 是 `.data.ts` 约定、SSR/RSC 是配置/架构选择），不存在「启用插件」这一步，故不在本矩阵；微前端是架构决策。本 skill 覆盖的是「装插件/改配置就能开」的可选能力。

| 功能 | 参数值 | 级别 | 现行依据（当前仓库文档） |
| --- | --- | --- | --- |
| BFF（一体化后端） | `bff` | ✅ 可自动启用 | `guides/advanced-features/bff/function.mdx`、`components/enable-bff.mdx` |
| 静态站点生成 SSG | `ssg` | ✅ 可自动启用 | `components/enable-ssg.mdx`、`configure/app/output/ssg.mdx` |
| styled-components | `styled-components` | ✅ 可自动启用 | `cli/plugin-styled-components`、`plugin/official/cli-plugins/plugin-styled-components.mdx` |
| Tailwind CSS（v3） | `tailwindcss` | 🛠 脚手架（骨架自动 + 语义人工） | `guides/basic-features/css/tailwindcss.mdx`（Rsbuild 原生，非 @modern-js 插件） |
| 自定义 Web Server | `server` | 🛠 脚手架（骨架自动 + 语义人工） | `guides/advanced-features/web-server.mdx`、`@modern-js/server-runtime` |

> ✅ 可自动启用 = 装依赖 + modern.config 插件 + 必要文件，全自动闭环。
> 🛠 脚手架 = 自动生成可构建骨架（server/modern.server.ts 含 middlewares/renderMiddlewares/plugins/onError 字段 + 示例注释；tailwind 的 config/postcss/css）+ 依赖，但业务语义（server 中间件逻辑、tailwind 的 CSS 接入与 v3·v4 选择）需人工补，report 会写清。
> **微前端不在本矩阵的「可启用项」里**（v3 无 plugin-garfish，是 Module Federation / `masterApp` 架构决策）；它仍是 Modern.js 能力，`enable.mjs microFrontend` 会输出独立方案的可执行 checklist，详见 `references/other-features.md`，不会让用户以为「没这功能」。

## 执行步骤

### 步骤 1：扫描项目

```bash
node scripts/scan.mjs <projectDir>
```

产出 `context.json`：判定是否 v3（v2 项目先用 `modernjs-migrate-to-v3` 升级）、列出各功能当前是否已启用、是否支持自动化。

### 步骤 2：启用功能

> **执行纪律（重要）**：仅当用户**明确说「启用 X / enable X」且项目目录明确、scan 判定为 v3** 时，才
> **立即直接运行** `node scripts/enable.mjs X <projectDir>`——不要只描述、不要等二次确认、不要停在「我会执行…」就没动作，一条命令改完源文件。
> **反之**：用户只是问「为什么 / 能启用哪些 / 扫描一下 / 当前状态」时，**只跑 `scan.mjs` 给能力矩阵与报告，绝不改文件**。
>
> **一步到位（依赖自动安装）**：默认带 `--install`，启用完直接可 `modern dev/build`，不用用户再手动装依赖：
> `node scripts/enable.mjs X <projectDir> --install`。
> **但**遇到以下情况**先不要带 `--install`**（只跑 enable，把 install 命令告诉用户）：工作区有**未提交的
> lockfile 改动**、**离线/无法联网**、或包管理器不明确——因为 install 会改 lockfile、耗时、依赖网络。

**BFF（自动化）**（默认带 `--install` 一步到位；异常情况按上方执行纪律去掉 `--install`）：

```bash
node scripts/enable.mjs bff <projectDir> --install
```

自动完成（依据 `components/enable-bff.mdx`）：

- **依赖**：添加 `@modern-js/plugin-bff`，版本与 `@modern-js/app-tools` 保持一致（官方包统一版本号）
- **配置**：`modern.config.*` 顶层 `plugins` 追加 `bffPlugin()`（已有则幂等跳过）
- **tsconfig**：添加 `paths["@api/*"] = ["./api/lambda/*"]` 与 `include` 增加 `api`（非标准 JSON 则进人工清单）
- **端到端示例**（依据 `bff/function.mdx`）：生成/复用 `api/lambda/hello.ts`（`export const get`，已有 api 不覆盖、优先复用已有 GET/default），并**接进真实页面**——默认模板首页可安全替换则改 `src/routes/page.tsx`（`import { get as hello } from '@api/hello'` + `useEffect`），已有业务首页则新建 `src/routes/bff-demo/page.tsx`（report 写清访问路径）；非约定式路由进人工清单给出示例

查看 `.agents/runs/modernjs-feature-enable/report.json` 的 `changed` / `manual`。

**其它能力**：`styled-components`（插件，自动）、`tailwindcss`（Rsbuild 原生脚手架）、`server`（生成 `server/modern.server.ts` 骨架 + `@modern-js/server-runtime` + tsconfig include，业务语义人工）、`microFrontend`（输出可执行 checklist）。

**SSG（自动化）**（同样默认带 `--install`）：

```bash
node scripts/enable.mjs ssg <projectDir> --install
```

自动完成（依据 `components/enable-ssg.mdx`）：添加 `@modern-js/plugin-ssg`（同 app-tools 版本）、`plugins` 追加 `ssgPlugin()`、顶层 `output` 合并 `ssg: true`（已有 output 不覆盖其它字段）。详见 `references/enable-ssg.md`。

> CJS（`module.exports`/`require`）配置会插入 `const { xxxPlugin } = require(...)`；插入失败或无法确定绑定时进人工清单，不写运行时未定义的半成品。

**其它功能（manual）**：读 `references/other-features.md`，按当前文档手动启用。

### 步骤 3：安装依赖 + 验证

读 `references/install-dependencies.md` 选包管理器安装，然后 `modern dev` / `modern build` 验证。

## 安全红线

- 改写优先结构化；解析不了（非标准 JSON、定位不到配置对象）一律进人工清单，不盲改。
- 不覆盖已有 `api/` 等用户文件；已启用的功能幂等跳过。
- 报告区分 `changed`（已自动改写）/ `manual`（需人工）；遇到 `modern new` 这类废弃路径明确标注，不引导用户使用。
