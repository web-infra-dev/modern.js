- **类型：** `boolean`
- **默认值：** `false`

是否要使用 [新版 decorator 提案](https://github.com/tc39/proposal-decorators/tree/7fa580b40f2c19c561511ea2c978e307ae689a1b) 进行编译。

默认情况下，Builder 在编译装饰器时采用 [旧版 decorator 提案](https://github.com/wycats/javascript-decorators/blob/e1bf8d41bfa2591d949dd3bbf013514c8904b913/README.md)。

将 `output.enableLatestDecorators` 设置为 `true` 时，Builder 会采用新版 decorator 提案 (2018-09 版本) 进行编译。

:::warning
**Deprecated**：该配置已废弃，请使用 `source.decorators` 配置项代替。
:::

```ts
export default {
  output: {
    enableLatestDecorators: true,
  },
};
```
