- **Type:** `boolean | object`
- **Default:** `false`

By setting `output.convertToRem`, the Builder can do the following things:

- Convert px to rem in CSS.
- Insert runtime code into the HTML template to set the fontSize of the root element.

### Boolean Type

If `output.convertToRem` is set to `true`, Rem processing capability will be turned on.

```js
export default {
  output: {
    convertToRem: true,
  },
};
```

At this point, the rem configuration defaults as follows:

```js
{
  enableRuntime: true,
  rootFontSize: 50,
  screenWidth: 375,
  rootFontSize: 50,
  maxRootFontSize: 64,
  widthQueryKey: '',
  excludeEntries: [],
  supportLandscape: false,
  useRootFontSizeBeyondMax: false,
  pxtorem: {
    rootValue: 50,
    unitPrecision: 5,
    propList: ['*'],
  }
}
```

### Object Type

When the value of `output.convertToRem` is `object` type, The Builder will perform Rem processing based on the current configuration.

options:

| Name                     | Type       | Default                                                                                                              | Description                                                                                                                                                                        |
| ------------------------ | ---------- | -------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| enableRuntime            | `boolean`  | `true`                                                                                                               | Whether to generate runtime code to calculate and set the font size of the root element                                                                                            |
| inlineRuntime            | `boolean`  | `true`                                                                                                               | Whether to inline the runtime code to HTML. If set to `false`, the runtime code will be extracted into a separate `convert-rem.[version].js` file and output to the dist directory |
| rootFontSize             | `number`   | `50`                                                                                                                 | The root element font size                                                                                                                                                         |
| maxRootFontSize          | `number`   | `64`                                                                                                                 | The root element max font size                                                                                                                                                     |
| widthQueryKey            | `string`   | `'' `                                                                                                                | Get clientWidth from the url query based on widthQueryKey                                                                                                                          |
| screenWidth              | `number`   | `375`                                                                                                                | The screen width for UI design drawings (Usually, `fontSize = (clientWidth * rootFontSize) / screenWidth`)                                                                         |
| excludeEntries           | `string[]` | `[]`                                                                                                                 | To exclude some page entries from injecting runtime code, it is usually used with `pxtorem.exclude`                                                                                |
| supportLandscape         | `boolean`  | `false`                                                                                                              | Use height to calculate rem in landscape                                                                                                                                           |
| useRootFontSizeBeyondMax | `boolean`  | `false`                                                                                                              | Whether to use rootFontSize when large than maxRootFontSize                                                                                                                        |
| pxtorem                  | `object`   | <ul><li>rootValue (Default is the same as rootFontSize) </li><li>unitPrecision: 5 </li><li>propList: ['*']</li></ul> | [postcss-pxtorem](https://github.com/cuth/postcss-pxtorem#options) options                                                                                                         |

### Example

```js
export default {
  output: {
    convertToRem: {
      rootFontSize: 30,
      excludeEntries: ['404', 'page2'],
      pxtorem: {
        propList: ['font-size'],
      },
    },
  },
};
```
