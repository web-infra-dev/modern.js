- Type: `Object`
- Default: `{}`

The config of DevServer can be modified through `tools.devServer`.

### Options

#### after

- Type: `Array`
- Default: `[]`

Provides the ability to execute custom middleware after all other middleware internally within the server.

```js
export default {
  tools: {
    devServer: {
      after: [
        async (req, res, next) => {
          console.log('after dev middleware');
          next();
        },
      ],
    },
  },
};
```

#### before

- Type: `Array`
- Default: `[]`

Provides the ability to execute custom middleware prior to all other middleware internally within the server.

```js
export default {
  tools: {
    devServer: {
      before: [
        async (req, res, next) => {
          console.log('before dev middleware');
          next();
        },
      ],
    },
  },
};
```

#### client

- Type:

```ts
{
    /** The path which the middleware is serving the event stream on */
    path?: string;
    /** Specify a port number to listen for requests on */
    port?: string;
    /** Specify a host to use */
    host?: string;
}
```

- Default:

```js
{
    path: '/webpack-hmr',
    port: '8080',
    host: networkAddress || 'localhost',
}
```

The config of hmr client.

#### devMiddleware

- Type:

```js
{
  writeToDisk: boolean | ((filename: string) => boolean);
}
```

- Default:

```js
{
  writeToDisk: (file: string) => !file.includes('.hot-update.') && !file.endsWith('.map'),
}
```

The config of devMiddleware. Current options is the subset of [webpack-dev-middleware](https://github.com/webpack/webpack-dev-middleware).

#### headers

- Type: `Record<string, string>`
- Default: `undefined`

Adds headers to all responses.

```js
export default {
  tools: {
    devServer: {
      headers: {
        'X-Custom-Foo': 'bar',
      },
    },
  },
};
```

#### historyApiFallback

- Type: `boolean | ConnectHistoryApiFallbackOptions`
- Default: `false`

The index.html page will likely have to be served in place of any 404 responses. Enable `devServer.historyApiFallback` by setting it to `true`:

```js
export default {
  tools: {
    devServer: {
      historyApiFallback: true,
    },
  },
};
```

For more options and information, see the [connect-history-api-fallback](https://github.com/bripkens/connect-history-api-fallback) documentation.

#### hot

- Type: `boolean`
- Default: `true`

Enable [Hot Module Replacement](https://webpack.js.org/concepts/hot-module-replacement/) feature.

#### https

- Type: `boolean | { key: string; cert: string }`
- Default: `false`

By default, DevServer will be served over HTTP. It can optionally be served over HTTPS by setting `devServer.https` to `true`, and will disable the HTTP server.

You can also manually pass in the certificate and corresponding private key required by the HTTPS server:

```ts
export default {
  tools: {
    devServer: {
      https: {
        key: fs.readFileSync('certificates/private.pem'),
        cert: fs.readFileSync('certificates/public.pem'),
      },
    },
  },
};
```

#### liveReload

- Type: `boolean`
- Default: `true`

By default, the DevServer will reload/refresh the page when file changes are detected（`devServer.hot` option must be disabled in order for liveReload to take effect）.
Disable `devServer.liveReload` by setting it to `false`.

#### watch

- Type: `boolean`
- Default: `true`

Whether to watch files change in directories such as `mock/`, `server/`, `api/`.

#### TODO: proxy
