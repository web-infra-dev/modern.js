- Type: `Object | Function | undefined`
- Default: `undefined`

You can enable or configure the [Webpack Inspector](https://github.com/modern-js-dev/webpack-inspector) through `tools.inspector`.

  When the configuration is not `undefined`, it means that `webpack-inspector` is enabled, and the type of `tools.inspector` can be `Object` or `Function`.

### Type

#### Object

When `tools.inspector` is configured with type `Object`, it is merged with the default configuration via Object.assign.  For example:

```js
export default {
  tools: {
    inspector: {
      // The default port is 3333
      port: 3334,
    },
  },
};
```

#### Function

When `tools.inspector` is of Function type, the default configuration is passed as the first parameter and can be directly modified or returned as the final result.  For example:

```js
export default {
  tools: {
    inspector(config) {
      config.port = 3334;
    },
  },
};
```
