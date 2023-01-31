- **类型：** `string | Record<BuilderTarget, string>`
- **默认值：** `undefined`

用于为 [resolve.extensions](https://webpack.js.org/configuration/resolve/#resolveextensions) 添加统一的前缀。

如果多个文件拥有相同的名称，但具有不同的文件后缀，Builder 会根据 extensions 数组的顺序进行识别，解析数组中第一个被识别的文件，并跳过其余文件。

### 示例

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

#### 根据产物类型设置

当你同时构建多种类型的产物时，你可以为不同的产物类型设置不同的 extension 前缀。此时，你需要把 `resolveExtensionPrefix` 设置为一个对象，对象的 key 为对应的产物类型。

比如为 `web` 和 `node` 设置不同的 extension 前缀：

```js
export default {
  output: {
    source: {
      resolveExtensionPrefix: {
        web: '.web',
        node: '.node',
      },
    },
  },
};
```

在代码中 `import './foo'` 时，对于 node 产物，会优先识别 `foo.node.js` 文件，而对于 web 产物，则会优先识别 `foo.web.js` 文件。
