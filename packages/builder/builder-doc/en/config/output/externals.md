- Type: `string | object | function | RegExp`

- Default: `undefined`

At build time, prevent some `import` dependencies from being packed into bundles in your code, and instead fetch them externally at runtime.

For more information, please see: [Webpack Externals](https://webpack.js.org/configuration/externals/)

#### Example

Exclude the `react-dom` dependency from the build product.
To get this module at runtime, the value of `react-dom` will globally retrieve the `ReactDOM` variable.

```js
export default {
  output: {
    externals: {
      'react-dom': 'ReactDOM',
    },
  },
};
```
