# 热更新问题

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
