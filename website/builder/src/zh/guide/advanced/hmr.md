# 模块热替换

模块热替换(hot module replacement 或 HMR) 允许在运行时更新所有类型的模块，而无需完全刷新。

## 启用 HMR

Builder 已内置了对 HMR 的支持，开发环境下默认启用。
可通过将 `dev.hmr` 设置为 false，关闭 HMR 能力，此时将不再提供热更新和 react-refresh 功能。

```ts
export default {
  dev: {
    hmr: false,
  },
};
```

## 自定义 HMR URL

Builder 默认使用 local-ip 和当前端口号拼接 HMR 客户端的 URL，当出现连接失败的情况，可以通过自定义配置的方式指定可用的 URL。

例如，通过将 host 和 path 设置为空将根据当前客户端情况自动推导 HMR 客户端 URL：

```ts
export default {
  tools: {
    devServer: {
      client: {
        port: '',
        host: '',
      },
    },
  },
};
```

## 常见问题

### External react/reactDom 后，热更新不生效？

热更新能力生效需要用到 react 和 react-dom 的 development 模式， 而 CDN 上的 react 通常使用 production 模式。你需要切换到开发模式，或者在开发环境下不配置 external。

如果不确定你当前使用的 React 模式，你可以参考：[检查 React 模式](https://reactjs.org/docs/optimizing-performance.html#use-the-production-build)
