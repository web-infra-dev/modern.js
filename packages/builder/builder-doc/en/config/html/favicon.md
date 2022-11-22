- Type: `string`
- Default: `undefined`

Set the favicon icon for the page.

After config this option, the favicon will be automatically copied to the dist directory during the compilation, and the corresponding `link` tag will be added to the HTML.

#### Example

```js
export default {
  html: {
    favicon: './src/assets/icon.png',
  },
};
```

After recompiling, the following tags are automatically generated in the HTML:

```html
<link rel="icon" href="/favicon.ico" />
```
