- **类型：** `Object`

`output.assetsRetry` 用于配置资源加载失败时的重试逻辑。配置类型如下:

```ts
export type AssetsRetryHookContext = {
  times: number;
  domain: string;
  url: string;
  tagName: string;
};

export type AssetsRetryOptions = {
  type?: string[];
  domain?: string[];
  max?: number;
  test?: string | ((url: string) => boolean);
  crossOrigin?: boolean | 'anonymous' | 'use-credentials';
  inlineScript?: boolean;
  onRetry?: (options: AssetsRetryHookContext) => void;
  onSuccess?: (options: AssetsRetryHookContext) => void;
  onFail?: (options: AssetsRetryHookContext) => void;
};
```

由于该能力会往 HTML 中注入额外的一些运行时代码，因此我们默认关闭了该能力，如果需要开启该能力，你可以添加以下配置：

```js
export default {
  output: {
    assetsRetry: {},
  },
};
```

当你开启该能力后，`assetsRetry` 的默认配置如下：

```ts
export const defaultAssetsRetryOptions: AssetsRetryOptions = {
  type: ['script', 'link', 'img'],
  domain: [],
  max: 3,
  test: '',
  crossOrigin: false,
  onRetry: () => {},
  onSuccess: () => {},
  onFail: () => {},
};
```

同时你也可以使用以下的配置项，来定制你的重试逻辑。

### assetsRetry.domain

- **类型：** `string[]`
- **默认值：** `[]`

指定资源加载失败时的重试域名列表。在 `domain` 数组中，第一项是当前使用的域名，后面几项为备用域名。当某个域名的资源请求失败时，Builder 会在数组中找到该域名，并替换为数组的下一个域名。

比如：

```js
export default {
  output: {
    assetsRetry: {
      domain: ['https://cdn1.com', 'https://cdn2.com', 'https://cdn3.com'],
    },
  },
};
```

添加以上配置后，当 `cdn1.com` 域名的资源加载失败时，请求域名会自动降级到 `cdn2.com`。

如果 `cdn2.com` 的资源也请求失败，则会继续请求 `cdn3.com`。

### assetsRetry.type

- **类型：** `string[]`
- **默认值：** `['script', 'link', 'img']`

用于指定需要进行重试的 HTML 标签类型。默认会处理 script 标签、link 标签和 img 标签，对应 JS 代码、CSS 代码和图片。

比如只对 script 标签和 link 标签进行处理：

```js
export default {
  output: {
    assetsRetry: {
      type: ['script', 'link'],
    },
  },
};
```

### assetsRetry.max

- **类型：** `number`
- **默认值：** `3`

单个资源的最大重试次数。比如：

```js
export default {
  output: {
    assetsRetry: {
      max: 5,
    },
  },
};
```

### assetsRetry.test

- **类型：** `string | ((url: string) => boolean) | undefined`
- **默认值：** `undefined`

匹配资源 URL 的正则表达式或函数，默认匹配所有资源。比如：

```js
export default {
  output: {
    assetsRetry: {
      test: /cdn\.example\.com/,
    },
  },
};
```

### assetsRetry.crossOrigin

- **类型：** `undefined | boolean | 'anonymous' | 'use-credentials'`
- **默认值：** `与 html.crossorigin 一致`

在发起资源重新请求时，Builder 会重新创建 `<script>` 标签，此选项可以设置这些标签的 `crossorigin` 属性。

默认情况下，`assetsRetry.crossOrigin` 的值会与 `html.crossorigin` 配置项保持一致，无须额外配置。如果你需要对重新创建的标签进行单独配置，可以使用该选项，比如：

```js
export default {
  output: {
    assetsRetry: {
      crossOrigin: true,
    },
  },
};
```

### assetsRetry.onRetry

- **类型：** `undefined | (options: AssetsRetryHookContext) => void`

资源重试时的回调函数。比如：

```js
export default {
  output: {
    assetsRetry: {
      onRetry: ({ times, domain, url, tagName }) => {
        console.log(
          `Retry ${times} times, domain: ${domain}, url: ${url}, tagName: ${tagName}`,
        );
      },
    },
  },
};
```

