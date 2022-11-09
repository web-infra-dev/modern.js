- Type: `string`
- Default: `undefined`

Set the file path of the app icon, which can be a relative path or an absolute path.

After config this option, the icon will be automatically copied to the dist directory during the compilation, and the corresponding `link` tag will be added to the HTML.

#### Example

```js
export default {
  html: {
    appIcon: './src/assets/icon.png',
  },
};
```

After recompiling, the following tags are automatically generated in the HTML:

```html
<link rel="app-touch-icon" sizes="180*180" href="/static/image/icon.png" />
```
