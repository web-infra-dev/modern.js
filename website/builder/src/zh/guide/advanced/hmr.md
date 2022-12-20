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

## Live reloading 和 Hot reloading 的区别

- Live reloading: 修改文件之后，webpack 重新编译，并强制刷新浏览器，属于全局（整个应用）刷新，相当于 window.location.reload()；
- Hot reloading: 修改文件之后，webpack 重新编译对应模块，刷新时可以记住应用的状态，从而做到局部刷新，即热更新。

DevServer 提供了 [hot](/zh/api/config-tools.html#hot) 和 [liveReload](/zh/api/config-tools.html#livereload) 这两个配置项来控制更新方式。当 hot 和 liveReload 同时开启时，DevServer 会优先尝试使用 hot 模式 (HMR)，如果 HMR 更新失败后，会降级到重新加载页面。

## 常见问题

### External react/reactDom 后，热更新不生效？

热更新能力生效需要用到 react 和 react-dom 的 development 模式， 而 CDN 上的 react 通常使用 production 模式。你需要切换到开发模式，或者在开发环境下不配置 external。

如果不确定你当前使用的 React 模式，你可以参考：[检查 React 模式](https://reactjs.org/docs/optimizing-performance.html#use-the-production-build)

### 开启 https 后，热更新不生效？

当开启 https 时，由于证书的问题，会出现 HMR 连接失败的情况，此时打开控制台，会出现 HMR connect failed 的报错。

![hmr-connect-error-0](https://lf3-static.bytednsdoc.com/obj/eden-cn/6221eh7uhbfvhn/modern/img_v2_2f90d027-a232-4bd8-8021-dac3c651682g.jpg)

此问题的解决方法为：点击 Chrome 浏览器问题页面的「高级」->「继续前往 xxx（不安全）」。

![hmr-connect-error-1](https://lf3-static.bytednsdoc.com/obj/eden-cn/6221eh7uhbfvhn/modern/59b37606-52ad-4886-a423-af2edaa49245.png)

> Tips: 当通过 Localhost 访问页面时，「您的连接不是私密连接」字样可能不会出现，可访问 Network 域名进行处理。

### 热更新后 React 组件的 state 丢失？

Builder 使用 React 官方的 [Fast Refresh](https://github.com/pmmmwh/react-refresh-webpack-plugin) 能力来进行组件热更新。

在使用 Fast Refresh 时，要求组件不能为匿名函数，否则热更新后无法保留 React 组件的 state。

以下写法都是不正确的：

```js
// 错误写法 1
export default function () {
  return <div>Hello World</div>;
}

// 错误写法 2
export default () => <div>Hello World</div>;
```

正确的写法为：

```js
// 正确写法 1
export default function MyComponent() {
  return <div>Hello World</div>;
}

// 正确写法 2
const MyComponent = () => <div>Hello World</div>

export default MyComponent;
```
