- Type: `Array<string | RegExp>`
- Default: `[]`

In order to maintain faster compilation speed, Builder will not compile files under node_modules through `babel-loader` or `ts-loader` by default, as will as the files outside the current project directory.

Through the `source.include` config, you can specify directories or modules that need additional compilation. For example:

```js
export default {
  source: {
    include: ['foo', /bar/],
  },
};
```

#### Typical Example

A typical usage scenario is to compile files under node_modules, because some third-party dependencies have ES6+ syntax, which may cause them to fail to run on low-version browsers. You can solve the problem by using this config to specify the dependencies that need to be compiled. Take `query-string` as an example, you can do the following config:

```js
export default {
  source: {
    include: [
      // Method 1:
      // First get the path of the module by require.resolve
      // Then pass path.dirname to point to the corresponding directory
      path.dirname(require.resolve('query-string')),
      // Method 2:
      // Match by regular expression
      // All paths containing `/query-string/` will be matched
      /\/query-string\//,
    ],
  },
};
```

> Note that this config will only compile the code of `query-string` itself, not the **sub-dependencies** of `query-string`. If you need to compile a sub-dependency of `query-string`, you need to add the corresponding npm package to `source.include`.

#### Monorepo Project

When using Monorepo, if you need to refer to the source code of other libraries in Monorepo, you can add the corresponding library to `source.include`:

```ts
export default {
  source: {
    source: {
    include: [
      // Method 1:
      // Compile all files in Monorepo's package directory
      path.resolve(__dirname, '../../packages'),

      // Method 2:
      // Compile the source code of a package in Monorepo's package directory
      // This way of writing matches the range more accurately and has less impact on the overall build performance.
      path.resolve(__dirname, '../../packages/xxx/src'),
    ],
  },
};
```
