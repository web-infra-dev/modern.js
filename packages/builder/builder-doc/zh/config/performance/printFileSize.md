- Type: `boolean`
- Default: `true`

是否在生产环境构建后输出所有静态资源文件的体积。

```bash
info    File sizes after production build:

  File                                     Size         Gzipped
  dist/static/js/lib-corejs.1c836fe7.js    212.89 kB    66.57 kB
  dist/static/js/lib-react.fcafbc5c.js     134.65 kB    43.45 kB
  dist/static/js/main.6ff06f70.js          8.93 kB      3.73 kB
  dist/static/css/main.9f48031b.css        2.64 kB      927 B
  dist/html/main/index.html                1.64 kB      874 B
```

#### 示例

禁用相关日志：

```ts
export default {
  performance: {
    printFileSize: false,
  },
};
```
