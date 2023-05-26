- **类型：** `boolean`
- **默认值：** `false`

是否禁用编译过程中的 TypeScript 类型检查。

默认情况下，Builder 执行构建的过程中，会在一个独立的进程里运行 TypeScript 类型检查工具，它的检查逻辑与 TypeScript 原生的 `tsc` 命令一致，你可以通过 `tsconfig.json` 或是 Builder 的 `tools.tsChecker` 配置项来自定义检查行为。

### 阻塞编译

- 在开发环境构建时，类型错误不会阻塞编译流程。
- 在生产环境构建时，类型错误会导致构建失败，以保证生产环境代码的稳定性。

### 示例

禁用 TypeScript 类型检查：

```js
export default {
  output: {
    disableTsChecker: true,
  },
};
```

禁用开发环境构建时的类型检查：

```js
export default {
  output: {
    disableTsChecker: process.env.NODE_ENV === 'development',
  },
};
```

禁用生产环境构建时的类型检查：

```js
export default {
  output: {
    disableTsChecker: process.env.NODE_ENV === 'production',
  },
};
```

:::tip
不建议在生产环境构建时禁用类型检查，这会导致线上代码的稳定性下降，请谨慎使用。
:::
