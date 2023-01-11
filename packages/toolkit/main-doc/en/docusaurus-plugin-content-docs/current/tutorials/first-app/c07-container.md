---
title: Add Container
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

In the previous chapter, we initially introduced the **model** to split this part of the logic from the UI component. The `page.tsx` no longer contains UI-independent business logic implementation details, and only needs to use the Model to implement the same function.

In this chapter, we will further use the business logic of implementation in Model to let `page.tsx` and `archived/page.tsx` get the same data. And implementation Archive button, click the button to display the point of contact archive only in the Archives list, not in the All list.

## Use the full Model

Because the two pages need to share the same set of state (point of contact tabular data, point of contact is archived or not), both need to contain the logic to load the initial data, so we need to complete the data acquisition at a higher level.

Modern.js support obtaining data through Data Loader in `layout.tsx`, we first move the data acquisition part of the code to `src/routes/layout.tsx`:

```tsx
import { name, internet } from 'faker';
import {
  Outlet,
  useLoaderData,
  useLocation,
  useNavigate,
} from '@modern-js/runtime/router';
import { useState } from 'react';
import { Radio, RadioChangeEvent } from 'antd';
import { useModel } from '@modern-js/runtime/model';
import contacts from '../models/contacts';
import 'tailwindcss/base.css';
import 'tailwindcss/components.css';
import 'tailwindcss/utilities.css';
import '../styles/utils.css';

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

export default function Layout() {
  const { data } = useLoaderData() as LoaderData;
  const [{ items }, { setItems }] = useModel(contacts);
  if (items.length === 0) {
    setItems(data);
  }

  const navigate = useNavigate();
  ...
}
```

In `src/routes/page.tsx`, use Model directly to get data:

```tsx
import { Helmet } from '@modern-js/runtime/head';
import { useModel } from '@modern-js/runtime/model';
import { List } from 'antd';
import Item from '../components/Item';
import contacts from '../models/contacts';

function Index() {
  const [{ items }, { archive }] = useModel(contacts);

  return (
    <div className="container lg mx-auto">
      <Helmet>
        <title>All</title>
      </Helmet>
      <List
        dataSource={items}
        renderItem={info => (
          <Item
            key={info.name}
            info={info}
            onArchive={() => {
              archive(info.email);
            }}
          />
        )}
      />
    </div>
  );
}

export default Index;
```

Also in `archived/page.tsx`, delete the original `mockData` logic and use the `archived` value computed in Model as the data source:

```tsx
import { Helmet } from '@modern-js/runtime/head';
import { useModel } from '@modern-js/runtime/model';
import { List } from 'antd';
import Item from '../../components/Item';
import contacts from '../../models/contacts';

function Index() {
  const [{ archived }, { archive }] = useModel(contacts);

  return (
    <div className="container lg mx-auto">
      <Helmet>
        <title>Archives</title>
      </Helmet>
      <List
        dataSource={archived}
        renderItem={info => (
          <Item
            key={info.name}
            info={info}
            onArchive={() => {
              archive(info.email);
            }}
          />
        )}
      />
    </div>
  );
}

export default Index;
```

Execute `pnpm run dev`, visit `http://localhost:8080/`, click the Archive button, you can see the button grey out:

![display](https://lf3-static.bytednsdoc.com/obj/eden-cn/nuvjhpqnuvr/modern-website/tutorials/c07-contacts-all.png)

Next, click the top navigation and switch to the Archives list. You can find that the point of contact of **Archive** just now has appeared in the list:

![display](https://lf3-static.bytednsdoc.com/obj/eden-cn/nuvjhpqnuvr/modern-website/tutorials/c07-contacts-archives.png)

## Withdraw container components

In the previous chapters, we split the business logic in the project into two layers, one is the **view component**, and the other is the **module**. The former is responsible for UI display, interaction, etc., and the latter is responsible for the implementation of UI-independent business logic, which specializes in managing state.

Like `src/routes/page.tsx` and `src/routes/archives/page.tsx` use the component of the `useModel` API, which is responsible for linking the two layers of View and Model, similar to the role of the Controller in the traditional MVC architecture. In the Modern.js, we follow the habit and call them **Container**.

The container component is recommended to be placed in a special `containers/` directory. We execute the following command to create a new file:

<Tabs>
<TabItem value="macOS" label="macOS" default>

```bash
mkdir -p src/containers
touch src/containers/Contacts.tsx
```

</TabItem>
<TabItem value="Windows" label="Windows">

```powershell
mkdir -p src/containers
ni src/containers/Contacts.tsx
```

</TabItem>
</Tabs>

We extracted the common part of the original two `page.tsx`, and the code of `src/containers/Contacts.tsx` is as follows:

```tsx
import { Helmet } from '@modern-js/runtime/head';
import { useModel } from '@modern-js/runtime/model';
import { List } from 'antd';
import Item from '../components/Item';
import { Helmet } from '@modern-js/runtime/head';
import { useModel } from '@modern-js/runtime/model';
import { List } from 'antd';
import Item from '../components/Item';
import contacts from '../models/contacts';

function Contacts({
  title,
  source,
}: {
  title: string;
  source: 'items' | 'archived';
}) {
  const [state, { archive }] = useModel(contacts);

  return (
    <div className="container lg mx-auto">
      <Helmet>
        <title>{title}</title>
      </Helmet>
      <List
        dataSource={state[source]}
        renderItem={info => (
          <Item
            key={info.name}
            info={info}
            onArchive={() => {
              archive(info.email);
            }}
          />
        )}
      />
    </div>
  );
}

export default Contacts;
```

Modify the code for `src/routes/page.tsx` and `src/routes/archives/page.tsx`:

```tsx title="src/routes/page.tsx"
import Contacts from '../containers/Contacts';

function Index() {
  return <Contacts title="All" source="items" />;
}

export default Index;
```

```tsx title="src/routes/archives/page.tsx"
import Contacts from '../../containers/Contacts';

function Index() {
  return <Contacts title="Archives" source="archived" />;
}

export default Index;
```

The refactoring is complete, and the current project structure is:

```bash
.
├── README.md
├── dist
├── modern.config.ts
├── node_modules
├── package.json
├── pnpm-lock.yaml
├── src
│   ├── components
│   │   ├── Avatar
│   │   │   └── index.tsx
│   │   └── Item
│   │       └── index.tsx
│   ├── containers
│   │   └── Contacts.tsx
│   ├── models
│   │   └── contacts.ts
│   ├── modern-app-env.d.ts
│   ├── routes
│   │   ├── archives
│   │   │   └── page.tsx
│   │   ├── layout.tsx
│   │   └── page.tsx
│   └── styles
│       └── utils.css
└── tsconfig.json
```

The **view components** in `components/` dir are in the form of directories, such as `Avatar/index.tsx`. And the **container components** in `containers/` dir are in the form of single files, such as `contacts.tsx`. **This is a best practice we recommend**.

As mentioned in the chapter [Add UI component](./c02-component.md), the view component is in the form of a directory, because the view component is responsible for the implementation of UI display and interaction details, and can evolve in complexity. In the form of a directory, it is convenient to add sub-files, including dedicated resources (pictures, etc.), dedicated sub-components, CSS files, etc. You can reconstruct at will within this directory, considering only the smallest parts.

The container component is only responsible for linkage and is a glue layer. The sophisticated business logic and implementation details are handed over to the View layer and the Model layer for implementation. The container component itself should be kept simple and clear, and should not contain complex implementation details, so there should be no internal structure. The single-file form is not only more concise, but also acts as a constraint, reminding developers not to write complicated container components.
