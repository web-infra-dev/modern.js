# @modern-js/mcp-apps

## 3.11.3

### Patch Changes

- 4d498bb: Upgrade @rsbuild/core to 2.3.2, which includes Rspack 2.3.2.

  将 @rsbuild/core 升级至 2.3.2，其中包含 Rspack 2.3.2。

## 3.11.2

### Patch Changes

- 2d8d502: feat(mcp-apps): reference deployed MF remotes in mcp-views.json with a top-level or per-view `remote` manifest URL, so republishing the card project needs no MCP server rebuild

## 3.11.1

### Patch Changes

- fc6ee73: Upgrade @rsbuild/core to 2.3.1.

  将 @rsbuild/core 升级至 2.3.1。

- f74d24d: fix(mcp-apps): align the server-runtime peer dependency with the current workspace version.

  fix(mcp-apps): 将 server-runtime peer 依赖对齐到当前工作区版本。

- 7e376d0: fix(mcp-apps): remove the default loading placeholder in createMcpView
- 1391159: fix(mcp-apps): synchronize the server-runtime peer dependency with the workspace version after the 3.10.4 release.

  fix(mcp-apps)：将 server-runtime 的 peer 依赖同步到 3.10.4 发布后的工作区版本。

## 3.11.0

### Minor Changes

- 712e1b6: Add MCP Apps support in a single `@modern-js/mcp-apps` package with build plugin, server plugin, BFF and Fetch adapters, React and Module Federation views, manifest-based UI resource registration, and an `mcp-apps` project template.

  新增 MCP Apps 支持，由单一的 `@modern-js/mcp-apps` 包提供构建插件、服务端插件、BFF 和 Fetch 适配器、React 和 Module Federation 视图、基于清单的 UI 资源注册，以及 `mcp-apps` 项目模板。
