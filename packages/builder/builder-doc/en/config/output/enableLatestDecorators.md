- Type: `boolean`
- Default: `false`

By default, Builder uses the [legacy decorator proposal](https://github.com/wycats/javascript-decorators/blob/e1bf8d41bfa2591d949dd3bbf013514c8904b913/README.md) when compiling decorators.

When `output.enableLatestDecorators` is set to `true`, the Builder will compile with the [new decorator proposal](https://github.com/tc39/proposal-decorators/tree/7fa580b40f2c19c561511ea2c978e307ae689a1b) (version 2018-09).

```ts
export default {
  output: {
    enableLatestDecorators: true,
  },
};
```
