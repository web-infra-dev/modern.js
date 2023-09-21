- **类型：** `boolean`
- **默认值：** `true`

是否在生产环境构建后输出所有静态资源文件的体积。

```bash
info    Production file sizes:

  File                                      Size         Gzipped
  dist/static/js/lib-react.09721b5c.js      152.6 kB     49.0 kB
  dist/html/main/index.html                 5.8 kB       2.5 kB
  dist/static/js/main.3568a38e.js           3.5 kB       1.4 kB
  dist/static/css/main.03221f72.css         1.4 kB       741 B
```

### 示例

禁用相关日志：

```ts
export default {
  performance: {
    printFileSize: false,
  },
};
```
