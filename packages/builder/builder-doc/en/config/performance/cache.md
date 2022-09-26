- **Type**

```ts
type CacheConfig = {
  /**
   * Webpack base directory for the filesystem cache (defaults to node_modules/.cache/webpack).
   */
  cacheDirectory?: string;
};
```

- **Default**: `undefined`

Cache the modules and chunks generated during Webpack packaging to improve build speed.

By default, webpack-builder will use the directory `./node_modules/.cache/webpack` as the cache directory for packaging.

You can also configure the cache path with `cache`, e.g.

```js
export default {
  performance: {
    cache: {
      cacheDirectory: './node_modules/.custom_cache/webpack',
    },
  },
};
```
