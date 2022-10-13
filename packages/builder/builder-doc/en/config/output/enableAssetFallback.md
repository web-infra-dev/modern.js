- Type: `boolean`
- Default: `false`

If this option is enabled, all unrecognized files will be emitted to the dist directory; otherwise, an exception will be thrown.

#### Example

```js
export default {
  output: {
    enableAssetFallback: true,
  },
};
```

Note: Enabling this config will change the rules structure in the webpack config. In most cases, we do not recommend using this config.
