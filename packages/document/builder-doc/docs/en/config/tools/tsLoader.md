- **Type:** `Object | Function | undefined`
- **Default:** `undefined`
- **Bundler:** `only support webpack`

`ts-loader` is not enabled by default in the project. When `tools.tsLoader` is not undefined, builder will use ts-loader instead of babel-loader to compile TypeScript code.

### Object Type

When this value is an Object, it is merged with the default configuration via Object.assign.

The default configuration is as follows:

```json
{
  "compilerOptions": {
    "target": "es5",
    "module": "ESNext"
  },
  "transpileOnly": true,
  "allowTsInNodeModules": true
}
```

You can override the default configuration via the `tools.tsLoader` configuration option:

```ts
export default {
  tools: {
    tsLoader: {
      allowTsInNodeModules: false,
    },
  },
};
```

### Function Type

When this value is a Function, the default configuration is passed in as the first parameter, the configuration object can be modified directly, or an object can be returned as the final configuration.The second parameter is the util functions to modify the `ts-loader` configuration. For example:

```ts
export default {
  tools: {
    tsLoader: opts => {
      opts.allowTsInNodeModules = false;
    },
  },
};
```

### Util Functions

#### addIncludes

Deprecated, please use [source.include](https://modernjs.dev/en/configure/app/source/include.html) instead, both have the same functionality.

#### addExcludes

Deprecated, please use [source.exclude](https://modernjs.dev/en/configure/app/source/exclude.html) instead, both have the same functionality.
