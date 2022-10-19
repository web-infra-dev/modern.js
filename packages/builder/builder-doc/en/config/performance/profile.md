- Type: `boolean`

- Default: `false`

Whether capture timing information for each module, same as the [profile](https://webpack.js.org/configuration/other-options/#profile) config of Webpack.

#### Example

```js
export default {
  performance: {
    profile: true,
  },
};
```

When turned on, webpack generates a JSON file with some statistics about the module that includes information about timing information for each module.
