- **Type:**

```ts
type BuildCacheConfig =
  | {
      /**
       * Base directory for the filesystem cache.
       */
      cacheDirectory?: string;
      /**
       * Set different cache names based on cacheDigest content.
       */
      cacheDigest?: Array<string | undefined>;
    }
  | boolean;
```

- **Default:**

```js
const defaultBuildCacheConfig = {
  cacheDirectory: './node_modules/.cache/webpack',
};
```

- **Bundler:** `only support webpack`

Controls the Builder's caching behavior during the build process.

Builder will enable build cache by default to improve the compile speed, the generated cache files are write to the `./node_modules/.cache/webpack` directory by default.

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

You can also disable the build cache by setting it to `false`:

```js
export default {
  performance: {
    buildCache: false,
  },
};
```

### cacheDigest

`cacheDigest` is used to add some environment variables that will affect the build results. The Builder will set the cache name based on the `cacheDigest` content and the current build mode to ensure that different cacheDigests can hit different caches.

#### Example

The current project needs to set different extensions according to different `APP_ID`. By default, since the code & configuration & dependencies of the current project have not changed, the previous cache will be hit.

By adding `APP_ID` to `cacheDigest`, different cache results will be searched when APP_ID changes, thereby avoiding hitting cache results that do not meet expectations.

```js
export default {
  tools: {
    bundlerChain: (chain: any) => {
      if (process.env.APP_ID === 'xxx') {
        chain.resolve.extensions.prepend('.ttp.ts');
      }
    },
  },
  performance: {
    buildCache: {
      cacheDigest: [process.env.APP_ID],
    },
  },
};
```
