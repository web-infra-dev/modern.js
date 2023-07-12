- **类型：** `Object`
- **默认值：** `{}`

通过 `tools.devServer` 可以修改开发环境服务器的配置。

:::tip
Modern.js 中并没有直接使用 [webpack-dev-server](https://webpack.js.org/api/webpack-dev-server/) 或 [@rspack/dev-server](https://www.rspack.dev/guide/dev-server.html), 而是基于 [webpack-dev-middleware](https://github.com/webpack/webpack-dev-middleware) 实现 DevServer。
:::

### 选项

#### after

- **类型：** `Array`
- **默认值：** `[]`

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

`webpack-dev-server` 使用 Express 作为服务端框架。Modern.js 中没有使用任何框架，上述中间件中 `req` 和 `res` 都是 Node 原生对象，因此 `webpack-dev-server` 的 Express 中间件不一定能直接在 Modern.js 中使用。

如果要迁移 `webpack-dev-server` 中使用的 Express 中间件，可以使用以下方式，将 Express app 作为中间件传入：

```js
import expressMiddleware from 'my-express-middleware';
import express from 'express';

// 初始化 Express app
const app = express();
app.use(expressMiddleware);

export default {
  tools: {
    devServer: {
      after: [app],
    },
  },
};
```

#### before

- **类型：** `Array`
- **默认值：** `[]`

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

- **类型：**

```ts
{
    /** 指定协议名称 */
    protocol?: string;
    /** 事件流路径 */
    path?: string;
    /** 指定监听请求的端口号 */
    port?: string;
    /** 指定要使用的 host */
    host?: string;
}
```

- **默认值：**

```js
const defaultConfig = {
  path: '/webpack-hmr',
  // By default it is set to the port number of the dev server
  port: '',
  // By default it is set to "location.hostname"
  host: '',
  // By default it is set to "location.protocol === 'https:' ? 'wss' : 'ws'""
  protocol: '',
};
```

对应 HMR 客户端的配置，通常用于设置 HMR 对应的 WebSocket URL。

#### compress

- **类型：** `boolean`
- **默认值：** `true`

是否对静态资源启用 gzip 压缩。

如果你需要禁用 gzip 压缩，可以将 `compress` 设置为 `false`：

```ts
export default {
  tools: {
    devServer: {
      compress: false,
    },
  },
};
```

#### devMiddleware

- **类型：**

```js
{
  writeToDisk: boolean | ((filename: string) => boolean);
}
```

- **默认值：**

```js
{
  writeToDisk: (file: string) => !file.includes('.hot-update.'),
}
```

devMiddleware 配置项。当前配置是 [webpack-dev-middleware](https://github.com/webpack/webpack-dev-middleware) 配置项的子集.

#### headers

- **类型：** `Record<string, string>`
- **默认值：** `undefined`

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

- **类型：** `boolean | ConnectHistoryApiFallbackOptions`
- **默认值：** `false`

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

- **类型：** `boolean`
- **默认值：** `true`

是否开启 [Hot Module Replacement](https://webpack.js.org/concepts/hot-module-replacement/) 热更新能力。

#### https

- **类型：** `boolean | { key: string; cert: string }`
- **默认值：** `false`

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

- **类型：** `boolean`
- **默认值：** `true`

默认情况下，当监听到文件变化时，DevServer 将会刷新页面（为使 liveReload 能够生效，`devServer.hot` 配置项应当禁用）。通过设置 `devServer.liveReload` 为 `false` 可以关闭该行为。

#### setupMiddlewares

- **类型：**

```js
Array<
  (
    middlewares: {
      unshift: (...handlers: RequestHandler[]) => void;
      push: (...handlers: RequestHandler[]) => void;
    },
    server: {
      sockWrite: (
        type: string,
        data?: string | boolean | Record<string, any>,
      ) => void;
    },
  ) => void
>;
```

- **默认值：** `undefined`

提供执行自定义函数和应用自定义中间件的能力。

几种不同中间件之间的执行顺序是: `devServer.before` => `unshift` => 内置中间件 => `push` => `devServer.after`。

```js
export default {
  tools: {
    devServer: {
      setupMiddlewares: [
        (middlewares, server) => {
          middlewares.unshift((req, res, next) => {
            next();
          });

          middlewares.push((req, res, next) => {
            next();
          });
        },
      ],
    },
  },
};
```

一些特殊场景需求可能需要使用服务器 API：

- sockWrite。允许向 hmr 客户端传递一些消息，hmr 客户端将根据接收到的消息类型进行不同的处理。如果你发送一个 "content-changed " 的消息，页面将会重新加载。

```js
export default {
  tools: {
    devServer: {
      setupMiddlewares: [
        (middlewares, server) => {
          // 添加自定义 watcher 并在文件更新时触发页面刷新
          watcher.on('change', changed => {
            server.sockWrite('content-changed');
          });
        },
      ],
    },
  },
};
```

#### proxy

- **类型：** `Record<string, string> | Record<string, ProxyDetail>`
- **默认值：** `undefined`

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

DevServer Proxy 基于 [http-proxy-middleware](https://github.com/chimurai/http-proxy-middleware/tree/2.x) 实现。你可以使用 http-proxy-middleware 的所有配置项，具体可以查看文档。

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

- **类型：** `boolean`
- **默认值：** `true`

是否监听 `mock/`、`server/`、`api/` 等目录的文件变化。
