- **Type**

```ts
type BuildCacheConfig = {
  /**
   * Webpack base directory for the filesystem cache.
   */
  cacheDirectory?: string;
};
```

- **Default**:

```js
const defaultBuildCacheConfig = {
  cacheDirectory: './node_modules/.cache/webapck',
};
```

Cache the modules and chunks generated during Webpack packaging to improve build speed.

By default, webpack-builder will use the directory `./node_modules/.cache/webpack` as the cache directory for packaging.

You can also configure the cache path with `buildCache`, e.g.

```js
export default {
  performance: {
    buildCache: {
      cacheDirectory: './node_modules/.custom_cache/webpack',
    },
  },
};
```
