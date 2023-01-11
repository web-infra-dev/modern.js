- **Type**:

```ts
type SRIOptions = {
  hashFuncNames?: []string;
  enabled?: "auto" | true | false;
  hashLoading?: "eager" | "lazy";
} | boolean;
```

- **Default**: `undefined`

为 HTML 所引入的子资源添加完整性属性 —— `integrity`，使浏览器能够验证引入资源的完整性，以此防止下载的资源被篡改。

启动该选项后会将 webpack 的 [output.crossOriginLoading](https://webpack.docschina.org/configuration/output/#outputcrossoriginloading) 配置项设置为 `anonymous`。

#### SRI 介绍

子资源完整性 Subresource Integrity（SRI）是专门用来校验资源的一种方案，它读取资源标签中的 integrity 属性，将其中的信息摘要值，和资源实际的信息摘要值进行对比，如果发现无法匹配，那么浏览器就会拒绝执行资源。

对于 script 标签来说，结果为拒绝执行其中的代码；对于 CSS link 来说，结果为不加载其中的样式。

关于 SRI 的更多内容，可以查看 [Subresource Integrity - MDN](https://developer.mozilla.org/zh-CN/docs/Web/Security/Subresource_Integrity)。

#### 示例

默认情况下，不会开启 `SRI`，当开启之后它的默认配置如下：

```js
{
  hashFuncNames: ['sha384'];
  enabled: "auto",
  hashLoading: "eager",
}
```

你可以按照你自己的需求自定义配置项:

```js
export default {
  security: {
    sri: {
      hashFuncNames: ['sha-256'],
      enabled: true,
      hashLoading: 'lazy',
    },
  },
};
```
