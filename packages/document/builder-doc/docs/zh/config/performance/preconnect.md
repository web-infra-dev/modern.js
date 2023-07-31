- **类型：** `undefined | Array<string | PreconnectOption>`
```ts
interface PreconnectOption {
  href: string;
  crossorigin?: boolean;
}
```
- **默认值：** `undefined`

为哪些资源配置 [preconnect](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/rel/preconnect) 属性。

配置该属性会预先建立与服务器的连接，如果站点是 HTTPS 的，则此过程包括 DNS 解析，建立 TCP 连接以及执行 TLS 握手。将 Preconnect 和 DnsPrefetch 结合使用可进一步减少跨域请求的延迟。

### 示例

```js
export default {
  performance: {
    preconnect: ['http://xxx.com'],
  },
};
```
