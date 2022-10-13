- Type: `(string | string[])[]`

- Default: `undefined`

This configuration will determine which field of `package.json` you use to import the `npm` module. Same as the [resolve.mainFields](https://webpack.js.org/configuration/resolve/#resolvemainfields) config of Webpack.

#### Example

```js
export default {
  source: {
    resolveMainFields: ['main', 'browser', 'exports'],
  },
};
```
