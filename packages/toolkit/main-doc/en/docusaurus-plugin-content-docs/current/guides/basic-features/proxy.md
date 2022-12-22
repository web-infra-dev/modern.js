---
title: Proxy
sidebar_position: 5
---

## Local Proxy

Modern.js provides a way to configure the development proxy in ['tools.devServer'] (/docs/configure/app/tools/dev-server). For example, to proxy the local interface to an online address:

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

when access `http://localhost:8080/go/api`, the response content is returned from [http://www.example.com/](http://www.example.com/).

:::info
For more detail, see [http-proxy-middleware](https://github.com/chimurai/http-proxy-middleware)。
:::

## Global Proxy

import GlobalProxy from '@site-docs-en/components/global-proxy.md'

<GlobalProxy />

## BFF Proxy

By configuring [`bff.proxy`](/docs/configure/app/bff/proxy), you can proxy BFF API requests to specified services. Unlike other proxy above, it can also be used in the production environment:

```typescript title="modern.config.ts"
export default defineConfig({
  bff: {
    proxy: {
      '/api/v1': 'https://cnodejs.org',
    },
  },
});
```

For example, when a BFF call is used in the code, the final request `http://localhost:8080/api/v1/topics` will auto proxy to `https://cnodejs.org/api/v1/topics`：

```js
import getTopics from '@api/v1/topics'

getTopics();
```

