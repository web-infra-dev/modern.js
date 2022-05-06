---
sidebar_label: proxy
sidebar_position: 1
---

# bff.proxy

:::info 适用的工程方案
* MWA
:::

* 类型：`Record<string, string>`
* 默认值：`{}`

:::info 补充信息
MWA 项目需要请确保使用【[new](/docs/apis/commands/mwa/new)】 启用了 BFF 功能。
:::

通过简单配置，无需编写代码，Modern.js 会自动转发请求。发送给 Modern.js BFF server 的请求，会代理到指定的服务上。
BFF Proxy 使用了强大的 [http-proxy-middleware](https://github.com/chimurai/http-proxy-middleware)，如果需要更多高级的用法；可以查看它的[文档](https://github.com/chimurai/http-proxy-middleware#options)。

在 `modern.server-runtime.config.js` 中加入以下配置；即可开启代理：

```js title="modern.server-runtime.config.js"
import { defineConfig } from '@modern-js/app-tools/server';
export default defineConfig({
  bff: {
    proxy: {
      "/api": "https://cnodejs.org"
    }
  }
})
```
假设启动的 Modern.js BFF server 的服务地址是`localhost:8080`，所有 path 以 `api` 开头的请求都会被拦截，如发送到 `localhost:8080/api/v1/topics` 的请求会被代理到 `https://cnodejs.org/api/v1/topics`。

你可以做路径的重写，如将发送到 `localhost:8080/api/topics` 的请求代理到 `https://cnodejs.org/api/v1/topics`。

```js title="modern.server-runtime.config.js"
import { defineConfig } from '@modern-js/app-tools/server';
export default defineConfig({
  bff: {
    proxy: {
      '/api': {
        target: 'https://cnodejs.org',
        pathRewrite: { '/api/topics': '/api/v1/topics' },
        changeOrigin: true,
      },
    },
  },
});
```

与 [dev.proxy](/docs/apis/config/dev/proxy) 不同，本节所介绍的代理只作用于进入 BFF/API 服务的请求。

同时，这一配置不但可以在开发环境中使用，在生产环境也会生成真实代码并且与项目一同部署。

## 常见用法

### 解决接口跨域问题

在项目开发过程中，因为 web 页面和接口服务不是部署在同一个域名下，常常会遇到跨域问题。
解决跨域问题的方式有很多，在这里我们使用 `bff.proxy` 可以轻松解决跨域问题。

:::info 注
BFF proxy 模式下，如果不需要写 BFF 的接口， API 目录可以删除；此时 BFF proxy仍会开启。
:::

如下所示，在 `modern.server-runtime.config.js` 中，写入如下配置；我们将所有 web 页面发送到同域的以 `/api` 开头的请求代理到另一个域名的服务上。

```js title="modern.server-runtime.config.js"
export default defineServerConfig({
  bff: {
    proxy: {
      '/api': 'https://cnodejs.org',
    },
  },
};
```
