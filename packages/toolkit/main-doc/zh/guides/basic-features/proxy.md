---
title: 代理
sidebar_position: 5
---

## 本地代理

Modern.js 在 [`tools.devServer`](/docs/configure/app/tools/dev-server) 中提供了配置开发环境代理的方式。例如，将本地开发接口，代理到线上某个地址：

```typescript title="modern.config.ts"
import { defineConfig }  from '@modern-js/app-tools';

export default defineConfig({
  tools: {
    devServer: {
      proxy: {
        '/go/api': {
          target: 'http://www.example.com/',
          changeOrigin: true,
        },
      },
    },
  },
});
```

请求 `http://localhost:8080/go/api` 时，会从 [http://www.example.com/](http://www.example.com/) 返回响应内容。

:::info 补充信息
配置格式可参考:【[http-proxy-middleware](https://github.com/chimurai/http-proxy-middleware)】。
:::

## 全局代理

Modern.js 提供了开箱即用的全局代理插件 `@modern-js/plugin-proxy`，该插件底层基于 [whistle](https://github.com/avwo/whistle)，可用来查看、修改 HTTP/HTTPS 的请求和响应，也可作为 HTTP 代理服务器使用。

### 设置代理规则

引入代理插件并填写规则后，执行 `pnpm run dev`，Modern.js 会在开发服务器启动之后，自动启用代理服务器。

具体代理规则，可通过 [`dev.proxy`](/docs/configure/app/dev/proxy) 选项或 `config/proxy.js` 文件进行设置。

### 代理服务器 UI 界面

安装代理插件并配置代理规则后， 执行 `pnpm run dev` 命令：

```bash
  App running at:

  Local:    http://localhost:8080/
  Network:  http://192.168.0.1:8080/

ℹ  info      Starting the proxy server.....
✔  success   Proxy Server start on localhost:8899
```

在控制台中可以看到代理服务器成功启动。

访问 `http://localhost:8899`，显示下图所示的 UI 界面后，即可通过界面设置规则。

![debug-proxy-ui](https://lf3-static.bytednsdoc.com/obj/eden-cn/aphqeh7uhohpquloj/modern-js/debug/debug-proxy-ui.png)


## BFF 代理

通过配置 [`bff.proxy`](/docs/configure/app/bff/proxy) 可以代理 BFF API 请求到指定的服务上，和[开发环境代理](/docs/configure/app/dev/proxy)不同的是，它同样可以用在生产环境：

```typescript title="modern.config.ts"
export default defineConfig({
  bff: {
    proxy: {
      '/api/v1': 'https://cnodejs.org',
    },
  },
});
```

例如代码中使用一体化 BFF 调用时，最终请求 `http://localhost:8080/api/v1/topics` 会自动代理到 `https://cnodejs.org/api/v1/topics`：

```js
import getTopics from '@api/v1/topics'

getTopics();
```

