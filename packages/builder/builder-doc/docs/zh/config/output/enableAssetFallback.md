- **类型：** `boolean`
- **默认值：** `false`

开启该选项后，当编译过程中遇到无法识别的文件类型时，会直接将该文件直接输出到产物目录；否则会抛出一个异常。

### 示例

开启配置项：

```js
export default {
  output: {
    enableAssetFallback: true,
  },
};
```

在代码中引用一个未知类型的模块：

```js
import './foo.xxx';
```

编译后，`foo.xxx` 会被自动输出到 `dist/static/media` 目录下。

你可以通过 `output.distPath.media` 和 `output.filename.media` 配置项来控制 fallback 后的输出路径和文件名称。

:::tip
开启该配置会导致 webpack 配置中的 rules 结构变化，增加一层额外的 `oneOf` 嵌套结构。大多数情况下，我们不推荐你使用此配置。
:::
