---
sidebar_label: devServer
sidebar_position: 12
---

# `tools.devServer`

:::info 适用的工程方案
* MWA
:::

* 类型： `Object`
* 默认值： `{}`

对应 [DevServer](https://webpack.docschina.org/configuration/dev-server/#devserverlivereload) 的配置，用于配置开发环境运行的服务器的选项：

```js title="modern.config.js"
export default defineConfig({
  tools: {
    devServer: {
      hot: true,
      https: false,
      liveReload: false
    }
  }
});
```

:::tip 提示
为了方便接入，Modern.js 大部分配置与 Webpack DevServer 保持一致，部分配置仍有差异。
:::

## 配置差异

### before

:::info 实验性的
这是一个实验性功能。
:::

* 类型： `Array`
* 默认值： `null`

在所有开发环境中间件前执行：

```javascript
devServer: {
  before: [
    async (req, res, next) => {
      console.log('before dev middleware');
      next();
    },
  ],
},
```

### after

:::info 实验性的
这是一个实验性功能。
:::

* 类型： `Array`
* 默认值： `null`

在所有开发环境中间件后执行：

```javascript
devServer: {
  after: [
    async (req, res, next) => {
      console.log('after dev middleware');
      next();
    },
  ],
},
```
