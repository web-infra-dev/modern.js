---
title: Add Style
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

In the previous chapter, we learned how to use components from the three-way library.

In this chapter, we will learn how to implement UI components.

## JS components using CSS

First of all, we want to control the display of contact avatars by ourselves, and implement this design draft:

![design](https://lf3-static.bytednsdoc.com/obj/eden-cn/nuvjhpqnuvr/modern-website/tutorials/c03-css-expect.jpg)

Hypothesis has no ready-made components to implement, so you need to write some CSS yourself. Here we use [styled-components] (https://styled-components.com/) to implement similar requirements. Modern.js out of the box supports styled-components, which requires neither dependency nor configuration.

Style-components avoids many problems of traditional CSS writing through modularization. For example, writing styles directly on the style attribute of elements, the visual details of UI will also be mixed with the details of UI structure and business logic. Or classname needs to avoid global space renaming, which requires the use of naming conventions.

Modify the code at the top in `src/routes/page.tsx`:

```js
import styled from '@modern-js/runtime/styled';
```

Add the following code:

```js
const Avatar = styled.img`
  width: 50px;
  height: 50px;
  border: 4px solid #0ef;
  border-radius: 50%;
`;
```

Modify the code of `List.Item.Meta`:

```tsx
<List.Item.Meta
  avatar={<Avatar src={avatar} />}
  title={name}
  description={email}
/>
```

Execute `pnpm run dev` to see the expected running result:

![result](https://lf3-static.bytednsdoc.com/obj/eden-cn/nuvjhpqnuvr/modern-website/tutorials/c03-css-result1.png)

Next we do a little refactoring. To enhance legibility and make the code easier to maintain, we can split the Avatar component. We execute the following command at the end point to create a new file:

<Tabs>
<TabItem value="macOS" label="macOS" default>

```bash
mkdir -p src/components/Avatar
touch src/components/Avatar/index.tsx
```

</TabItem>
<TabItem value="Windows" label="Windows">

```powershell
mkdir -p src/components/Avatar
ni src/components/Avatar/index.tsx
```

</TabItem>
</Tabs>

Delete the `<Avatar>` implementation in `src/routes/page.tsx` and change it to:

```ts
import Avatar from '../components/Avatar';
```

The content of `src/components/Avatar/index.tsx` is modified to:

```ts
import styled from '@modern-js/runtime/styled';

const Avatar = styled.img`
  width: 50px;
  height: 50px;
  border: 4px solid #0ef;
  border-radius: 50%;
`;

export default Avatar;
```

Execute `pnpm run dev`, the result should be the same.

:::info note
The reason for using the directory form `Avatar/index.tsx` instead of the single-file form `Avatar.tsx` is that you can easily add sub-files inside the directory later, including dedicated resources (pictures, etc.), dedicated sub-components, CSS files, etc.
:::

## Utility

We have used the style-components implementation `<Avatar>` component, but the current UI is still unsatisfactory and lacks professionalism, such as the list item inhouse layout is a bit rough and misaligned in many places.

Now, let's implement a better `Item` component ourselves, implementing a design draft like this:

![design](https://lf3-static.bytednsdoc.com/obj/eden-cn/aphqeh7uhohpquloj/modern-js/docs/06/design2.png)

The UI to be implemented this time is more complex and has an internal structure, but on the other hand, there is no very thick bright blue border of the `<Avatar>` component such a very special UI, which is a very conventional horizontal and vertical layout, centering, font style, etc. In this case, there is actually no need to write CSS at all. There is a more efficient implementation method that complements styled-components: **Utility Class**.

Modern.js integrates the mainstream, light, general-purpose Utility Class library [Tailwind CSS](https://tailwindcss.com/).

Execute `pnpm run new` and select the following to start Tailwind CSS:

```bash
? Action: Enable features
? Enable features: Enable Tailwind CSS
```

Register the Tailwind plugin in `modern.config.ts`:

```ts title="modern.config.ts"
import appTools, { defineConfig } from '@modern-js/app-tools';
import tailwindcssPlugin from '@modern-js/plugin-tailwindcss';

// https://modernjs.dev/docs/apis/app/config
export default defineConfig({
  runtime: {
    router: true,
    state: true,
  },
  server: {
    ssr: true,
  },
  plugins: [appTools(), tailwindcssPlugin()],
});
```

Import the Tailwind CSS css file at the top of `src/routes/page.tsx` to start a quick implementation of the professional UI:

```js
import 'tailwindcss/base.css';
import 'tailwindcss/components.css';
import 'tailwindcss/utilities.css';
```

Create the Item component first:

<Tabs>
<TabItem value="macOS" label="macOS" default>

```bash
mkdir -p src/components/Item
touch src/components/Item/index.tsx
```

</TabItem>
<TabItem value="Windows" label="Windows">

```powershell
mkdir -p src/components/Item
ni src/components/Item/index.tsx
```

</TabItem>
</Tabs>

Modify `src/routes/page.tsx` to pass the `render` implementation of `List` to `Item` component:

```js
import { List } from 'antd';
import 'tailwindcss/base.css';
import 'tailwindcss/components.css';
import 'tailwindcss/utilities.css';
import Item from '../components/Item';

const getAvatar = (users: Array<{ name: string, email: string }>) =>
  users.map(user => ({
    ...user,
    avatar: `https://avatars.dicebear.com/v2/identicon/${user.name}.svg`,
  }));

const mockData = getAvatar([
  { name: 'Thomas', email: 'w.kccip@bllmfbgv.dm' },
  { name: 'Chow', email: 'f.lfqljnlk@ywoefljhc.af' },
  { name: 'Bradley', email: 'd.wfovsqyo@gpkcjwjgb.fr' },
  { name: 'Davis', email: '"t.kqkoj@utlkwnpwk.nu' },
]);

function Index() {
  return (
    <div className="container lg mx-auto">
      <List
        dataSource={mockData}
        renderItem={info => <Item key={info.name} info={info} />}
      />
    </div>
  );
}

export default Index;
```

Utility Class(https://tailwindcss.com/docs/container) is used on the parent container for a quick implementation of the most basic maximum width, center, and other styles.

Next implementation `src/components/Item/index.tsx`:

```tsx
import Avatar from '../Avatar';

type InfoProps = {
  avatar: string;
  name: string;
  email: string;
  archived?: boolean;
};

const Item = ({ info }: { info: InfoProps }) => {
  const { avatar, name, email, archived } = info;
  return (
    <div className="flex p-4 items-center border-gray-200 border-b">
      <Avatar src={avatar} />
      <div className="ml-4 flex-1 flex justify-between">
        <div className="flex-1">
          <p>{name}</p>
          <p>{email}</p>
        </div>
        <button
          type="button"
          disabled={archived}
          className={`bg-blue-500  text-white font-bold
            py-2 px-4 rounded-full hover:bg-blue-700`}
        >
          Archive
        </button>
      </div>
    </div>
  );
};

export default Item;
```

Execute `pnpm run dev` to see the expected running result:

![result](https://lf3-static.bytednsdoc.com/obj/eden-cn/aphqeh7uhohpquloj/modern-js/docs/06/result2.png)

We only use a few Utility Classes, such as [Flex](https://tailwindcss.com/docs/display/), [Padding](https://tailwindcss.com/docs/padding/), [Margin](https://tailwindcss.com/docs/margin/), [Text](https://tailwindcss.com/docs/text-color/), [Font](https://tailwindcss.com/docs/font-weight/), [Border](https://tailwindcss.com/docs/border-width), without writing a single CSS implementation Professional UI that conforms to the design draft.

## Customized Utility Class

We can also implement the new Utility Class ourselves to facilitate reuse between codes.

Utility Class itself is also a **component-oriented** technology (using different classes on a component is equivalent to setting some attributes from the base class for this component), but the classname of Utility Class is global (because it is used on arbitrary components/elements), it is very suitable for implementation with separate CSS files.

Create a new CSS file:

<Tabs>
<TabItem value="macOS" label="macOS" default>

```bash
mkdir -p src/styles
touch src/styles/utils.css
```

</TabItem>
<TabItem value="Windows" label="Windows">

```powershell
mkdir -p src/styles
ni src/styles/utils.css
```

</TabItem>
</Tabs>

在 `src/routes/page.tsx` 里导入 `utils.css`：

```js
import '../styles/utils.css';
```

A Utility Class named `custom-text-gray` is implemented in `src/routes/styles/utils.css`.

```css
:root {
  --custom-text-color: rgb(113, 128, 150);
}

.custom-text-gray {
  color: var(--custom-text-color);
}
```

:::info note
Modern.js integrates with [PostCSS](/docs/guides/basic-features/css/postcss) and supports modern CSS syntax features such as [custom properties](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties).
:::

Use in `src/routes/components/Item/index.tsx`:

```js
<div className="ml-4 flex-1 flex justify-between">
```

Change to:

```js
<div className="ml-4 custom-text-gray flex-1 flex justify-between">
```

Execute `pnpm run dev`, you can see that the font color has changed:

![design2](https://lf3-static.bytednsdoc.com/obj/eden-cn/aphqeh7uhohpquloj/modern-js/docs/06/result3.png)

:::info note
This is just to demonstrate Utility Class usage. In a real project, with Tailwind CSS, this Utility Class is of little value and should be added to the font color through the [**theme**](https://tailwindcss.com/docs/customizing-colors) of the configuration Design System.

`utils.css` can also be written as `utils.scss` or `utils.less`, Modern.js out of the box support for SCSS and Less.

However, with the support of PostCSS, modern CSS should be sufficient to meet these development needs, and the performance is also better than that of the preprocessor. It is recommended to use `.css` files first.
:::
