- Type: `(string | string[])[]`
- Default: `undefined`

This config will determine which field of `package.json` you use to import the `npm` module. Same as the [resolve.mainFields](https://webpack.js.org/configuration/resolve/#resolvemainfields) config of webpack.

#### Example

```js
export default {
  source: {
    resolveMainFields: ['main', 'browser', 'exports'],
  },
};
```
