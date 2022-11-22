- Type: `'entry' | 'usage' | 'ua' | 'off'`
- Default: `'entry'`

通过 `output.polyfill` 你可以配置 Polyfill 的注入方式。

### 配置项

#### entry

当 `output.polyfill` 配置为 `'entry'` 时，会在每个入口文件中注入 Polyfill。

等价于 `@babel/preset-env` 的 `useBuiltIns: 'entry'` 配置。

#### usage

当 `output.polyfill` 配置为 `'usage'` 时，会在每个文件中根据代码中使用的 API 注入 Polyfill。

等价于 `@babel/preset-env` 的 `useBuiltIns: 'usage'` 配置。

#### ua

根据当前请求的 UA 信息，动态下发 Polyfill 代码。

#### off

不注入 Polyfill。使用此选项时，需要自行保证代码的兼容性。
