# Agent Runtime MF Demos

这里放第一批真实问题复现 demo。每个 case 都是完整的 Modern.js + Module Federation 项目，并且都包含：

- `provider`：生产者，通过 Module Federation 暴露远程组件。
- `consumer`：消费者，加载生产者组件，并在页面上直接展示复现状态。

## Demo 列表

| Case | Provider 端口 | Consumer 端口 | 目的 |
| --- | ---: | ---: | --- |
| [`react-multi-version`](./cases/react-multi-version) | 4311 | 4312 | React shared 状态和依赖来源检测 |
| [`nested-router-tree`](./cases/nested-router-tree) | 4321 | 4322 | Router tree 和远程组件关系检测 |
| [`async-chunk-runtime`](./cases/async-chunk-runtime) | 4331 | 4332 | async chunk 的 publicPath / uniqueName 冲突检测 |
| [`garfish-provider`](./cases/garfish-provider) | 4341 | 4342 | provider 导出和挂载状态检测 |
| [`redirect-loader`](./cases/redirect-loader) | 4351 | 4352 | redirect / loader pending 状态检测 |
| [`usenavigate-blank`](./cases/usenavigate-blank) | 4361 | 4362 | 路由动作和跳转空白检测 |

## 运行方式

每个 case 都先启动 provider，再启动 consumer：

```bash
pnpm --dir tests/integration/agent-runtime-mf/cases/<case>/provider dev
pnpm --dir tests/integration/agent-runtime-mf/cases/<case>/consumer dev
```

`async-chunk-runtime` 是例外。这个 case 需要先构建 provider，再用静态服务启动 provider：

```bash
pnpm --dir tests/integration/agent-runtime-mf/cases/async-chunk-runtime/provider build
pnpm --dir tests/integration/agent-runtime-mf/cases/async-chunk-runtime/provider serve
pnpm --dir tests/integration/agent-runtime-mf/cases/async-chunk-runtime/consumer dev
```

不要用 `provider dev` 复现这个 case。开发构建或单份普通产物容易把 remote 和 Garfish 子应用需要的异步模块合到同一份产物里，这样加载顺序就不会触发问题。

打开 consumer 页面后，页面左侧会显示 `Reproduced Issue`。有些 case 打开后就是问题态，有些 case 会先进入正常页面，再通过页面动作复现问题。

## 测试信息

### react-multi-version

来源 case：

- `03-zustand-react-version-check`
- `13-react-multi-version-invalid-hook`

要证明的问题：

- shared 看起来配置了 React，但实际运行仍然有两份 React。
- 某个依赖包把 React 打进产物，导致 Invalid hook call。

启动后预期现象：

- provider remote 组件会真实渲染 `@otrade/transaction_adapter` 里的 `LegacyZustandWidget`。
- 这个依赖包由 rslib 构建，构建时会把 React 打进产物，并在被 host React 渲染时抛出 `Cannot read properties of null (reading 'useSyncExternalStore')`。
- consumer 的错误边界会捕获这个远端组件错误，随后 `Reproduced Issue` 显示 `Status: error`。
- 状态里能看到错误来自 `@otrade/transaction_adapter` 这类依赖来源，而不是 remote entry 没加载。

复现检查点：

1. 打开 consumer 页面。
2. `Remote Provider` 区域开始加载 provider remote。
3. 页面捕获远端组件错误，并在 `Reproduced Issue` 显示 `Status: error`。
4. 错误信息来自远端组件渲染，而不是 remote entry 加载失败。

### nested-router-tree

来源 case：

- `04-volcengine-nested-router-hmr`

要证明的问题：

- 页面出错不是 remote 没加载，而是 React tree / Router 结构异常。

启动后预期现象：

- consumer 会用真实 `react-router` 创建 Host Router。
- provider 暴露出来的组件会继续用真实 `react-router` 创建自己的 Router root，React Router 会自然抛出：`You cannot render a <Router> inside another <Router>`。
- consumer 的错误边界会捕获这个远端路由错误，随后 `Reproduced Issue` 显示 `Status: error`。

