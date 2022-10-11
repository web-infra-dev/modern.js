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

#### proxy

- Type: `Record<string, string> | Record<string, ProxyDetail>`
- Default: `undefined`

代理请求到指定的服务上。

```js
export default {
  tools: {
    devServer: {
      proxy: {
        '/api': 'http://localhost:3000',
      },
    },
  },
};
```

此时，/api/users 请求将会代理到 http://localhost:3000/api/users。

如果你不想传递 /api，可以通过 `pathRewrite` 重写请求路径：

```js
export default {
  tools: {
    devServer: {
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          pathRewrite: { '^/api': '' },
        },
      },
    },
  },
};
```

DevServer Proxy 基于 [http-proxy-middleware](https://github.com/chimurai/http-proxy-middleware) 实现。你可以使用 http-proxy-middleware 的所有配置项，具体可以查看文档。

DevServer Proxy 完整类型定义为：

```ts
import type { Options as HttpProxyOptions } from 'http-proxy-middleware';

type ProxyDetail = HttpProxyOptions & {
  bypass?: (
    req: IncomingMessage,
    res: ServerResponse,
    proxyOptions: ProxyOptions,
  ) => string | undefined | null | false;
  context?: string | string[];
};

type ProxyOptions =
  | Record<string, string>
  | Record<string, ProxyDetail>
  | ProxyDetail[]
  | ProxyDetail;
```

除了 http-proxy-middleware 的选项外，还支持 bypass 和 context 两个配置项：

- bypass：根据函数的返回值绕过代理。
  - 返回 `null` 或 `undefined` 会继续用代理处理请求。
  - 返回 `false` 会返回 404 错误。
  - 返回一个具体的服务路径，将会使用此路径替代原请求路径。
- context：如果你想代理多个特定的路径到同一个目标，你可以使用 context 配置项。

```js
// 自定义 bypass 方法
export default {
  tools: {
    devServer: {
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          bypass: function (req, res, proxyOptions) {
            if (req.headers.accept.indexOf('html') !== -1) {
              console.log('Skipping proxy for browser request.');
              return '/index.html';
            }
          },
        },
      },
    },
  },
};
```

```js
// 代理多个路径到同一个目标
export default {
  tools: {
    devServer: {
      proxy: [
        {
          context: ['/auth', '/api'],
          target: 'http://localhost:3000',
        },
      ],
    },
  },
};
```

#### watch

- Type: `boolean`
- Default: `true`

是否监听 `mock/`、`server/`、`api/` 等目录的文件变化。
