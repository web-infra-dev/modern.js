---
sidebar_label: routes
---

# server.routes

- Type: `Object`
- Default: Automatic generation of server-level routing rules based on file conventions: One routing rule is generated per file of the application,and the default route is the same as the entry name.

This configuration option only applies to server-level routing, and can customize the service access configuration of the application entry.

## Custom access routing

The `key` of the object is the entry name of the current application, and the value can be `string | Array<string>`.

When the value type is `string`, the current value represents the name of the route to access the entry.

```ts title="modern.config.ts"
export default defineConfig({
  server: {
    routes: {
      // The default route is /entryName1, /p/test1 after customization
      entryName1: '/p/test1'
      // Support dynamic server-level routing configuration
      entryName2: '/detail/:id'
    }
  }
});
```

Multiple access routes can also be set for entries using the `Array<string>`:

```ts title="modern.config.ts"
export default defineConfig({
  server: {
    routes: {
      'page-a': [`/a`, '/b'],
    },
  },
});
```

At this point, the '`page-a` entry can be accessed through both `/a` and `/b` routes.

After executing the `dev` command, you can see in `dist/route.json` that there are two routing records in the entry `page-a`:

```json
{
  "routes": [
    {
      "urlPath": "/a",
      "entryName": "page-a",
      "entryPath": "html/page-a/index.html",
      "isSPA": true,
      "isSSR": false
    },
    {
      "urlPath": "/b",
      "entryName": "page-a",
      "entryPath": "html/page-a/index.html",
      "isSPA": true,
      "isSSR": false
    }
  ]
}
```

## Custom response header

The response header can be set by configuring the resHeaders of the entry:

```ts title="modern.config.ts"
export default defineConfig({
  server: {
    routes: {
      'page-a': {
        route: ['/a', '/b'],
        resHeaders: {
          'x-modern-test': '1',
        },
      },
    },
  },
});
```

:::note
This configuration takes effect in both the production environment and the development environment, and can set different response headers according to the NODE_ENV. But if you only need to set response headers in the development environment, `tools.devServer.headers` is recommended.
:::
