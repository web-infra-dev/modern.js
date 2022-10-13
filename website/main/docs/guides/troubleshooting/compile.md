---
sidebar_position: 1
---

# 编译构建问题

### 如何配置 SRI 校验？

在 Modern.js 中，需要自主引入社区中的 [webpack-subresource-integrity](https://github.com/waysact/webpack-subresource-integrity) 插件来开启 SRI 校验。

配置 [webpack-subresource-integrity](https://github.com/waysact/webpack-subresource-integrity) 的示例如下：

```js title="modern.config.js"
import { defineConfig } from '@modern-js/app-tools';
import { SubresourceIntegrityPlugin } from 'webpack-subresource-integrity';

export default defineConfig({
  tools: {
    webpackChain(chain) {
      chain.output.crossOriginLoading('anonymous');
      chain.plugin('subresource-integrity').use(SubresourceIntegrityPlugin);
    },
  },
});
```

:::info SRI
子资源完整性 Subresource Integrity（SRI）是专门用来校验资源的一种方案，它读取资源标签中的 integrity 属性，将其中的信息摘要值，和资源实际的信息摘要值进行对比，如果发现无法匹配，那么浏览器就会拒绝执行资源。

对于 script 标签来说，结果为拒绝执行其中的代码；对于 CSS link 来说，结果为不加载其中的样式。
:::

---

---

---

---

---



---

---

---

---

---
