---
sidebar_position: 5
---

# Plugin API

插件的 setup 函数会接收一个 api 入参，你可以调用 api 上提供的一些方法来获取到配置、应用上下文等信息。

```ts
import type { CliPlugin } from '@modern-js/core';

export default (): CliPlugin => ({
  name: 'my-plugin',

  setup(api) {
    // 获取应用原始配置
    const config = api.useConfigContext();
    // 获取应用运行上下文
    const appContext = api.useAppContext();
    // 获取解析之后的最终配置
    const resolvedConfig = api.useResolvedConfigContext();
  },
});
```

## API

### useConfigContext

用于获取应用原始配置。

```ts
const useConfigContext: () => UserConfig

interface UserConfig {
  source?: SourceConfig;
  output?: OutputConfig;
  server?: ServerConfig;
  dev?: DevConfig;
  deploy?: DeployConfig;
  tools?: ToolsConfig;
  plugins?: PluginConfig;
  runtime?: RuntimeConfig;
  runtimeByEntries?: RuntimeByEntriesConfig;
}
```

具体配置字段的意义请参考【[配置](/docs/apis/config/source/alias)】。

### useAppContext

用于获取应用运行上下文。

```ts
const useAppContext: () => IAppContext

interface IAppContext {
  appDirectory: string;
  configFile: string | false;
  ip?: string;
  port?: number;
  distDirectory: string;
  packageName: string;
  srcDirectory: string;
  sharedDirectory: string;
  nodeModulesDirectory: string;
  internalDirectory: string;
  plugins: {
    cli?: any;
    server?: any;
  }[];
  entrypoints: Entrypoint[];
  serverRoutes: ServerRoute[];
  htmlTemplates: HtmlTemplates;
}
```

### useResolvedConfigContext

用于获取解析之后的最终配置。

```ts
const useResolvedConfigContext: () => NormalizedConfig

interface NormalizedConfig {
  source: NormalizedSourceConfig;
  output: OutputConfig;
  server: ServerConfig;
  dev: DevConfig;
  deploy: DeployConfig;
  tools: NormalizedToolsConfig;
  plugins: PluginConfig;
  runtime: RuntimeConfig;
  runtimeByEntries?: RuntimeByEntriesConfig;
  _raw: UserConfig
}
```

具体配置字段的意义请参考【[配置](/docs/apis/config/source/alias)】。

### useHookRunners

用于获取 Hooks 的执行器，并触发特定的 Hook 执行。

```ts
import type { CliPlugin } from '@modern-js/core';

export default (): CliPlugin => ({
  name: 'my-plugin',

  async setup(api) {
    const hookRunners = api.useHookRunners();
    // 触发 afterBuild Hook
    await hookRunners.afterBuild();
  },
});
```
