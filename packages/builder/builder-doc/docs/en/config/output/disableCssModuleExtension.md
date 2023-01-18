- Type: `boolean`
- Default: `false`

Whether to treat all `.css` files in the source directory as CSS Modules.

By default, only the `*.module.css` files are treated as CSS Modules. After enabling this config, all `*.css` style files in the source directory will be regarded as CSS Modules.

`.sass`, `.scss` and `.less` files are also affected by `disableCssModuleExtension`.

:::tip
We do not recommend enabling this config, because after enabling `disableCssModuleExtension`, CSS Modules files and ordinary CSS files cannot be clearly distinguished, which is not conducive to long-term maintenance.
:::

### Example

```js
export default {
  output: {
    disableCssModuleExtension: true,
  },
};
```

### Detailed

The following is a detailed explanation of the CSS Modules rules:

#### disableCssModuleExtension is false (default)

The following files are treated as CSS Modules:

- all `*.module.css` files

The following files are treated as normal CSS:

- all `*.css` files (excluding `.module`)
- all `*.global.css` files

#### disableCssModuleExtension is true

The following files are treated as CSS Modules:

- `*.css` and `*.module.css` files in the source directory
- `*.module.css` files under node_modules

The following files are treated as normal CSS:

- all `*.global.css` files
- `*.css` files under node_modules (without `.module`)

:::tip
For CSS Modules files inside node_modules, please always use the `*.module.css` suffix.
:::
