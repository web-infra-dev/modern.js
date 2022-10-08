- **Type**:

```ts
type SRIOptions = {
  hashFuncNames?: []string;
  enabled?: "auto" | true | false;
  hashLoading?: "eager" | "lazy";
} | boolean;
```

- **Default**: `undefined`

为 HTML 所引入的子资源添加完整性属性 (`integrity`)，使浏览器能够验证引入资源的完整性，以此防止下载的资源被篡改。

启动该选项后会将 Webpack [output.crossOriginLoading](https://webpack.docschina.org/configuration/output/#outputcrossoriginloading) 配置项设置为 `anonymous`。

关于子资源完整性的更多内容，可以查看 [Subresource Integrity - MDN](https://developer.mozilla.org/zh-CN/docs/Web/Security/Subresource_Integrity)。

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
