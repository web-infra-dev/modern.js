- Type: `Object`

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

The default value is as follows:

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

#### assetsRetry.max

- Type: `number`
- Default: `3`

The maximum number of retries for a single resource. For example:

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

- Type: `string[]`
- Default: `[]`

The domain of the resource to be retried. For example:

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

- Type: `string[]`
- Default: `['script', 'link', 'img']`

The type of the resource to be retried. For example:

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

- Type: `string | ((url: string) => boolean) | undefined`
- Default: `undefined`

The test function of the resource to be retried. For example:

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

- Type: `undefined | boolean`
- Default: false

Whether to add the `crossOrigin` attribute to the resource to be retried. For example:

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

- Type: `undefined | (options: AssetsRetryHookContext) => void`

The callback function when the resource is being retried. For example:

```js
export default {
  output: {
    assetsRetry: {
      onRetry: ({ times, domain, url, tagName }) => {
        console.log(`Retry ${times} times, domain: ${domain}, url: ${url}, tagName: ${tagName}`);
      },
    },
  },
};
```

### assetsRetry.onSuccess

- Type: `undefined | (options: AssetsRetryHookContext) => void`

The callback function when the resource is successfully retried. For example:

```js
export default {
  output: {
    assetsRetry: {
      onSuccess: ({ times, domain, url, tagName }) => {
        console.log(`Retry ${times} times, domain: ${domain}, url: ${url}, tagName: ${tagName}`);
      },
    },
  },
};
```

### assetsRetry.onFail

- Type: `undefined | (options: AssetsRetryHookContext) => void`

The callback function when the resource is failed to be retried. For example:

```js
export default {
  output: {
    assetsRetry: {
      onFail: ({ times, domain, url, tagName }) => {
        console.log(`Retry ${times} times, domain: ${domain}, url: ${url}, tagName: ${tagName}`);
      },
    },
  },
};
```
