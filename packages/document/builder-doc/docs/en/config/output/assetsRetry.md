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

### assetsRetry.domain

- **Type:** `string[]`
- **Default:** `[]`

Specifies the retry domain when assets fail to load. In the `domain` array, the first item is the currently used domain, and the following items are backup domains. When a asset request for a domain fails, Builder will find that domain in the array and replace it with the next domain in the array.

For example:

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

### assetsRetry.type

- **Type:** `string[]`
- **Default:** `['script', 'link', 'img']`

Used to specify the HTML tag types that need to be retried. By default, script tags, link tags, and img tags are processed, corresponding to JS code, CSS code, and images.

For example, only script tags and link tags are processed:

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

- **Type:** `number`
- **Default:** `3`

The maximum number of retries for a single asset. For example:

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

- **Type:** `undefined | boolean | 'anonymous' | 'use-credentials'`
- **Default:** `same as html.crossorigin`

When initiating a retry for assets, Builder will recreate the `<script>` tags. This option allows you to set the `crossorigin` attribute for these tags.

By default, the value of `assetsRetry.crossOrigin` will be consistent with the `html.crossorigin` configuration, so no additional configuration is required. If you need to configure the recreated tags separately, you can use this option, for example:

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

### Notes

When you use `assetsRetry`, the Builder injects some runtime code into the HTML and serializes the `assetsRetry` config, inserting it into the runtime code. Therefore, you need to be aware of the following:

- Avoid configuring sensitive information in `assetsRetry`, such as internal tokens.
- Avoid referencing variables or methods outside of `onRetry`, `onSuccess`, and `onFail`.
- Avoid using syntax with compatibility issues in `onRetry`, `onSuccess` and `onFail` as these functions are inlined directly into the HTML.

Here's an example of incorrect usage:

```js
import { someMethod } from 'utils';

export default {
  output: {
    assetsRetry: {
      onRetry() {
        // Incorrect usage, includes sensitive information
        const privateToken = 'a-private-token';

        // Incorrect usage, uses an external method
        someMethod(privateToken);
      },
    },
  },
};
```

### Limitation

`assetsRetry` may not work in the following scenarios:

#### Micro-frontend application

If your project is a micro-frontend application (such as a Garfish sub-application), the assets retry may not work because micro-frontend sub-applications are typically not loaded directly based on the `<script>` tag.

If you need to retry assets in micro-frontend scenarios, please contact the developers of the micro-frontend framework to find a solution.

#### Dynamic import resources

Currently, `assetsRetry` cannot work on dynamically imported resources. This feature is being supported.

#### Resources in custom templates

`assetsRetry` listens to the page error event to know whether the current resource fails to load and needs to be retried. Therefore, if the resource in the custom template is executed earlier than `assetsRetry`, then `assetsRetry` cannot listen to the event that the resource fails to load, so it cannot retry.

If you want `assetsRetry` to work on resources in custom templates, you can refer to [Custom Insertion Example](https://github.com/jantimon/html-webpack-plugin/tree/main/examples/custom-insertion-position) to modify [html.inject](https://modernjs.dev/builder/en/api/config-html.html) configuration and custom template.

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
