# 热更新问题

### 热更新不生效，如何排查？

热更新不生效有很多种可能的原因，在这篇文档中会介绍大部分常见的原因，你可以参照以下内容进行排查。

在开始排查之前，请简单了解一下热更新的原理：

:::tip 热更新原理

1. 浏览器和开发服务器建立一个 Web Socket 连接，用于实时通信。
2. 当开发服务器每次重新编译完成后，会通过 Web Socket 通知浏览器，浏览器向开发服务器发送 `hot-update.xxx` 请求，从而加载编译后的新模块。
3. 当浏览器收到新的模块后，如果是 React 项目，则会通过 React 官方的 React Refresh 来更新 React 组件，其他框架也是类似。

:::

了解完热更新的原理后，你可以按照以下步骤来进行基本的排查：

#### 1. 检查 Web Socket 连接

打开浏览器的控制台，查看是否有 `[HMR] connected.` 日志。

- 如果有，说明 Web Socket 连接正常，请继续检查后续步骤。
- 如果没有，请打开 Chrome 的 Network 面板，查看 `ws://[host]:[port]/webpack-hmr` 的请求状态，若请求异常，说明热更新失败的原因是 Web Socket 请求没有建立成功。

Web Socket 请求没有建立成功的原因可能有很多种，例如开启了网络代理，导致 Web Socket 请求没有正确发送到开发服务器。你可以检查 Web Socket 请求的地址是否为你的开发服务器地址，如果不是，则可以通过 [tools.devServer.client](/api/config-tools.html#client) 来配置 Web Socket 请求的地址。

#### 2. 检查 hot-update 请求

当你修改一个模块的代码，并触发重新编译后，浏览器会向开发服务器发送若干个 `hot-update.json` 和 `hot-update.js` 请求，用于获取更新后的代码。

你可以尝试修改一个模块并检查 `hot-update.xxx` 请求的内容，如果请求的内容是最新的代码，说明热更新的请求正常。

如果请求的内容错误，大概率也是由于开启了网络代理，请检查 `hot-update.xxx` 请求的地址是否为你的开发服务器地址，如果不是，则需要调整代理规则，将 `hot-update.xxx` 请求代理到开发服务器地址。

#### 3. 检查其他原因

如果以上两个步骤都没有问题，那么可能是其他原因导致的热更新失败，比如没有符合 React 对热更新的要求，你可以参考下列的问题进行排查。

---

### 打包时 external React 后，热更新不生效？

为了保证热更新生效，我们需要使用 React 和 ReactDOM 的开发环境产物。

当你将 React 通过 externals 排除后，通常会通过 CDN 等方式注入 React 的生产环境产物，所以热更新会不生效。

```js
export default {
  output: {
    externals: {
      react: 'React',
      'react-dom': 'ReactDOM',
    },
  },
};
```

为了解决该问题，你需要引用 React 的开发环境产物，或者在开发环境下不配置 `externals`。

如果你不确定当前使用的 React 产物类型，可以参考：[React 官方文档 - Use the Production Build](https://legacy.reactjs.org/docs/optimizing-performance.html#use-the-production-build)

---

### 开发环境设置文件名的 hash 后，热更新不生效？

通常来说，我们只会在生产环境下设置文件名的 hash 值（即 `process.env.NODE_ENV === 'production'` 时）。

如果你在开发环境下设置了文件名的 hash，那么可能会导致热更新不生效（尤其是 CSS 文件）。这是因为每次文件内容变化时，都会引起 hash 变化，导致 [mini-css-extract-plugin](https://www.npmjs.com/package/mini-css-extract-plugin) 等工具无法读取到最新的文件内容。

- 正确用法：

```js
export default {
  output: {
    filename: {
      css:
        process.env.NODE_ENV === 'production'
          ? '[name].[contenthash:8].css'
          : '[name].css',
    },
  },
};
```

- 错误用法：

```js
export default {
  output: {
    filename: {
      css: '[name].[contenthash:8].css',
    },
  },
};
```

---

### React 组件的热更新无法生效？

Builder 使用 React 官方的 [Fast Refresh](https://github.com/pmmmwh/react-refresh-webpack-plugin) 能力来进行组件热更新。

如果出现 React 组件的热更新无法生效的问题，或者是热更新后 React 组件的 state 丢失，这通常是因为你的 React 组件使用了匿名函数。在 React Fast Refresh 的官方实践中，要求组件不能为匿名函数，否则热更新后无法保留 React 组件的 state。

以下是一些错误用法的例子：

```tsx
// 错误写法 1
export default function () {
  return <div>Hello World</div>;
}

// 错误写法 2
export default () => <div>Hello World</div>;
```

正确用法是给每个组件函数声明一个名称：

```tsx
// 正确写法 1
export default function MyComponent() {
  return <div>Hello World</div>;
}

// 正确写法 2
const MyComponent = () => <div>Hello World</div>;

export default MyComponent;
```

---

### 开启 https 后，热更新不生效？

当开启 https 时，由于证书的问题，可能会出现 HMR 连接失败的情况，此时打开控制台，会出现 HMR connect failed 的报错。

![hmr-connect-error-0](https://lf3-static.bytednsdoc.com/obj/eden-cn/6221eh7uhbfvhn/modern/img_v2_2f90d027-a232-4bd8-8021-dac3c651682g.jpg)

此问题的解决方法为：点击 Chrome 浏览器问题页面的「高级」->「继续前往 xxx（不安全）」。

![hmr-connect-error-1](https://lf3-static.bytednsdoc.com/obj/eden-cn/6221eh7uhbfvhn/modern/59b37606-52ad-4886-a423-af2edaa49245.png)

> Tips: 当通过 Localhost 访问页面时，「您的连接不是私密连接」字样可能不会出现，可访问 Network 域名进行处理。
