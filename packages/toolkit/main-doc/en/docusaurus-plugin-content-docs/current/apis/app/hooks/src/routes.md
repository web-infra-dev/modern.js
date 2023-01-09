---
title: routes/
sidebar_position: 2
---

The entry identifier when the application uses file system-based routing.

When the project structure is of type `Routes directory entry`, the files in the `src/routes` directory are parsed to get the client-side routing configuration. See [Routing by convention](/docs/guides/basic-features/routes) for more details on usage.

Any `layout.[tj]sx` and `page.[tj]sx` under `src/routes` will be used as a route to the application：

```bash {3}
.
└── routes
    ├── layout.tsx
    ├── page.tsx
    └── user
        ├── layout.tsx
        └── page.tsx
```

## basic example

The directory names in the `routes` directory will be used as a mapping of the route url, where `layout.tsx` is used as the layout component and `page.tsx` as the content component, which is a leaf node of the whole route, for example the following directory structure：

```bash
.
└── routes
    ├── page.tsx
    └── user
        └── page.tsx
```

The following two routes are produced:

- `/`
- `/user`

## Dynamic Route

If the directory name of the route file is named with `[]`, the generated route will be used as a dynamic route. For example, the following file directories:

```
└── routes
    ├── [id]
    │   └── page.tsx
    ├── blog
    │   └── page.tsx
    └── page.tsx
```

The `routes/[id]/page.tsx` file will be converted to a `/:id` route. All `/xxx` will match that route, except for the `/blog` route, which can be matched exactly.

In the component, you can get the corresponding parameters by [useParams](/docs/apis/app/runtime/router/#useparams).

In the loader, params will be used as input to [loader](/docs/guides/basic-features/data-fetch#loader-function), and the corresponding parameters can be retrieved through the property `params`.

## Layout component

As in the example below, you can add a common layout component for all routing components by adding `layout.tsx`

```bash
.
└── routes
    ├── layout.tsx
    ├── page.tsx
    └── user
        ├── layout.tsx
        └── page.tsx
```

You can represent child components in layout components by using `<Outlet>`:

```tsx title=routes/layout.tsx
import { Link, Outlet, useLoaderData } from '@modern-js/runtime/router';

export default () => {
  return (
    <>
      <Outlet></Outlet>
    </>
  );
};
```

:::note
`<Outlet>` is a new API in React Router 6, see [Outlet] for details(https://reactrouter.com/en/main/components/outlet#outlet).
:::
