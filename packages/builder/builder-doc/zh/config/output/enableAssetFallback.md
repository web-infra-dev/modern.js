- Type: `boolean`
- Default: `false`

开启该选项后，当编译过程中遇到无法识别的文件类型时，会直接将该文件直接输出到产物目录；否则会抛出一个异常。

#### 示例

```js
export default {
  output: {
    enableAssetFallback: true,
  },
};
```

注意：开启该配置会导致 webpack 配置中的 rules 结构变化，增加一层额外的 `oneOf` 嵌套结构。大多数情况下不推荐使用此配置。
