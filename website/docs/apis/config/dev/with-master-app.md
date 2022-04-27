---
sidebar_label: withMasterApp
sidebar_position: 2
---

# dev.withMasterApp

:::info 适用的工程方案
* MWA
:::

* 类型： `Object`
* 默认值： `null`

当项目为微前端子应用的时候，可以使用 `withMasterApp` 配置启用子应用调试模式。

:::caution 注意
使用子应用调试的模式时，应该先确保主应用开启了线上 debug 模式。
:::

```js title=modern.config.js
export default defineConfig({
  dev: {
    withMasterApp: {
      // 主应用的路径
      moduleApp: 'https://www.masterApp.com',
      // 子应用的名称
      moduleName: 'Contact'
    }
  }
})
```

- moduleApp: `string` 主应用的线上地址。
- moduleName: `Contact` 子应用的名称（需要和在主应用中注册的模块名匹配）。

详细使用方式，请参考【[微前端子应用](/docs/guides/usages/debug/micro-frontend)】。
