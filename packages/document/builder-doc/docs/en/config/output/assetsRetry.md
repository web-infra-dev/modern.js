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
  crossOrigin?: boolean;
  onRetry?: (options: AssetsRetryHookContext) => void;
  onSuccess?: (options: AssetsRetryHookContext) => void;
  onFail?: (options: AssetsRetryHookContext) => void;
};
```

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

At the same time, you can also customize your retry logic using the following configurations.

### assetsRetry.max

- **Type:** `number`
- **Default:** `3`

The maximum number of retries for a single asset. For example:

```js
export default {
  output: {
    assetsRetry: {
      max: 3,
    },
  },
};
```

### assetsRetry.domain

- **Type:** `string[]`
- **Default:** `[]`

The domain of the asset to be retried. For example:

```js
export default {
  output: {
    assetsRetry: {
      domain: ['https://cdn1.example.com', 'https://cdn2.example.com'],
    },
  },
};
```

### assetsRetry.type

- **Type:** `string[]`
- **Default:** `['script', 'link', 'img']`

The type of the asset to be retried. For example:

```js
export default {
  output: {
    assetsRetry: {
      type: ['script', 'link'],
    },
  },
};
```

### assetsRetry.test

- **Type:** `string | ((url: string) => boolean) | undefined`
- **Default:** `undefined`

The test function of the asset to be retried. For example:

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

- **Type:** `undefined | boolean`
- **Default:** false

Whether to add the `crossOrigin` attribute to the asset to be retried. For example:

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

- **Type:** `undefined | (options: AssetsRetryHookContext) => void`

The callback function when the asset is being retried. For example:

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

- **Type:** `undefined | (options: AssetsRetryHookContext) => void`

The callback function when the asset is successfully retried. For example:

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

- **Type:** `undefined | (options: AssetsRetryHookContext) => void`

The callback function when the asset is failed to be retried. For example:

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

- **Type:** `boolean`
- **Default:** `true`

Whether to inline the runtime JavaScript code of `assetsRetry` into the HTML file.

If you don't want to insert the code in the HTML file, you can set `assetsRetry.inlineScript` to `false`:

```js
export default {
  output: {
    assetsRetry: {
      inlineScript: false,
    },
  },
};
```

After adding the above configuration, the runtime code of `assetsRetry` will be extracted into a separate `assets-retry.[version].js` file and output to the dist directory.

The downside is that `assets-retry.[version].js` itself may fail to load. If this happens, the assets retry will not work. Therefore, we prefer to inline the runtime code into the HTML file.
