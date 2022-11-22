- Type: `boolean | ConsoleType[]`
- Default: `false`

在生产环境构建时，是否自动移除代码中的 `console.xx`。

#### 移除所有 console

当 `removeConsole` 被设置为 `true` 时，会移除所有类型的 `console.xx`：

```ts
export default {
  performance: {
    removeConsole: true,
  },
};
```

#### 移除特定的 console

你也可以指定仅移除特定类型的 `console.xx`，比如移除 `console.log` 和 `console.warn`：

```ts
export default {
  performance: {
    removeConsole: ['log', 'warn'],
  },
};
```

目前支持配置以下类型的 console：

```ts
type ConsoleType = 'log' | 'info' | 'warn' | 'error' | 'table' | 'group';
```
