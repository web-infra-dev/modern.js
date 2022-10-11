- Type: `Object`
- Default: `{}`

通过 `tools.devServer` 可以修改开发环境服务器的配置。

### 选项

#### after

- Type: `Array`
- Default: `[]`

添加自定义中间件，在所有开发环境中间件后执行。

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

添加自定义中间件，在所有开发环境中间件前执行。

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
    /** 事件流路径 */
    path?: string;
    /** 指定监听请求的端口号 */
    port?: string;
    /** 指定要使用的 host */
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

配置 hmr 客户端相关功能。

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

devMiddleware 配置项。当前配置是 [webpack-dev-middleware](https://github.com/webpack/webpack-dev-middleware) 配置项的子集.

#### headers

- Type: `Record<string, string>`
- Default: `undefined`

设置自定义响应头。

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

在需要对一些 404 响应或其他请求提供替代页面的场景，可通过 `devServer.historyApiFallback` 进行设置：

```js
export default {
  tools: {
    devServer: {
      historyApiFallback: true,
    },
  },
};
```

更多选项和详细信息可参考 [connect-history-api-fallback](https://github.com/bripkens/connect-history-api-fallback) 文档。

#### hot

- Type: `boolean`
- Default: `true`

是否开启 [Hot Module Replacement](https://webpack.js.org/concepts/hot-module-replacement/) 热更新能力。

#### https

- Type: `boolean | { key: string; cert: string }`
- Default: `false`

默认情况下，DevServer 会启用 HTTP 服务器。通过设置 `devServer.https` 为 `true` 将开启对 HTTPS 的支持，同时会禁用 HTTP 服务器。

你也可以手动传入 HTTPS 服务器所需要的证书和对应的私钥：

```js
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

默认情况下，当监听到文件变化时，DevServer 将会刷新页面（为使 liveReload 能够生效，`devServer.hot` 配置项应当禁用）。通过设置 `devServer.liveReload` 为 `false` 可以关闭该行为。

#### watch

- Type: `boolean`
- Default: `true`

是否监听 `mock/`、`server/`、`api/` 等目录的文件变化。

#### TODO: proxy
