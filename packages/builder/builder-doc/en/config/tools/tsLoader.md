- Type： `Object | Function | undefined`
- Default:`undefined`

`ts-loader` is not enabled by default in the project. When `tools.tsLoader` is not undefined, builder will use ts-loader instead of babel-loader to compile TypeScript code.

### Object Type

When this value is of type Object, it is merged with the default configuration via Object.assign.

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

You can override the default configuration via the `tools.tsLoader` configuration item:

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

When this value is of type Function, the default configuration is passed in as the first parameter, the configuration object can be modified directly, or an object can be returned as the final configuration.The second parameter is the util functions to modify the `ts-loader` configuration. For example:

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

When the value of `tools.tsLoader` is of type Function, the utils functions available for the second parameter are as follows:

#### addIncludes

Type: `(includes: string | RegExp | Array<string | RegExp>) => void`

By default, only the application code in the src directory will be compiled. Use `addIncludes` to specify ts-loader to compile some files under `node_modules`. For example:

```ts
export default {
  tools: {
    tsLoader: (config, { addIncludes }) => {
      addIncludes([/node_modules\/react/]);
    },
  },
};
```

#### addExcludes

Type: `(excludes: string | RegExp | Array<string | RegExp>) => void`

Contrary to `addIncludes`, specify `ts-loader` to exclude certain files when compiling.

For example, without compiling files in the `src/example` directory:

```ts
export default {
  tools: {
    tsLoader: (config, { addExcludes }) => {
      addExcludes([/src\/example\//]);
    },
  },
};
```
