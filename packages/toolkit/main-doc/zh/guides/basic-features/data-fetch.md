---
title: 数据获取
sidebar_position: 3
---

Modern.js 中提供了开箱即用的数据获取能力，开发者可以通过这些 API，在 CSR 和 SSR 环境同构的进行开发。

需要注意的是，这些 API 并不帮助应用发起请求，而是帮助开发者更好的管理数据与路由的关系。

## useLoader（旧版）

**`useLoader`** 是 Modern.js 老版本中的 API。该 API 是一个 React Hook，专门提供给 SSR 应用使用，让开发者能同构的在组件中获取数据。

:::tip
CSR 的项目没有必要使用 `useLoader` 获取数据。
:::

以下是一个最简单的例子：

```tsx
import { useLoader } from '@modern-js/runtime';

export default () => {
  const { data } = useLoader(async () => {
    console.log('fetch in useLoader');

    // 这里没有发送真实的请求，只是返回了一个写死的数据。
    // 真实项目中，应该返回从远端获取的数据。
    return {
      name: 'modern.js',
    };
  });

  return <div>Hello, {data?.name}</div>;
};
```

上述代码启动后，访问页面。可以看到在终端输出了日志，而在浏览器终端却没有打印日志。

这是因为 Modern.js 在服务端渲染时，在会收集 `useLoader` 返回的数据，并将数据注入到响应的 HTML 中。如果 SSR 渲染成功，在 HTML 中可以看到如下代码片段：

```html
<script>
window._SSR_DATA = {};
</script>
```

在这全局变量中，记录了每一份数据，而在浏览器端渲染的过程中，会优先使用这份数据。如果数据不存在，则会重新执行 `useLoader` 函数。

:::note
在构建阶段，Modern.js 会自动为每个 `useLoader` 生成一个 Loader ID，并注入到 SSR 和 CSR 的 JS Bundle 中，用来关联 Loader 和数据。
:::

相比于 Next.js 中的 `getServerSideProps`，在渲染前预先获取数据。使用 `useLoader`，可以在组件中获取局部 UI 所需要的数据，而不用将数据层层传递。同样，也不会因为不同路由需要不同数据请求，而在最外层的数据获取函数中添加冗余的逻辑。当然 `useLoader` 也存在一些问题，例如服务端代码 Treeshaking 困难，服务端需要多一次预渲染等。

Modern.js 在新版本中，设计了全新的 Loader 方案。新方案解决了这些问题，并能够配合**嵌套路由**，对页面性能做优化。

:::note
详细 API 可以查看 [useLoader](/docs/apis/app/runtime/core/use-loader)。
:::
## Route Loader

:::note
敬请期待
:::
