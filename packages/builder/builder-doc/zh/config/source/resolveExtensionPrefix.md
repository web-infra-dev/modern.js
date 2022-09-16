- Type: `string`
- Default: `undefined`

用于为 resolve 的 extensions 添加统一的前缀。

如果多个文件拥有相同的名称，但具有不同的文件后缀，Builder 会根据 extensions 数组的顺序进行识别，解析数组中第一个被识别的文件，并跳过其余文件。

#### 示例

下面是配置 `.web` 前缀的例子。

```js
export default {
  source: {
    resolveExtensionPrefix: '.web',
  },
};
```

配置完成后，extensions 数组会发生以下变化：

```js
// 配置前
const extensions = ['.js', '.ts', ...];

// 配置后
const extensions = ['.web.js', '.js', '.web.ts' , '.ts', ...];
```

在代码中 `import './foo'` 时，会优先识别 `foo.web.js` 文件，再识别 `foo.js` 文件。
