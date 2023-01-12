- Type: `number`
- Default: `8080`

设置 Dev Server 监听的端口号。

默认情况下，Dev Server 会监听 8080 端口，并在端口被占用时自动递增端口号。

#### 示例

将端口设置为 `3000`：

```ts
export default {
  dev: {
    port: 3000,
  },
};
```
