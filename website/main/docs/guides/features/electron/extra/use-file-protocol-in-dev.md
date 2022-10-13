---
sidebar_position: 5
---

# 开发环境采用文件协议加载页面
在默认情况下，开发环境时渲染进程均是采用：[webpack-dev-server](https://github.com/webpack/webpack-dev-server) 启动，因此加载的均是：http 协议，但不排除有些业务场景，
需要使用文件协议。因此，下面会讲述如何在 dev 时候使用文件协议。

### 窗口配置

在窗口配置中给对应窗口配置：`useFileProtocolInDev: true`。

```ts
export const windowsConfig: WindowConfig[] = [
  {
    name: 'main',
    useFileProtocolInDev: true,
    ...
  },
]
```
:::warning 警告
如果设置了 `useFileProtocolInDev` 且配置了 `loadUrl` 为 http(s) 地址，则 `useFileProtocolInDev` 会失效。
:::

### 编译配置

增加编译配置，告诉 Modern.js 在编译的时候，将路由的处理，改为 **哈希路由**。

在 `modern.config.js` 中, 将 `supportHtml5History` 始终设置为 `false` 即可。

```ts
export default defineConfig({
  runtime: {
    router: {
      supportHtml5History: false,
    },
  },
}
```
