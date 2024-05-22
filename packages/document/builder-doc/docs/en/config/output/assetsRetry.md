- **Type:** `Object`

`output.assetsRetry` is used to configure the retry of assets.The type of `AssetsRetryOptions` is as follows:

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

- **Default:** `undefined`

Since the ability will inject some extra runtime code into HTML, we have disabled this ability by default. If you need to enable it, you can configure it in the form of an object, for example:

```js
export default {
  output: {
    assetsRetry: {},
  },
};
```

When you enable this ability, the default config of `assetsRetry` is as follows:

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

### Example

You can also customize your retry logic using the `assetsRetry` options.

For example, setting `assetsRetry.domain` to specify the retry domain when assets fail to load.

```js
export default {
  output: {
    assetsRetry: {
      domain: ['https://cdn1.com', 'https://cdn2.com', 'https://cdn3.com'],
    },
  },
};
```

After adding the above configuration, when assets fail to load from the `cdn1.com` domain, the request domain will automatically fallback to `cdn2.com`.

If the assets request for `cdn2.com` also fails, the request will fallback to `cdn3.com`.

`assetsRetry` is implemented based on the Assets Retry plugin of Rsbuild and provides the same configuration options. You can refer to [Rsbuild - Assets Retry Plugin](https://rsbuild.dev/plugins/list/plugin-assets-retry#options) to understand all available configuration options.
