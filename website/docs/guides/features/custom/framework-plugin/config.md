---
sidebar_position: 5
---

# 插件与配置

Modern.js 是配置驱动的，并提供了统一的方式进行配置维护、校验和获取。

### 配置维护

配置主要在 `modern.config.ts` 中进行维护，详见 [配置使用](/docs/apis/config/usage)。

### 校验

可以通过【插件 Hook】中提到的 [validateSchema](/docs/apis/runtime/plugin/hook-api#validateschema) 方法对支持的配置进行扩展，可参考以下的示例代码，创建一个插件并添加校验逻辑：

```ts title=config/plugin/fooPlugin.ts
import { createPlugin } from '@modern-js/core'

export default createPlugin(() => {
  return {
    validateSchema() {
      return {
        target: 'foo',
        schema: {
          type: 'string',
        },
      },
    },
  },
})
```

类型扩展：

```ts title=config/plugin/fooPlugin.ts
declare module '@modern-js/core' {
  export interface UserConfig {
    foo: string;
  }
}
```

这样就添加了一个 `string` 类型的 'foo' 字段。

此时，可在你的 modern.js 项目的 `modern.config.ts` 中配置 'foo' 字段与属性值，以及配置上面写好的 'fooPlugin' 插件([配置插件教程](/docs/guides/features/custom/framework-plugin/implement#开发本地插件))：

```ts title="modern.config.ts"
import { defineConfig } from '@modern-js/app-tools'

export default defineConfig({
  plugins: [
    {
      cli: require.resolve('./config/plugin/fooPlugin.ts'),
    },
  ],
  foo: 'demo message'
});
```

完成以上准备工作，再运行项目，不会产生校验错误，可正常运行。


### 获取

在解析处理之后，通过 【[上下文共享机制](/docs/apis/runtime/plugin/context)】来做到在任何插件中都可以获取配置，Modern.js 中提供了三个 API 用来获取应用上下文和配置：

* `useConfigContext`: 应用原始配置
* `useAppContext`: 应用上下文
* `useResolvedConfigContext`: 配置

在插件中使用：

```ts
import { createPlugin, useAppContext, useResolvedConfigContext } from '@modern-js/core'

export default createPlugin(() => {
  return {
    prepare() {
      const sourceConfig = useConfigContext()
      const context = useAppContext()
      const finalConfig = useResolvedConfigContext()
      /** do something */
    },
  }
})
```
