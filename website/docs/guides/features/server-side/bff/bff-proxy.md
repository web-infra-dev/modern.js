---
sidebar_position: 6
title: 使用 BFF 代理
---

通过配置 BFF 代理，无需手动写码，即可对 API 请求进行转发。

在 `modern.server-runtime.config.js` 文件中编写以下 BFF 代理配置，会将发送到 `localhost:8080/api/v1/topics` 的请求代理到 `https://cnodejs.org/api/v1/topics`。

```js title="modern.server-runtime.config.js"
import { defineConfig } from '@modern-js/app-tools/server';
export default defineConfig({
  bff: {
    proxy: {
      '/api/v1/topics': 'https://cnodejs.org',
    },
  },
};
```

具体 API 请查看 [BFF 代理](/docs/apis/config/bff/proxy)，更多 Modern.js 代理的能力可查看[调试代理](/docs/guides/usages/debug/proxy-and-mock)。
