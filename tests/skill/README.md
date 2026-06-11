# tests/skill

验证 Modern.js Skills 的端到端测试。

## modernjs-migrate-to-v3

`fixtures/v2-app/` 是一个 Modern.js **v2** 示例应用（覆盖关键 v2→v3 差异：v2 依赖 + plugin-tailwindcss、`modern.config` 的 `dev.port`/`server.ssr.mode`/`html.appIcon`、`App.config`/`App.init`/`useRuntimeContext`、`@modern-js/runtime/bff|server` import、自定义 server）。

`run.mjs` 把 fixture 复制到临时目录，跑 skill 的 `scan-project.mjs` + `migrate.mjs`，断言迁移结果符合 `guides/upgrade/*`：

```bash
node tests/skill/run.mjs
```

退出码非 0 表示有断言失败。
