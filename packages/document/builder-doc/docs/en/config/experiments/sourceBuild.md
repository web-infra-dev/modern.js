- **Type:** `boolean | PluginSourceBuildOptions`
- **Default:** `false`
- **Version:** `MAJOR_VERSION.46.0`

Used to enable the ability for source code building. When this configuration option is enabled, Builder will read the source code files corresponding to the `source` field in the sub-project's package.json and compile them.

```ts
export default {
  experiments: {
    sourceBuild: true,
  },
};
```

More detail can see ["Source Code Build Mode"](https://modernjs.dev/en/guides/advanced-features/source-build.html)。

### Options

`experiments.sourceBuild` is implemented based on Rsbuild's [Source Build plugin](https://rsbuild.dev/plugins/list/plugin-source-build#options). You can pass plugin options like this:

```ts
export default {
  experiments: {
    sourceBuild: {
      sourceField: 'my-source',
      resolvePriority: 'output',
    },
  },
};
```
