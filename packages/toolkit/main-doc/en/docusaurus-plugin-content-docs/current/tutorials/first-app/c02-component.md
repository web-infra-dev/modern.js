---
title: Add UI Components
---

In the previous chapter, we learned how to initialize a project and use configuration to modify the default behavior of Modern.js.

In this chapter, we continue to use the project code of the previous chapter and continue to improve the point of contact list.

In order to do better UI display and interaction, we introduce the component library [Antd](https://ant.design/index-cn) to develop, and use the `<List>` component instead of the primitive list. Add dependency first:

```bash
pnpm add antd
```

Modify `src/routes/page.tsx` to import components at the top:

```ts
import { List } from 'antd';
```

Modify the implementation of the `<App>` component:

```tsx
function App() {
  return (
    <div>
      <List
        dataSource={mockData}
        renderItem={({ name, email, avatar }) => (
          <List.Item key={name}>
            <List.Item.Meta
              avatar={<img alt="avatar" src={avatar} width={60} height={60} />}
              title={name}
              description={email}
            />
          </List.Item>
        )}
      />
    </div>
  );
}
```

Execute `pnpm run dev` to see the running results:

![result](https://lf3-static.bytednsdoc.com/obj/eden-cn/nuvjhpqnuvr/modern-website/tutorials/c02-antd-result.png)

You can see that the components exported by Ant Design already have complete styles.

:::info note
Modern.js [Automatically import CSS required by Ant Design component on demand](https://github.com/ant-design/babel-plugin-import).
:::

:::note
We can also use other component libraries to implement the same functionality, such as [Arco Design](https://arco.design/).
:::
