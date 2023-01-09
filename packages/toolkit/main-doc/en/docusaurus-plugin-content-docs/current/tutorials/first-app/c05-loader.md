---
title: Add Loader
---

In the previous chapter, we learned how to add client route.

In this chapter, we will learn how to add **Loader** to the routing component.

By far, we have provided data to components through hardcoding. If you want to get data from the remote, you usually use `useEffect` to do it. But when SSR is enabled, `useEffect` will not be executed at the server level, so this SSR can only render a very limited UI.

Modern.js provides the ability of Data Loader to support homogeneous data acquisition in components to maximize the value of SSR.

Below we demonstrate how to add Data Loader to the routing component and simulate remote data acquisition. We use faker to mock the required data, first install dependency:

```bash
pnpm add faker@5
pnpm add @types/faker@5 -D
```

Modify `src/routes/page.tsx`:

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

export const loader = async (): Promise<LoaderData> => {
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
Data Loader doesn't just work for SSR. In CSR projects, Data Loader can also avoid data acquisition dependency UI rendering, which solves the problem of requesting dynamic grid layout. In the future, Modern.js will also add more capabilities to this feature, such as pre-fetching, data caching, etc.
:::

Modern.js also provides a hooks API called `useLoaderData`, we modify the exported component of `src/routes/page.tsx`:

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

Re-execute `pnpm run dev`, view `view-source: http://localhost:8080/`, or view the "Preview" of the HTML request in the Network panel of devtools, you can see that the HTML rendered by SSR already contains the complete UI:

![display6](https://lf3-static.bytednsdoc.com/obj/eden-cn/aphqeh7uhohpquloj/modern-js/docs/11/display6.png)
