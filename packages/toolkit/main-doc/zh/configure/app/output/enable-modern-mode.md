---
sidebar_label: enableModernMode
---

# output.enableModernMode

* 类型： `boolean`
* 默认值：`false`

Modern.js 默认值构建针对旧版浏览器带有 Polyfill 的 JS 产物，开启该配置后，可以在生产环境会自动构建出针对现代浏览器语法未降级的 JS 产物，产物文件名格式为 `[name].[hash]-es6/js`。

例如配置如下配置：

```ts title="modern.config.ts"
import { defineConfig } from '@modern-js/app-tools';

export default defineConfig({
  output: {
    enableModernMode: true,
  },
});
```

执行 `build` 命令后，除了正常的 Client 打包外， 还进行了 Modern 的打包，并且 `dist/static/js` 目录会生成 es6 相关产物。

![](https://lf3-static.bytednsdoc.com/obj/eden-cn/zq-uylkvT/ljhwZthlaukjlkulzlp/output-enable-modern-build.jpeg)

执行 start 命令后，使用最新版本 Chrome 浏览器访问，观察 Network 中请求的 JS 资源为 es6 产物。

![](https://lf3-static.bytednsdoc.com/obj/eden-cn/zq-uylkvT/ljhwZthlaukjlkulzlp/output-enable-modern-network.jpeg)

:::info
更多内容可以查看[客户端兼容性](/docs/guides/advanced-features/compatibility)。
:::
