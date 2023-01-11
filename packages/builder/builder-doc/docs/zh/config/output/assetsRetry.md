- Type: `Object`

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
  crossOrigin?: boolean;
  onRetry?: (options: AssetsRetryHookContext) => void;
  onSuccess?: (options: AssetsRetryHookContext) => void;
  onFail?: (options: AssetsRetryHookContext) => void;
};
```

默认值如下:

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

### assetsRetry.max

- Type: `number`
- Default: `3`

单个资源的最大重试次数。比如：

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

指定资源加载失败时的重试域名，如果为空则使用当前页面的域名。比如：

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

可重试的资源类型。比如：

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

- Type: `undefined | boolean`
- Default: false

用于向 `<script>` 资源标签中注入 crossorigin 属性，传入 true 则会启用默认值 anonymous。比如：

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

- Type: `undefined | (options: AssetsRetryHookContext) => void`

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

- Type: `undefined | (options: AssetsRetryHookContext) => void`

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
