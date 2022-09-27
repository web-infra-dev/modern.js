- Type: `boolean | object`
- Default: `false`

By setting `output.convertToRem`, the Builder can do the following things:
- Convert px to rem in CSS
- Insert runtime code into the HTML template to set the fontSize of the root element

#### Boolean Type

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

#### Object Type

When the value of `output.convertToRem` is `object` type, The Builder will perform Rem processing based on the current configuration.

options:

| Name                   | Type                                  | Default                                                       | Description                                                    |
| ------------------------ | ------------------------------------------------------------ | ------------------------------------------------------------ | ------------------------------------------------------------ |
| enableRuntime            | `boolean` | `true`                                                         | Whether to inject runtime code into html templates  |
| rootFontSize             | `number`                                     | `50`                                                           | The root element font size                                                 |
| maxRootFontSize          | `number`                                   | `64`                                                           | The root element max font size                                             |
| widthQueryKey            | `string` | `'' `                                                          | Get clientWidth from the url query based on widthQueryKey（The default is to get it from the Document of the current page） |
| screenWidth              | `number`                    | `375`                                                          | The screen width（Usually, `fontSize = (clientWidth * rootFontSize) / screenWidth`）                              |
| excludeEntries           | `string[]`                           | `[]`                                                           | The entries to ignore                                         |
| supportLandscape         | `boolean`                       | `false`                                                        | Use height to calculate rem in landscape                                  |
| useRootFontSizeBeyondMax | `boolean` | `false`                                                        | Whether to use rootFontSize when large than maxRootFontSize |
| pxtorem                  | `object` | <ul><li>rootValue (Default is the same as rootFontSize) </li><li>unitPrecision: 5 </li><li>propList: ['*']</li></ul> | [postcss-pxtorem](https://github.com/cuth/postcss-pxtorem#options) options |


#### Example

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
