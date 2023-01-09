---
title: 代理
sidebar_position: 5
---

## 本地代理

Modern.js 在 [`tools.devServer`](/docs/configure/app/tools/dev-server) 中提供了配置开发环境代理的方式。例如，将本地开发接口，代理到线上某个地址：

```ts title="modern.config.ts"
import { defineConfig } from '@modern-js/app-tools';

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
配置格式可参考：[http-proxy-middleware](https://github.com/chimurai/http-proxy-middleware)。
:::

## 全局代理

import GlobalProxy from '@site-docs/components/global-proxy.md'

<GlobalProxy />

## BFF 代理

通过配置 [`bff.proxy`](/docs/configure/app/bff/proxy) 可以代理 BFF API 请求到指定的服务上，上述两种代理不同，它同样可以用在生产环境：

```ts title="modern.config.ts"
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
import getTopics from '@api/v1/topics';

getTopics();
```
