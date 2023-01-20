- **类型：**

```ts
type Fields = (string | string[])[];

type ResolveMainFields = Fields | Record<BuilderTarget, Fields>;
```

- **默认值：** `undefined`

该配置项将决定你使用 `package.json` 哪个字段导入 `npm` 模块。对应 webpack 的 [resolve.mainFields](https://webpack.js.org/configuration/resolve/#resolvemainfields) 配置。

### 示例

```js
export default {
  source: {
    resolveMainFields: ['main', 'browser', 'exports'],
  },
};
```

#### 根据产物类型设置

当你同时构建多种类型的产物时，你可以为不同的产物类型设置不同的 mainFields。此时，你需要把 `resolveMainFields` 设置为一个对象，对象的 key 为对应的产物类型。

比如为 `web` 和 `node` 设置不同的 mainFields：

```js
export default {
  output: {
    source: {
      resolveMainFields: {
        web: ['main', 'browser', 'exports'],
        node: ['main', 'node', 'exports'],
      },
    },
  },
};
```
