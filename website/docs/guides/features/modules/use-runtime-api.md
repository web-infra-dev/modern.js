---
sidebar_position: 5
---

# 使用 Runtime API

本章将要介绍如何在可复用模块项目中使用 Runtime API。

## 启动 Runtime API

可复用模块的初始化项目默认不包含 Runtime API 功能，我们可以通过微生成器来开启它。

可以在项目根目录下执行如下命令运行微生成器：

```
pnpm run new
```

我们按照如下进行选择：

```
? 请选择你想要的操作 启用可选功能
? 启用可选功能 启用「Runtime API」
```

然后就可以等待依赖安装成功。

## 使用 Runtime API

在可复用模块项目中，可以直接使用 `@modern-js/runtime` 模块来使用 Runtime API。例如使用了 Model API 的项目，其项目的代码如下：

**`./src/model.tsx`**
``` tsx
import { model } from '@modern-js/runtime/model';

type State = {
  data: {
    key: string;
    name: string;
    age: number;
    country: string;
  }[];
};

export default model<State>('tableList').define({
  state: {
    data: [],
  },
  actions: {
    load: {
      fulfilled(state, payload) {
        return {data: payload};
      },
    }
  },
  effects: {
    async load() {
      const data = await (await fetch('https://lf3-static.bytednsdoc.com/obj/eden-cn/beeh7uvzhq/users.json')).json();
      return data;
    },
  },
});
```

**`./src/index.tsx`**

``` tsx
import type React from 'react';
import { useEffect } from 'react';
import { Table } from 'antd';
import { useModel } from '@modern-js/runtime/model';
import tableListModel from './model';

export default () => {
  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Age',
      dataIndex: 'age',
      key: 'age',
    },
    {
      title: 'Country',
      dataIndex: 'country',
      key: 'country',
    },
  ];

  const [{ data }, { load }] = useModel(tableListModel);

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="table-list table-theme">
      <Table columns={columns} dataSource={data} />
    </div>
  );
};
```

我们既可以把包含 Runtime API 的可复用模块进行构建，然后在一个应用项目内使用来进行调试。

也可以使用可复用模块提供的 Storybook 功能进行调试。例如针对上面的例子，我们可以编写 Story：

``` tsx
import TableList from '@/index';

export const TableListDemo = () => <TableList />;

export default {
  title: 'A TableList',
};
```
