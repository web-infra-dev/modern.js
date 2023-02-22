- **Type:** `string`
- **Default:** `localhost`

Specify the host used by `devServer`,For example, if you want the server to be accessible externally, you can set it to:
```ts
export default {
  tools: {
    devServer: {
      host: '0.0.0.0'
    },
  },
};
```
