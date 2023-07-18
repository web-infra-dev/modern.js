- **Type:** `boolean`
- **Default:** `false`
- **Bundler:** `only support webpack`

Used to enable the ability for source code building. When this configuration option is enabled, Builder will read the source code files corresponding to the `source` field in the sub-project's package.json and compile them.

```ts
export default {
  experiments: {
    sourceBuild: true,
  },
};
```

More detail can see ["Advanced - Source-code Build Mode"](https://modernjs.dev/builder/en/guide/advanced/source-build.html)。
