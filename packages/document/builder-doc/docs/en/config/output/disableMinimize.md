- **Type:** `boolean`
- **Default:** `false`

Whether to disable code minification on production builds.

By default, JS and CSS code is minified during the production build to improve the page performance. If you do not want to the code to be minified, you can set `disableMinimize` to `true`.

```js
export default {
  output: {
    disableMinimize: true,
  },
};
```

:::tip
This configuration is usually used for debugging and troubleshooting. It is not recommended to disable code minification in production environments, as it will significantly degrade the page performance.
:::
