- **类型：** `undefined | true | PreloadOption`
```ts
type IncludeType = 'async-chunks' | 'initial' | 'all-assets' | 'all-chunks';

type Filter = Array<string | RegExp> | ((filename: string) => boolean);

interface PreloadOption {
  type?: IncludeType;
  include?: Filter;
  exclude?: Filter;
}
```
- **默认值：** `undefined`

为哪些资源配置 [preload](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/rel/preload) 属性。

该属性通常用于配置当前导航下可能需要的资源，此时，浏览器通常以中等优先级（不是布局阻塞）获取此资源。

:::tip
在使用 Rspack 作为打包工具时，MPA 场景下暂不支持使用 Preload 能力。
:::

### Boolean 类型

当设置 `performance.preload` 为 `true`，将根据如下配置对资源进行预加载:

```js
{
  type: 'async-chunks',
}
```

### Object 类型

当 `performance.preload` 的值为 object 类型时，Builder 会根据当前配置对指定资源开启 preload 能力。

#### preload.type

`type` 字段控制了哪些资源会被预加载，同时支持通过 `include` 和 `exclude` 对指定资源进行二次过滤。

目前支持的资源类型如下：

- `async-chunks`: 预加载所有异步资源(当前页面)，包含异步 js 及其关联的 css、image、font 等资源。
- `initial`: 预加载所有非异步资源(当前页面)。需要注意的是，如果当前脚本已经被添加到 html 模版中，则不会进行额外的预加载。
- `all-chunks`: 预加载所有资源(当前页面)，包含所有异步和非异步资源。
- `all-assets`: 预加载所有资源，MPA 场景下会包含其他页面的资源。

#### 示例

当你希望对当前页面中所有 png 格式的图片资源进行预加载时，可以配置如下：

```js
export default {
  performance: {
    preload: {
      type: 'all-chunks',
      include: [/.*\.png$/]
    },
  },
};
```
