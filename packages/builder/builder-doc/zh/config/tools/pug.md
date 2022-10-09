- Type: `true | Object | Function | undefined`
- Default: `false`

配置 [Pug](https://pugjs.org/) 模板引擎。

### Boolean 类型

Builder 默认不启用 Pug 模板引擎，你可以将 `tools.pug` 设置为 `true` 来启用它。

```ts
export default {
  tools: {
    pug: true,
  },
};
```

启用后，你可以在 `html.template` 中指定使用 `index.pug` 作为模板文件。

### Object 类型

当 `tools.terser` 配置为 `Object` 类型时，可以配置 Pug 模板引擎的选项：

```ts
export default {
  tools: {
    pug: {
      doctype: 'xml',
    },
  },
};
```

详细参数请查看 [Pug API Reference](https://pugjs.org/api/reference.html#options)。

### Function 类型

当 `tools.pug` 配置为 `Function` 类型时，默认配置作为第一个参数传入，可以直接修改配置对象，也可以返回一个值作为最终结果。

```ts
export default {
  tools: {
    pug(config) {
      config.doctype = 'xml';
    },
  },
};
```
