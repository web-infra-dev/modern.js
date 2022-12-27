---
title: routes/
sidebar_position: 2
---

应用使用基于文件系统路由时的入口标识。

当项目结构为 `Routes 入口` 类型时， 会分析 `src/routes` 目录下的文件得到客户端路由配置。具体用法请查看[约定式路由](/docs/guides/basic-features/routes)

任何在 `src/routes` 下的 `layout.[tj]sx` 和 `page.[tj]sx` 都会作为应用的路由：
```bash {3}
.
└── routes
    ├── layout.tsx
    ├── page.tsx
    └── user
        ├── layout.tsx
        └── page.tsx
```

## 基本示例

`routes` 目录下的目录名会作为路由 url 的映射，其中 `layout.tsx` 中作为布局组件，`page.tsx` 作为内容组件，是整条路由的叶子节点，例如以下目录结构：

```bash
.
└── routes
    ├── page.tsx
    └── user
        └── page.tsx
```

会产出下面两条路由：
- `/`
- `/user`

## 动态路由

如果路由文件的目录名以 `[]` 命名，生成的路由会作为动态路由。例如以下文件目录：
```
└── routes
    ├── [id]
    │   └── page.tsx
    ├── blog
    │   └── page.tsx
    └── page.tsx
```

`routes/[id]/page.tsx` 文件会转为 `/:id` 路由。除了可以确切匹配的 `/blog` 路由，其他所有 `/xxx` 都会匹配到该路由。

在组件中，可以通过 [useParams](/docs/apis/app/runtime/router/#useparams) 获取对应命名的参数。

在 loader 中，params 会作为 [loader](/docs/guides/basic-features/data-fetch#loader-函数) 的入参，通过 `params` 的属性可以获取到对应的参数。


## 布局组件

如下面的例子，可以通过添加 `layout.tsx`，为所有路由组件添加公共的布局组件：

```bash
.
└── routes
    ├── layout.tsx
    ├── page.tsx
    └── user
        ├── layout.tsx
        └── page.tsx
```

在布局组件中可以通过使用 `<Outlet>` 表示子组件：
```tsx title=routes/layout.tsx
import { Link, Outlet, useLoaderData } from '@modern-js/runtime/router';

export default () => {
  return (
    <>
      <Outlet></Outlet>
    </>
  )
}
```

:::note
`<Outlet>` 是 React Router 6 中新的 API，详情可以查看 [Outlet](https://reactrouter.com/en/main/components/outlet#outlet).
:::




