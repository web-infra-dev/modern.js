- **Type:** `boolean`

- **Default:** `false`
- **Bundler:** `only support webpack`

Used to enable the ability to source-code build. When this option is turned on, Builder reads the source file corresponding to the `source` field of the subproject package.json and compiles it.

```ts
export default {
  experiments: {
    sourceBuild: true,
  },
};
```
