---
title: 添加样式
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

上一章节中，我们学习了如何使用使用三方库中的组件。

这一章节中，我们将学习如何实现 UI 组件。

## 使用 CSS 写 JS 组件

首先我们希望自己控制联系人头像的展示，实现这种设计稿：

![design](https://lf3-static.bytednsdoc.com/obj/eden-cn/nuvjhpqnuvr/modern-website/tutorials/c03-css-expect.jpg)

假设没有现成的组件可以实现，那就需要自己写些 CSS 了，这里我们使用 [styled-components](https://styled-components.com/)，来实现类似的需求。Modern.js 开箱即用的支持 styled-components，既不需要安装依赖，也不需要做任何配置。

styled-components 通过模块化的方式，避免了传统 CSS 写法上的诸多问题。例如直接在元素的 style 属性上写样式，UI 视觉上的细节也会跟 UI 结构上的细节和业务逻辑混在一起。或是 classname 需要避免全局空间重名，需要用到命名规范的问题。

在 `src/routes/page.tsx` 里修改顶部的代码：

```js
import styled from '@modern-js/runtime/styled';
```

添加以下代码：

```js
const Avatar = styled.img`
  width: 50px;
  height: 50px;
  border: 4px solid #0ef;
  border-radius: 50%;
`;
```

修改 `List.Item.Meta` 的代码：

```tsx
<List.Item.Meta
  avatar={<Avatar src={avatar} />}
  title={name}
  description={email}
/>
```

执行 `pnpm run dev`，可以看到预期的运行结果：

![result](https://lf3-static.bytednsdoc.com/obj/eden-cn/nuvjhpqnuvr/modern-website/tutorials/c03-css-result1.png)

接下来我们做一点重构，为了增强可读性，让代码更容易维护，可以把 Avatar 组件拆分出去。我们在终端执行以下命令，创建新的文件：

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

把 `src/routes/page.tsx` 里的 `<Avatar>` 实现删掉，修改为：

```ts
import Avatar from '../components/Avatar';
```

`src/components/Avatar/index.tsx` 的内容，修改为：

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

执行 `pnpm run dev`，运行结果应该是一样的。

:::info 注
采用目录形式 `Avatar/index.tsx` 而不是单文件形式 `Avatar.tsx` 的原因是，之后可以方便的在目录内部增加子文件，包括专用的资源（图片等）、专用子组件、CSS 文件等。
:::

## 使用 Utility

我们已经使用 style-components 实现 `<Avatar>` 组件，但当前的 UI 仍然不能让人满意，缺乏专业感，例如列表项内部的布局有点粗糙，很多地方没对齐。

现在，我们自己来实现一个更好的 `Item` 组件，实现这样的设计稿：

![design](https://lf3-static.bytednsdoc.com/obj/eden-cn/aphqeh7uhohpquloj/modern-js/docs/06/design2.png)

这次要实现的 UI 更复杂，有内部结构，但另一方面，并没有 `<Avatar>` 组件的**很粗的亮蓝色边框**这样很特殊的 UI，都是很常规的水平垂直布局、居中、字体样式等。这种情况下，其实根本没必要写 CSS，有更高效的、跟 styled-components 互补的实现方式：**Utility Class**。

Modern.js 集成了主流、轻量、通用的 Utility Class 工具库 [Tailwind CSS](https://tailwindcss.com/)。

执行 `pnpm run new`，进行如下选择，开启 Tailwind CSS：

```bash
? 请选择你想要的操作 启用可选功能
? 启用可选功能 启用 Tailwind CSS 支持
```

在 `modern.config.ts` 中注册 Tailwind 插件:

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

在 `src/routes/page.tsx` 顶部引入 Tailwind CSS 的 css 文件，就可以开始快速实现专业的 UI：

```js
import 'tailwindcss/base.css';
import 'tailwindcss/components.css';
import 'tailwindcss/utilities.css';
```

先创建 Item 组件：

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

修改 `src/routes/page.tsx`，把 `List` 的 `render` 实现交给 `Item` 组件：

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

在父容器的上使用了 [Utility Class](https://tailwindcss.com/docs/container) ，快速实现了最基本的最大宽度、居中等样式。

接下来实现 `src/components/Item/index.tsx`：

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

执行 `pnpm run dev`，可以看到预期的运行结果：

![result](https://lf3-static.bytednsdoc.com/obj/eden-cn/aphqeh7uhohpquloj/modern-js/docs/06/result2.png)

我们只使用了少量 Utility Class，比如 [Flex](https://tailwindcss.com/docs/display/)、[Padding](https://tailwindcss.com/docs/padding/)、[Margin](https://tailwindcss.com/docs/margin/)、[Text](https://tailwindcss.com/docs/text-color/)、[Font](https://tailwindcss.com/docs/font-weight/)、[Border](https://tailwindcss.com/docs/border-width)，不写一行 CSS 就实现了符合设计稿的专业 UI。

## 自定义 Utility Class

我们也可以自己实现新的 Utility Class，方便在代码间复用。

Utility Class 本身也是一种**面向组件**的技术（将不同 class 用在一个组件上，等价于给这个组件设置了一些来自基类的属性），但 Utility Class 的 classname 是全局的（因为要用在任意组件/元素上），很适合用独立 CSS 文件来实现。

创建一个新的 CSS 文件：

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

在 `src/routes/styles/utils.css` 里实现一个名为 `custom-text-gray` 的 Utility Class。

```css
:root {
  --custom-text-color: rgb(113, 128, 150);
}

.custom-text-gray {
  color: var(--custom-text-color);
}
```

:::info 注
Modern.js 集成了 [PostCSS](/docs/guides/basic-features/css/postcss)，支持现代 CSS 语法特性，比如 [custom properties](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties)。
:::

在 `src/routes/components/Item/index.tsx` 里使用，把：

```js
<div className="ml-4 flex-1 flex justify-between">
```

改成：

```js
<div className="ml-4 custom-text-gray flex-1 flex justify-between">
```

执行 `pnpm run dev`，可以看到字体颜色改变了：

![design2](https://lf3-static.bytednsdoc.com/obj/eden-cn/aphqeh7uhohpquloj/modern-js/docs/06/result3.png)

:::info 注
此处只是为了演示 Utility Class 用法。真实项目中，在有 Tailwind CSS 的情况下，这种 Utility Class 没什么价值，应该通过配置 Design System 的 [**theme**](https://tailwindcss.com/docs/customizing-colors) 来增加字体颜色。

`utils.css` 也可以写成 `utils.scss` 或 `utils.less`，Modern.js 对 SCSS 和 Less 同样提供开箱即用的支持。

不过在 PostCSS 的支持下，现代 CSS 应该足以满足这些开发需求，性能相较于预处理器也更好，建议优先用 .css 文件。
:::
