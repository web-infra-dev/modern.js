---
title: 添加 Loader
---

上一章节中，我们学习了如何添加客户端路由。

这一章节中，我们将会学习如何为**路由组件添加 Loader**。

到目前为止，我们都是通过硬编码的方式，为组件提供数据。如果要从远端获取数据，通常情况下会使用 `useEffect` 来做。但在启用 SSR 的情况下，`useEffect` 是不会在服务端执行的，所以这种 SSR 只能渲染很有限的 UI。

Modern.js 为提供了 Data Loader 的能力，支持同构的在组件中获取数据，让 SSR 的价值最大化。

下面我们演示如何为路由组件添加 Data Loader，并模拟远端数据获取。我们使用 faker 来 mock 需要的数据，首先安装依赖：

```bash
pnpm add faker@5
pnpm add @types/faker@5 -D
```

创建 `src/routes/page.loader.ts`：

```tsx
import { name, internet } from 'faker';

type LoaderData = {
  code: number;
  data: {
    name: string;
    avatar: string;
    email: string;
  }[];
};

export default async (): Promise<LoaderData> => {
  const data = new Array(20).fill(0).map(() => {
    const firstName = name.firstName();
    return {
      name: firstName,
      avatar: `https://avatars.dicebear.com/api/identicon/${firstName}.svg`,
      email: internet.email(),
    };
  });

  return {
    code: 200,
    data,
  };
};
```

:::note
Data Loader 并非只为 SSR 工作。在 CSR 项目中，Data Loader 也可以避免数据获取依赖 UI 渲染，解决请求瀑布流的问题。未来，Modern.js 也会为这一特性添加更多能力，例如预获取、数据缓存等。
:::

Modern.js 也提供了一个叫 `useLoaderData` 的 hooks API，我们修改 `src/routes/page.tsx` 导出的组件：

```tsx {1,4,13}
import { useLoaderData } from '@modern-js/runtime/router';

function Index() {
  const { data } = useLoaderData() as LoaderData;

  return (
    <div className="container lg mx-auto">
      <Helmet>
        <title>All</title>
      </Helmet>
      <List
        dataSource={data}
        renderItem={info => <Item key={info.name} info={info} />}
      />
    </div>
  );
}

export default Index;
```

<!-- Todo 重新截图，SSR 内容 -->

重新执行 `pnpm run dev`，查看 `view-source:http://localhost:8080/`，或在 devtools 的 Network 面板里查看 HTML 请求的「 Preview 」，可以看到 SSR 渲染出来的 HTML 已经包含完整的 UI：

![display6](https://lf3-static.bytednsdoc.com/obj/eden-cn/aphqeh7uhohpquloj/modern-js/docs/11/display6.png)