复现检查点：

1. 打开 consumer 页面。
2. host 自己先创建 Router。
3. provider remote 再创建自己的 Router root。
4. 页面捕获重复 Router 错误，并在 `Reproduced Issue` 显示 `Status: error`。

### async-chunk-runtime

来源 case：

- `08-rivendell-async-chunk-404`

要证明的问题：

- provider 同时是 MF provider 和 Garfish 子应用。
- 工作台可以通过 `Load Provider Remote` 手动加载 provider 暴露的 remote 组件。
- 也可以通过 `Load Garfish Sub App` 手动调用真实 `garfish` 依赖里的 `Garfish.registerApp` / `Garfish.loadApp`，加载 provider 作为 Garfish 子应用的入口。
- 两套 Rivendell 产物使用相同 `uniqueName` / `chunkLoadingGlobal`，并且使用生产同类的 chunkId / moduleId 生成方式。
- remote 暴露组件和 Garfish 子应用都会异步引用同一个依赖模块，因此构建后会产生相同 async chunk id，但两份产物里的模块内容不同。
- 如果先加载 provider remote，再加载 Garfish 子应用，Garfish 子应用会复用前面已经加载过的同 id chunk，最后拿不到自己需要的模块。

启动后预期现象：

- provider 先执行 `pnpm --dir tests/integration/agent-runtime-mf/cases/async-chunk-runtime/provider build`，这条命令会生成 `dist/remote` 和 `dist/garfish` 两份产物。
- 再执行 `pnpm --dir tests/integration/agent-runtime-mf/cases/async-chunk-runtime/provider serve` 启动 provider 静态服务。
- consumer 执行 `pnpm --dir tests/integration/agent-runtime-mf/cases/async-chunk-runtime/consumer dev`。
- provider remote 地址是：`http://localhost:4331/remote/mf-manifest.json`。
- provider Garfish 子应用入口是：`http://localhost:4331/garfish/html/index/index.html`。
- 初始打开时是正常页面，地址会进入 `/workspace/home`，`Reproduced Issue` 显示 `Status: success`。
- 初始不会自动加载 provider remote，`Remote Provider` 区域会先显示未加载占位。
- 用一个新页面先点击 `Load Garfish Sub App`，会正常看到 `garfish:ready`，页面保持 `Status: success`。
- 再开一个新页面，先点击 `Load Provider Remote`，看到 `remote:ready` 后，再点击 `Load Garfish Sub App`。
- 这个顺序会进入 chunk 冲突错误态。
- 复现成功时，`Reproduced Issue` 会显示 `Status: error`，pending reason 是 `Cannot read properties of undefined (reading 'call')`。
- 错误出现时，`build.uniqueName` 和 `hostUniqueName` 相同，`chunkLoadingGlobal` 也指向同一套运行时。
- `build.chunkIds` 和 `build.moduleIds` 都是 `deterministic`，用于贴近生产环境的 id 生成方式。
- `splitChunks` 使用生产同类的 async vendors/default 拆包配置，但它只负责拆公共依赖；复现关键仍然是 `remote` 和 `garfish` 两份产物里存在同 id、不同内容的异步 chunk。

复现检查点：

1. 打开 consumer 页面，确认初始 route 是 `/workspace/home`，页面状态是 success。
2. 新开一个页面，先点击 `Load Garfish Sub App`，确认子应用能正常显示 `garfish:ready`。
3. 再新开一个页面，先点击 `Load Provider Remote`，确认 provider remote 显示 `remote:ready`。
4. 再点击 `Load Garfish Sub App`，确认页面进入 `Status: error`。
5. 错误信息应为 `Cannot read properties of undefined (reading 'call')`。

### garfish-provider

来源 case：

