- **Type**

```ts
type BuildCacheConfig =
  | {
      /**
       * webpack base directory for the filesystem cache.
       */
      cacheDirectory?: string;
    }
  | boolean;
```

- **Default**:

```js
const defaultBuildCacheConfig = {
  cacheDirectory: './node_modules/.cache/webapck',
};
```

Cache the modules and chunks generated during webpack packaging to improve build speed.

By default, Builder turns on caching, using the directory `. /node_modules/.cache/webpack` as the cache directory for packaging.

You can configure the cache path with `buildCache`, e.g.

```js
export default {
  performance: {
    buildCache: {
      cacheDirectory: './node_modules/.custom_cache/webpack',
    },
  },
};
```

You can also disable `buildCache` by setting it to `false` if you don't want it to be cached:

```js
export default {
  performance: {
    buildCache: false,
  },
};
```
