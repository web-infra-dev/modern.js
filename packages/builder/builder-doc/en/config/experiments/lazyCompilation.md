- Type:

```ts
type LazyCompilationOptions =
  | boolean
  | {
      // Whether to enable lazy compilation for entries
      entries?: boolean;
      // Whether to enable lazy compilation for dynamic imports
      imports?: boolean;
    };
```

- Default: `false`

Used to enable the lazy compilation (i.e. compile on demand). When this config is enabled, Builder will compile entrypoints and dynamic imports only when they are used. It will improve the compilation startup time of the project.

Lazy compilation only takes effect in the development.

### Lazy Compilation for Dynamic Imports

Lazy compile async modules introduced by [Dynamic Import](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/import):

```ts
export default {
  experiments: {
    lazyCompilation: {
      imports: true,
      entries: false,
    },
  },
};
```

When `imports` option is enabled, all async modules will only be compiled when requested. If your project is a single-page application, and routing is split through Dynamic Import, there will be a significant effect of speeding up compilation.

### Lazy Compilation for Entires

In addition to lazy compilation for async modules, you can also choose to lazily compile both entries and async modules at the same time.

```ts
export default {
  experiments: {
    lazyCompilation: {
      imports: true,
      entries: true,
    },
  },
};
```

The above config can also be simplified to:

```ts
export default {
  experiments: {
    lazyCompilation: true,
  },
};
```

When `entries` option is enabled, all pages will not be compiled when the compilation is started, and the page will be compiled only when you visit it.

When using lazy compilation for entries, there are some considerations:

- Only work for multi-page applications, no work for single-page applications.
- when you visit a page, there will be a white screen for a period of time due to waiting for the page to be compiled.

### Limitations

#### Disable split chunks

When you enable lazy compilation, in order to ensure the compilation results, Builder will disable split chunks in the development. This will not affect the build results in the production, but will cause a difference between the build results of the development and production.

#### Use proxy

Lazy Compilation relies on the local development server of webpack. When you proxy a domain name to localhost, Lazy Compilation will not work properly. Therefore, if you need to develop with proxy, please disable Lazy Compilation.
