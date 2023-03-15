获取归一化后的 Builder 配置，该方法必须在 `modifyBuilderConfig` 钩子执行完成后才能被调用。

相较于 `getBuilderConfig` 方法，该方法返回的配置经过了归一化处理，配置的类型定义会得到收敛，比如 `config.html` 的 `undefined` 类型将被移除。

推荐优先使用该方法获取配置。

- **类型**

```ts
function GetNormalizedConfig(): Readonly<NormalizedConfig>;
```
