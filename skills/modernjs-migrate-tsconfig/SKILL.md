---
name: modernjs-migrate-tsconfig
description: 把 Modern.js 3 应用的 tsconfig 迁到 bundler 基线：把 baseUrl 等价改写成 paths、补 BFF 的 @api/* 别名、为 CommonJS 项目生成 tsconfig.server.json。在「升级 TypeScript 6/7 后 tsconfig 报 TS5101/TS5102（baseUrl 废弃/移除）、升级到 bundler 模式的 @modern-js/tsconfig 基线、BFF 服务端编译提示缺少 tsconfig.server.json」时使用。
---

# Migrate Modern.js tsconfig

本 skill 只改 `projectDir` 下的 `tsconfig.json`，必要时新增 `tsconfig.server.json`，不动源码。规则以文档 `guides/basic-features/typescript`「迁移存量项目」为准。

## 前置检查

```bash
git -C <projectDir> status --porcelain
```

工作区非空时停止，提示先 `git commit`/`git stash`，便于回看与回滚改动。

## 执行

```bash
node scripts/migrate-tsconfig.mjs <projectDir>
```

结果写入 `<projectDir>/.agents/runs/modernjs-migrate-tsconfig/report.json`（`changed` / `manual`）。重复执行不会产生新改写。

| 项目现状                                                                                                                               | 自动改写                                                                                                                                                                   |
| -------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `compilerOptions.baseUrl` 存在                                                                                                         | `paths` 每个目标加上原 `baseUrl` 前缀（改为相对 tsconfig 目录）；源码里有靠 `baseUrl` 解析的裸导入（如 `import 'src/foo'`）时补 `"*": ["<baseUrl>/*"]`；最后删除 `baseUrl` |
| 有 `api/lambda`，`paths` 缺 `@api/*`                                                                                                   | 补 `"@api/*": ["./api/lambda/*"]`                                                                                                                                          |
| `package.json#type` 不是 `module`，有 `api/` 或 `server/`，没有 `tsconfig.server.json`，`modern.config.*` 也没配 `server.tsconfigPath` | 写入标准 `tsconfig.server.json`（`extends ./tsconfig.json` + `module/moduleResolution: NodeNext` + `noEmit: false` + `declaration: false`）                                |

## 人工清单

| 人工项                              | 处理                                               |
| ----------------------------------- | -------------------------------------------------- |
| `tsconfig.json` 含注释或尾逗号      | 脚本不改写该文件，按 `manual` 中列出的每项手动修改 |
| `baseUrl` 写在 `extends` 的父配置里 | 在父配置中按上表同样规则改写                       |

## 验证

```bash
npx tsc -p <projectDir>/tsconfig.json --noEmit
```

再执行一次 `build`，确认 BFF / 自定义 Server 产物正常。