- `10-garfish-provider-white-screen`

要证明的问题：

- 子应用入口文件可能加载了，但 provider 没有正确导出或 Garfish 没有识别到。

启动后预期现象：

- 初始打开时 host 页面正常，remote 组件也能加载。
- provider 通过 Modern.js 多入口提供 Garfish 子应用入口：`http://localhost:4341/creative-hub`。
- 点击 `Load Creative Hub` 后，consumer 通过真实 `garfish` 依赖调用 `Garfish.registerApp` / `Garfish.loadApp`。
- 子应用入口已加载，但没有显式注册到 `__GARFISH_EXPORTS__`，Garfish 报 `provider` is `undefined`。
- 错误出现后 `Reproduced Issue` 显示 `Status: blank`，`providerExportFound` 和 `mounted` 都是 `false`。

复现检查点：

1. 打开 consumer 页面。
2. 点击 `Load Creative Hub`。
3. 页面进入 `Status: blank`。
4. 错误信息应指向 Garfish 读取不到 provider。

### redirect-loader

来源 case：

- `12-cloud-engine-redirect-stuck`

要证明的问题：

- 页面一直显示 redirect/loading，但 Agent 不知道是 loader 没执行、redirect 没发生，还是客户端兜底没跑。

启动后预期现象：

- consumer 是 SSR 应用，根路由有真实的 `src/routes/page.loader.ts`，正常应跳到 `/home`。
- 正常访问 `http://localhost:4352/` 会执行 SSR loader，并跳到 `/home`。
- 访问 `http://localhost:4352/?csr=1` 会强制返回静态壳页，用来复现首屏没有执行 SSR loader 的状态。
- consumer 页面真实显示 `Redirecting to home...`。
- `Reproduced Issue` 显示 `Status: pending`。
- pending reason 表示静态壳页返回后 SSR redirect loader 没有执行。
- `loaders[0]` 是 not_run，redirect 为空。

复现步骤：

1. 启动 provider：`pnpm --dir tests/integration/agent-runtime-mf/cases/redirect-loader/provider dev`
2. 启动 consumer：`pnpm --dir tests/integration/agent-runtime-mf/cases/redirect-loader/consumer dev`
3. 打开 `http://localhost:4352/?csr=1`，页面应停在 `Redirecting to home...`。
4. 对照打开 `http://localhost:4352/`，页面应正常跳到 `/home`。

`csr=1` 不是线上真实原因，只是 demo 里的复现开关。它会让 consumer 返回静态壳页，从而绕过本该在首屏执行的 SSR loader；真实 case 对应的是线上首包退化为静态壳页，结果同样是根路径 loader 没执行，redirect 没发生。

复现检查点：

1. 打开 consumer 的 `/?csr=1`。
2. 页面停在 `Redirecting to home...`。
3. `Reproduced Issue` 显示 `Status: pending`。
4. 点击 `Run client fallback` 后，页面切到 `/home`。

### usenavigate-blank

来源 case：

- `14-usenavigate-jump-blank`

要证明的问题：

- 子应用内部跳转后页面空白，需要知道是路由不匹配、basename 不对、组件没挂载，还是跳转方式错。

启动后预期现象：

- 初始打开时 `Status: success`，features 页面正常。
- 点击页面里的 `Navigate to lineage` 动作后，provider 内部路由会跳到 `/lineage`。
- 因为 Bridge basename 少了前导 `/`，`Reproduced Issue` 变成 `Status: blank`。
- pending reason 表示 `useNavigate` 后 basename 不匹配。

复现检查点：

1. 打开 consumer 页面。
2. 点击 `Navigate to lineage`，确认页面变成 `Status: blank`。
3. 点击 `Navigate back to features`，确认仍然是空白态。
4. 点击 `Enter default page`，确认回到正常 features 页面。

## 结构校验

```bash
node tests/integration/agent-runtime-mf/verify.mjs
```
