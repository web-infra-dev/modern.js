- **Type:** `true | Object | Function | undefined`
- **Default:** `false`
- **Bundler:** `only support webpack`

Configure the [Pug](https://pugjs.org/) template engine.

### Boolean Type

Pug template engine is not enabled by default, you can enable it by setting `tools.pug` to `true`.

```ts
export default {
  tools: {
    pug: true,
  },
};
```

When enabled, you can use `index.pug` as the template file in `html.template` config.

### Object Type

When `tools.terser` is `Object` type, you can passing the Pug options:

```ts
export default {
  tools: {
    pug: {
      doctype: 'xml',
    },
  },
};
```

For detailed options, please refer to [Pug API Reference](https://pugjs.org/api/reference.html#options).

### Function Type

When `tools.pug` is `Function` type, the default configuration is passed in as the first parameter, the configuration object can be modified directly, or a value can be returned as the final result.

```ts
export default {
  tools: {
    pug(config) {
      config.doctype = 'xml';
    },
  },
};
```
