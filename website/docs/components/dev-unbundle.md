Unbundled 开发模式下，不会对 JS 文件做打包构建，而是直接使用原生的 ESM 模块，因此具备更快的启动速度和热更新体验。推荐在开发阶段使用此模式。

在项目根目录下，执行 `pnpm run new`，进行如下选择，开启 Unbundled 开发模式：

```bash
? 请选择你想要的操作： 启用可选功能
? 启用可选功能： 启用「Unbundled 开发」模式
```

执行 `pnpm run dev:esm` 启动应用。重新访问 `http://localhost:8080`，查看浏览器开发者工具的 Network 窗口，可以发现加载的 JS 资源都是未经过打包的单独的 JS 文件。详细介绍请参考【[Unbundled 开发模式](/docs/guides/usages/debug/unbundled)】。
