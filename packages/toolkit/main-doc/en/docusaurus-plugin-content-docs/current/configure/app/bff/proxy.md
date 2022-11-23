---
sidebar_label: proxy
---

# bff.proxy

* Type: `Record<string, string>`
* Default: `{}`

:::caution Caution
First you need to enable the "BFF" function using [new](/docs/apis/app/commands/new) command.
:::

With simple configuration, no code is required, Modern.js automatically forwards requests. Requests sent to Modern.js BFF server are proxied to the specified service.

BFF Proxy uses the powerful [http-proxy-middleware](https://github.com/chimurai/http-proxy-middleware), and if you need more advanced usage, you can check its [documentation](https://github.com/chimurai/http-proxy-middleware#options).

Add the following configuration to `modern.server-runtime.config.ts`, you can turn on the proxy:

```typescript title="modern.server-runtime.config.ts"
import { defineConfig } from '@modern-js/app-tools/server';
export default defineConfig({
  bff: {
    proxy: {
      "/api": "https://cnodejs.org"
    }
  }
})
```

Assuming that the starting Modern.js BFF server's service address is `localhost:8080`, all requests whose path starts with `api` will be intercepted, such as requests sent to `localhost:8080/api/v1/topics` will be proxied to `https://cnodejs.org/api/v1/topics`.

You can do path rewriting, such as proxying requests sent to `localhost:8080/api/topics` to `https://cnodejs.org/api/v1/topics`.

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

Unlike [dev.proxy](/docs/configure/app/dev/proxy), the proxy described in this section only works on requests entering the BFF/API service; at the same time, this configuration can be used not only in the development environment, but also in the production environment. The corresponding request will also be proxied in the production environment.

## Common usage

### Solve interface cross-domain problems

In the process of project development, because web pages and interface services are not deployed under the same domain name, cross-domain problems are often encountered.

There are many ways to solve cross-domain problems, and here we use `bff.proxy` to easily solve cross-domain problems.


:::info 注
In BFF proxy mode, if you do not need to write the BFF interface, the API directory can be deleted; at this time, BFF proxy will still be enabled.
:::

As shown below, in the `modern.server-runtime.config.js`, write the following configuration; we send all web pages to the same domain that request proxies starting with `/api` to another domain's service.

```typescript title="modern.server-runtime.config.ts"
export default defineServerConfig({
  bff: {
    proxy: {
      '/api': 'https://cnodejs.org',
    },
  },
};
```
