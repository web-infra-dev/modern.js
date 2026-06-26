# v3-workspace-app-string-literal（负向 fixture）

和 `v3-workspace-app` 一样是**已经是 v3** 的 workspace 应用（react19 + `defineConfig({ plugins: [appTools()] })`
+ workspace:*），但 `modern.config.ts` 里**有一段普通字符串**写着 legacy 示例：
`defineConfig({ runtime: { router: true }, plugins: [appTools({ bundler: 'rspack' })] })`。

预期：字符串里的 `runtime:` / `appTools({ bundler })` **不应**被当成 v2-only 信号
（结构/标识符信号用 maskCommentsAndStrings，字符串内容被剥离），因此仍判 ambiguous → 阻断：
- `scan-project.mjs` 非 0、不写 context
- `migrate.mjs` 非 0、不改任何文件、不产生 report

防止普通字符串文本绕过 workspace ambiguous 保护。
