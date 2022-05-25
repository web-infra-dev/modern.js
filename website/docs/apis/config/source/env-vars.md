---
sidebar_label: envVars
sidebar_position: 2
---

# source.envVars

:::info 适用的工程方案
MWA，模块。
:::

- 类型： `string[]`
- 默认值：
  - MWA 工程方案中: `['NODE_ENV', 'BUILD_MODE']`
  - 模块工程方案中: `[]`

支持在非 Node 代码中使用 `process.env.*` 下的环境变量。

在数组中指定环境变量的名称，在代码编译后，会从 `process.env.*` 中取得对应的环境变量值，并注入到业务代码中。

## 示例

比如希望在代码中使用 `process.env.VERSION` 的值，可以添加如下配置：

```js title="modern.config.js"
export default defineConfig({
  source: {
    envVars: ['VERSION'],
  },
});
```

在业务代码中使用:

```js
console.log(process.env.VERSION);
```

:::tip 提示
环境变量的值需要提前设置好，设置方式参考：[环境变量](/docs/apis/runtime/env)。
:::

## 内置环境变量

### NODE_ENV

`process.env.NODE_ENV` 会根据当前运行的命令设置对应的值：

- 默认值为 `development`
- 执行 `build` 命令时，值为 `production`
- 执行 `test` 命令时，值为 `test`
