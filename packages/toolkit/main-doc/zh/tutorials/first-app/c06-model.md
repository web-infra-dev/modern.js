---
title: 添加业务模型（状态管理）
---

上一章节中，我们把硬编码的 `mockData` 改成从 Data Loader 中加载。

这一章节中，我们会进一步实现项目的功能，例如实现 **Archive** 按钮的功能，把联系人归档。

因此会开始编写一些跟 UI 完全无关的业务逻辑，如果继续写在组件代码中，会产生越来越多的面条式代码。为此，我们引入了一种叫做**业务模型（Model）**的代码模块，将这些业务逻辑和 UI 解耦。

## 实现 Model

创建一个完整的 Model 首先需要定义**状态（state）**，包括状态中数据的名称和初始值。

我们使用 Model 来管理联系人列表的数据，因此定义如下数据状态：

```js
const state = {
  items: [],
};
```

使用 TS 语法，可以定义更完整的类型信息，比如 items 里每个对象都应该有 `name`、`email` 字段。为了实现归档功能，还需要创建 `archived` 字段保存这个联系人是否已被归档的状态。

我们还需要一个字段用来访问所有已归档的联系人，可以定义 **computed** 类型的字段，对已有的数据做转换：

```js
const computed = {
  archived: ({ items }) => {
    return items.filter(item => item.archived);
  },
};
```

computed 类型字段的定义方式是函数，但使用时可以像普通字段一样通过 state 访问。

:::info
Modern.js 集成了 [Immer](https://immerjs.github.io/immer/)，能够像操作 JS 中常规的可变数据一样，去写这种状态转移的逻辑。
:::

实现 Archive 按钮时，我们需要一个 `archive` 函数，负责修改指定联系人的 `archived` 字段，我们把这种函数都叫作 **action**：

```js
const actions = {
  archive(draft, payload) {
    const target = draft.items.find(item => item.email === payload);
    if (target) {
      target.archived = true;
    }
  },
};
```

action 函数是一种**纯函数**，确定的输入得到确定的输出（转移后的状态），不应该有任何副作用。

函数的第一个参数是 Immer 提供的 Draft State，第二个参数是 action 被调用时传入的参数（后面会介绍怎么调用）。

我们尝试完整实现它们：

```js
const state = {
  items: [],
  pending: false,
  error: null,
};

const computed = {
  archived: ({ items }) => {
    return items.filter(item => item.archived);
  },
};

const actions = {
  archive(draft, payload) {
    const target = draft.items.find(item => item.email === payload);
    if (target) {
      target.archived = true;
    }
  },
};
```

接下来我们把上面的代码连起来，放在同一个 Model 文件里。首先执行以下命令，创建新的文件目录：

```bash
mkdir -p src/models/
touch src/models/contacts.ts
```

添加 `src/models/contacts.ts` 的内容：

```tsx
import { model } from "@modern-js/runtime/model";

type State = {
  items: {
    avatar: string;
    name: string;
    email: string;
    archived?: boolean;
  }[];
  pending: boolean;
  error: null | Error;
};

export default model<State>("contacts").define({
  state: {
    items: [],
    pending: false,
    error: null,
  },
  computed: {
    archived: ({ items }: State) => items.filter((item) => item.archived),
  },
  actions: {
    archive(draft, payload) {
      const target = draft.items.find((item) => item.email === payload)!;
      if (target) {
        target.archived = true;
      }
    },
  },
});
```

我们把一个包含 state，action 等要素的 plain object 称作 **Model Spec**，Modern.js 提供了 [Model API](/docs/apis/app/runtime/model/model_)，可以根据 Model Spec 生成 **Model**。

## 使用 Model

现在我们直接使用这个 Model，把项目的逻辑补充起来。

首先修改 `src/components/Item/index.tsx`，添加 **Archive 按钮**的 UI 和交互，内容如下：

```tsx
import Avatar from "../Avatar";

type InfoProps = {
  avatar: string;
  name: string;
  email: string;
  archived?: boolean;
};

const Item = ({
  info,
  onArchive,
}: {
  info: InfoProps;
  onArchive?: () => void;
}) => {
  const { avatar, name, email, archived } = info;
  return (
    <div className="flex p-4 items-center border-gray-200 border-b">
      <Avatar src={avatar} />
      <div className="ml-4 custom-text-gray flex-1 flex justify-between">
        <div className="flex-1">
          <p>{name}</p>
          <p>{email}</p>
        </div>
        <button
          type="button"
          disabled={archived}
          onClick={onArchive}
          className={`text-white font-bold py-2 px-4 rounded-full ${
            archived
              ? "bg-gray-400 cursor-default"
              : "bg-blue-500 hover:bg-blue-700"
          }`}
        >
          {archived ? "Archived" : "Archive"}
        </button>
      </div>
    </div>
  );
};

export default Item;
```

接下来，我们修改 `src/routes/page.tsx`，为 `<Item>` 组件传递更多参数：

```tsx
import { Helmet } from "@modern-js/runtime/head";
import { useModel } from "@modern-js/runtime/model";
import { useLoaderData } from "@modern-js/runtime/router";
import { List } from "antd";
import { name, internet } from "faker";
import Item from "../components/Item";
import contacts from "../models/contacts";

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
      archived: false,
    };
  });

  return {
    code: 200,
    data,
  };
};

function Index() {
  const { data } = useLoaderData() as LoaderData;
  const [{ items }, { archive, setItems }] = useModel(contacts);
  if (items.length === 0) {
    setItems(data);
  }

  return (
    <div className="container lg mx-auto">
      <Helmet>
        <title>All</title>
      </Helmet>
      <List
        dataSource={items}
        renderItem={(info) => (
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

`useModel` 是 Modern.js 提供的 hooks API。可以在组件中提供 Model 中定义的 state，或通过 actions 调用 Model 中定义的 side effect 与 action，从而改变 Model 的 state。

Model 是业务逻辑，是计算过程，本身不创建也不持有状态。只有在被组件用 hooks API 使用后，才在指定的地方创建状态。

执行 `pnpm run dev`，点击 **Archive 按钮**，可以看到页面 UI 发生了变化。

:::note
上述例子中，`useLoaderData` 其实在每次切换路由时都会执行。因为我们在 Data Loader 里使用了 fake 数据，每次返回的数据是不同的。但我们优先使用了 Model 中的数据，因此切换路由时数据没有发生改变。
:::
