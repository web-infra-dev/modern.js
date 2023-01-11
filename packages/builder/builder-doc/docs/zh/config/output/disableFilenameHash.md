- Type: `boolean`
- Default: `false`

移除生产环境的构建产物名称中的 hash 值。

在生产环境构建后，会自动在文件名中间添加 hash 值，如果不需要添加，可以通过 `output.disableFilenameHash` 配置来禁用该行为。

#### 示例

默认情况下，构建后的产物名称为：

```bash
File                                     Size         Gzipped
dist/static/css/187.7879e19d.css         126.99 KB    9.17 KB
dist/static/js/main.18a568e5.js          2.24 KB      922 B
```

添加 `output.disableFilenameHash` 配置：

```js
export default {
  output: {
    disableFilenameHash: true,
  },
};
```

重新构建，产物的名称变为：

```bash
File                            Size         Gzipped
dist/static/css/187.css         126.99 KB    9.17 KB
dist/static/js/main.js          2.24 KB      922 B
```
