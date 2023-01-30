- **类型**: `boolean | Syntax`

```ts
interface Syntax {
  targets: string[];
}
```

- **默认值**: `false`

分析生成产物中是否存在指定环境中不兼容的高级语法。如果存在，会将详细信息打印在终端。

### 示例

```ts
export default {
  security: {
    checkSyntax: true,
  },
};
```

如果将 `security.checkSyntax` 指定为 `true` 的话，则 targets 会被认定为项目设定的 browserslist。详情请参考 [设置浏览器范围](http://edenx.bytedance.net/builder/zh/guide/advanced/browserslist.html)

开启后将在生产环境下进行检测，当检测到不兼容的高级语法后除了会将信息打印在终端的同时还会退出运行程序。
