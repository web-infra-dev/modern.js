---
title: Add Client Route
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

In the previous chapter, we learned how to create UI components and add styles.

In this chapter, we will learn how to add **Client Route**.

Previously we have added the Archive button to the point of contact list, next we add a route `/archives`, when accessing this route, only the point of contact of the saved file is displayed, while the original `/` continues to display all points of contact.

Create a new `src/routes/archives/page.tsx` file:

<Tabs>
<TabItem value="macOS" label="macOS" default>

```bash
mkdir -p src/routes/archives
touch src/routes/archives/page.tsx
```

</TabItem>
<TabItem value="Windows" label="Windows">

```powershell
mkdir -p src/routes/archives
ni src/routes/archives/page.tsx
```

</TabItem>
</Tabs>

Add the following code:

```tsx title="src/archives/page.tsx"
import { List } from 'antd';
import { Helmet } from '@modern-js/runtime/head';
import Item from '../../components/Item';

const getAvatar = (users: Array<{ name: string; email: string }>) =>
  users.map(user => ({
    ...user,
    avatar: `https://avatars.dicebear.com/v2/identicon/${user.name}.svg`,
  }));

const getMockArchivedData = () =>
  getAvatar([
    { name: 'Thomas', email: 'w.kccip@bllmfbgv.dm' },
    { name: 'Chow', email: 'f.lfqljnlk@ywoefljhc.af' },
  ]);
function Index() {
  return (
    <div className="container lg mx-auto">
      <Helmet>
        <title>Archives</title>
      </Helmet>
      <List
        dataSource={getMockArchivedData()}
        renderItem={info => <Item key={info.name} info={info} />}
      />
    </div>
  );
}

export default Index;
```

The `Helmet` component of [React Helmet](https://github.com/nfl/react-helmet) is used here, and the Helmet component is also added in `src/routes/page.tsx`:

```tsx
import { Helmet } from '@modern-js/runtime/head';

function Index() {
  return (
    <div className="container lg mx-auto">
      <Helmet>
        <title>All</title>
      </Helmet>
      ...
    </div>
  );
}
```

:::info note
Modern.js integrates react-helmet by default, and can also be used in conjunction with SSR to meet SEO needs.
:::

Since there are multiple pages now, all of which need to use the previous Utility Class, we need to move the style file to `src/routes/layout.tsx`:

```tsx
import 'tailwindcss/base.css';
import 'tailwindcss/components.css';
import 'tailwindcss/utilities.css';
import '../styles/utils.css';
```

Execute `pnpm run dev`, visit `http://localhost:8080`, you can see the full point of contact, the title of the page is All:

![display1](https://lf3-static.bytednsdoc.com/obj/eden-cn/nuvjhpqnuvr/modern-website/tutorials/c04-archives.png)

Visit `http://localhost:8080/archives` and you will only see the point of contact of the saved file with the title Archives:

![display](https://lf3-static.bytednsdoc.com/obj/eden-cn/nuvjhpqnuvr/modern-website/tutorials/c04-all.png)

Looking at the HTML source code of the page, you can see that the content of the two pages is the same, and different content is rendered for different URLs.

**Next we add a simple navigation bar that allows the user to toggle between the two lists**.

Open `src/routes/layout.tsx` and import the Radio component at the top:

```tsx
import { Radio } from 'antd';
```

Then modify the top of the UI to add a set of radio group:

```tsx {4-9}
export default function Layout() {
  return (
    <div>
      <div className="h-16 p-2 flex items-center justify-center">
        <Radio.Group onChange={handleSetList} value={currentList}>
          <Radio value="/">All</Radio>
          <Radio value="/archives">Archives</Radio>
        </Radio.Group>
      </div>
      <Outlet />
    </div>
  );
}
```

Then we come to the implementation of `currentList` and `handleSetList`.

Introducing three React Hooks: `useState` and `useNavigate` and `useParams`, as well as Ant Design's event type definition:

```js
import { useState } from 'react';
import { Radio, RadioChangeEvent } from 'antd';
import { Outlet, useLocation, useNavigate } from "@modern-js/runtime/router";
```

Finally, add local state and related logic to the Layout component:

```tsx {2-9}
export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentList, setList] = useState(location.pathname || '/');
  const handleSetList = (e: RadioChangeEvent) => {
    const { value } = e.target;
    setList(value);
    navigate(value);
  };
  return (
  ...
}
```

At this point, the page navigation bar implementation has been completed, and execute `pnpm run dev` to see the effect:

![display2](https://lf3-static.bytednsdoc.com/obj/eden-cn/nuvjhpqnuvr/modern-website/tutorials/c04-switch.png)

Click Archives in the navigation bar, you can see that the selected state and URL of the radio box will change, the page is not refreshed, only CSR occurs.

Accessing the two pages through the URL, you can see that the HTML content is different, because the page executes the logic of  client routing in the SSR stage, and the HTML already contains the final render result.
