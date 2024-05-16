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

- **默认值：** `undefined`

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

### 示例

你可以通过 `assetsRetry` 配置项，来定制你的重试逻辑。

如，通过 `assetsRetry.domain` 指定资源加载失败时的重试域名列表：

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

`assetsRetry` 是基于 Rsbuild 的 Assets Retry 插件实现的，并提供相同的配置项。你可以参考 [Rsbuild - Assets Retry 插件](https://rsbuild.dev/zh/plugins/list/plugin-assets-retry#%E9%80%89%E9%A1%B9) 来了解所有可用的配置项。
