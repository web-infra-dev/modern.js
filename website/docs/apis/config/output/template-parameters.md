---
sidebar_label: templateParameters
---

# output.templateParameters

:::info 适用的工程方案
MWA
:::

定义 HTML 模板中的参数，对应 [html-webpack-plugin](https://github.com/jantimon/html-webpack-plugin) 的 `templateParameters` 配置项。

- 类型： `Record<string, Record<string, unknown>>`
- 默认值：

```ts
{
  entryName: string; // 入口名称
  title: string; // 对应 output.title 配置
  meta: string; // 对应 output.meta 配置
  mountId: string; // 对应 output.mountId 配置
  assetPrefix: string; // 对应 output.assetPrefix 配置
  webpackConfig: Configuration; // webpack 配置
}
```

## 示例

比如需要在 HTML 模板中使用 `foo` 参数，可以添加如下设置：

```js title="modern.config.js"
import { defineConfig } from '@modern-js/app-tools';

export default defineConfig({
  output: {
    templateParameters: {
      foo: 'bar',
    },
  },
});
```

在 `config/html/head.html` 模板中，通过 `<%= foo %>` 来读取参数：

```js
<script>window.foo = '<%= foo %>'</script>
```

经过编译后的最终 HTML 代码如下：

```js
<script>window.foo = 'bar'</script>
```
