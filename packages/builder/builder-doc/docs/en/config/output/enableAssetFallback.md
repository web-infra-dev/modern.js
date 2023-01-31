- **Type:** `boolean`
- **Default:** `false`

If this option is enabled, all unrecognized files will be emitted to the dist directory; otherwise, an exception will be thrown.

### Example

Enable the config:

```js
export default {
  output: {
    enableAssetFallback: true,
  },
};
```

Import a module of unknown type in code:

```js
import './foo.xxx';
```

After compilation, `foo.xxx` will be output to the `dist/static/media` directory.

You can control the output path and filename after fallback through the `output.distPath.media` and `output.filename.media` configs.

:::tip
Enabling this config will change the rules structure in the webpack config. In most cases, we do not recommend using this config.
:::
