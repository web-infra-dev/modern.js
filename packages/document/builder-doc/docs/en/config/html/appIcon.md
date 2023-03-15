- **Type:** `string`
- **Default:** `undefined`

Set the file path of the app icon, can be set as a relative path relative to the project root directory, or as an absolute path to the file. Setting it as a CDN URL is not currently supported.

After config this option, the icon will be automatically copied to the dist directory during the compilation, and the corresponding `link` tag will be added to the HTML.

### Example

Set as a relative path:

```js
export default {
  html: {
    appIcon: './src/assets/icon.png',
  },
};
```

Set to an absolute path:

```js
import path from 'path';

export default {
  html: {
    appIcon: path.resolve(__dirname, './src/assets/icon.png'),
  },
};
```

After recompiling, the following tags are automatically generated in the HTML:

```html
<link rel="apple-touch-icon" sizes="180*180" href="/static/image/icon.png" />
```
