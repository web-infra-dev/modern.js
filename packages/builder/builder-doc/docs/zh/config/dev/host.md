- **类型：** `string`
- **默认值：** `localhost`

指明 `devServer` 使用的 host，例如想使 server 被外部访问，可以设置为:
```ts
export default {
  dev: {
    host: '0.0.0.0'
  }
};
```
