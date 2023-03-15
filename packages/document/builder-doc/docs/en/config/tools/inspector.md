- **Type:** `Object | Function | undefined`
- **Default:** `undefined`
- **Bundler:** `only support webpack`

You can enable or configure the [webpack inspector](https://github.com/web-infra-dev/webpack-inspector) through `tools.inspector`.

When the configuration is not `undefined`, it means that `webpack-inspector` is enabled, and the type of `tools.inspector` can be `Object` or `Function`.

### Object Type

When `tools.inspector` is configured with type `Object`, it is merged with the default configuration via Object.assign. For example:

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

### Function Type

When `tools.inspector` is a Function, the default configuration is passed as the first parameter and can be directly modified or returned as the final result. For example:

```js
export default {
  tools: {
    inspector(config) {
      config.port = 3334;
    },
  },
};
```
