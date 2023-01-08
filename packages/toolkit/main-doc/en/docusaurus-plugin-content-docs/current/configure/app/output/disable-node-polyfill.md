---
sidebar_label: disableNodePolyfill
---

# output.disableNodePolyfill

- Type: `boolean`
- Default: `false`

By default Modern.js has built-in [node polyfill removed by webpack 5](https://webpack.js.org/blog/2020-10-10-webpack-5-release/#automatic-nodejs-polyfills-removed).

If you confirm that you do not need any Node Polyfill in the project, you can configure the following in `modern.config.ts` to turn off the built-in imported Node Polyfill:

```ts title="modern.config.ts"
export default defineConfig({
  output: {
    disableNodePolyfill: true,
  },
});
```
