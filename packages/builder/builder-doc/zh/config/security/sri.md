- **Type**:

```ts
type SRIOptions = {
  hashFuncNames?: []string;
  enabled?: "auto" | true | false;
  hashLoading?: "eager" | "lazy";
} | boolean;
```

- **Default**: `undefined`

使浏览器能够验证它获取子资源的完整性，以此防止下载的资源被篡改。

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