### assetsRetry.onSuccess

- **类型：** `undefined | (options: AssetsRetryHookContext) => void`

资源重试成功时的回调函数。比如：

```js
export default {
  output: {
    assetsRetry: {
      onSuccess: ({ times, domain, url, tagName }) => {
        console.log(
          `Retry ${times} times, domain: ${domain}, url: ${url}, tagName: ${tagName}`,
        );
      },
    },
  },
};
```

### assetsRetry.onFail

- **类型：** `undefined | (options: AssetsRetryHookContext) => void`

资源重试超过最大重试次数时的回调函数。比如：

```js
export default {
  output: {
    assetsRetry: {
      onFail: ({ times, domain, url, tagName }) => {
        console.log(
          `Retry ${times} times, domain: ${domain}, url: ${url}, tagName: ${tagName}`,
        );
      },
    },
  },
};
```

### assetsRetry.inlineScript

- **类型：** `boolean`
- **默认值：** `true`

是否将 `assetsRetry` 的运行时 JavaScript 代码内联到 HTML 文件中。

如果你不希望在 HTML 文件中插入相关代码，可以将 `assetsRetry.inlineScript` 设置为 `false`：

```js
export default {
  output: {
    assetsRetry: {
      inlineScript: false,
    },
  },
};
```

添加以上配置后，`assetsRetry` 的运行时代码会被抽取为一个独立的 `assets-retry.[version].js` 文件，并输出到产物目录下。

这种方式的弊端在于，`assets-retry.[version].js` 自身有加载失败的可能性。如果出现这种情况，静态资源重试的逻辑就无法生效。因此，我们更推荐将运行时代码内联到 HTML 文件中。

### 注意事项

当你使用 `assetsRetry` 时，Builder 会向 HTML 中注入一段运行时代码，并将 `assetsRetry` 配置的内容序列化，插入到这段代码中，因此你需要注意：

- 避免在 `assetsRetry` 中配置敏感信息，比如内部使用的 token。
- 避免在 `onRetry`，`onSuccess`，`onFail` 中引用函数外部的变量或方法。
- 避免在 `onRetry`，`onSuccess`，`onFail` 中使用有兼容性问题的语法，因为这些函数会被直接内联到 HTML 中。

以下是一个错误示例：

```js
import { someMethod } from 'utils';

export default {
  output: {
    assetsRetry: {
      onRetry() {
        // 错误用法，包含了敏感信息
        const privateToken = 'a-private-token';

        // 错误用法，使用了外部的方法
        someMethod(privateToken);
      },
    },
  },
};
```

### 使用限制

以下场景 `assetsRetry` 可能无法生效：

#### 微前端应用

如果你的工程是微前端应用（比如 Garfish 子应用），那么 `assetsRetry` 可能无法生效，因为微前端子应用通常不是基于 `<script>` 标签直接加载的。

如果你需要对微前端场景的资源加载进行重试，请联系微前端框架的开发者，以寻找相应的解决方案。

#### 动态 import 资源

目前 `assetsRetry` 无法对动态 import 资源生效，该功能正在支持中。

#### 自定义模版中的资源

`assetsRetry` 通过监听页面 error 事件来获悉当前资源是否加载失败需要重试。因此，如果自定义模版中的资源执行早于 `assetsRetry`，那 `assetsRetry` 无法监听到该资源加载失败的事件，故无法 retry。

如果想要 `assetsRetry` 对自定义模版中的资源生效，可参考 [自定义插入示例](https://github.com/jantimon/html-webpack-plugin/tree/main/examples/custom-insertion-position) 来修改 [html.inject](https://modernjs.dev/builder/api/config-html.html#htmlinject) 配置和自定义模版。

```diff
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>custom template</title>
+   <%= htmlWebpackPlugin.tags.headTags %>
    <script src="//example.com/assets/a.js"></script>
  </head>
  <body>
    <div id="root" />
+    <%= htmlWebpackPlugin.tags.bodyTags %>
  </body>
</html>
```
