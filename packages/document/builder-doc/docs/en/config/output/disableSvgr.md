- **Type:** `boolean`
- **Default:** `false`

Whether to transform SVGs into React components. If true, will treat all .svg files as assets.

By default, when an SVG resource is referenced in a JS file, Builder will call SVGR to convert the SVG into a React component. If you are sure that all SVG resources in your project are not being used as React components, you can turn off this conversion by setting `disableSvgr` to true to improve build performance.

```js
export default {
  output: {
    disableSvgr: true,
  },
};
```
