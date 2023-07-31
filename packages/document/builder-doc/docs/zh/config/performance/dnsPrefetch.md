- **类型：** `undefined | string[]`

- **默认值：** `undefined`

为哪些资源配置 [dns-prefetch](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/rel/dns-prefetch) 属性。

配置该属性可以在请求资源之前解析域名，降低请求延迟，提升加载性能。

更多信息可参考：[Using dns-prefetch](https://developer.mozilla.org/en-US/docs/Web/Performance/dns-prefetch)

### 示例

```js
export default {
  performance: {
    dnsPrefetch: ['http://xxx.com'],
  },
};
```
