---
sidebar_position: 5
---

# Context API

插件中基于【[上下文共享机制](/docs/apis/runtime/plugin/context)】提供了用于获取配置和应用执行上下文的 API。

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

## 使用示例

```ts
import { createPlugin, useAppContext, useResolvedConfigContext } from '@modern-js/core'

export default createPlugin(() => {
  return {
    prepare() {
      const sourceConfig = useConfigContext()
      const finalConfig = useResolvedConfigContext()
      const context = useAppContext()

      /** do something */
    },
  }
})
```

:::tip 提示
【[如何编写插件](/docs/guides/features/custom/framework-plugin/implement)】
:::

:::note 注
需要注意的是，上面提到的函数只能在 Hook 函数中使用，即只能在下面示例中的 **C 位置**使用。

```ts
/** A */
export default createPlugin(() => {
  /** B */
  return {
    prepare() {
      /** C */
    },
  }
})
```

:::
