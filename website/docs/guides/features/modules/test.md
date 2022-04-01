---
sidebar_position: 8
---

# 测试可复用模块

本章将要介绍如何测试可复用模块。

## 执行测试

Modern.js 对可复用模块提供了测试功能。我们可以直接在项目根目录下执行：

```
pnpm run test
```

执行之后，会看到测试的结果：

![](https://lf3-static.bytednsdoc.com/obj/eden-cn/aphqeh7uhohpquloj/modern-js/guides/test-result.png)

## 添加测试配置

如果想要对测试进行一些额外的配置，可以通过在 `modern.config.js` 中增加 [`tools.jest`](/docs/apis/config/tools/jest) 以及 [`testing`](/docs/apis/config/testing/transformer) API 进行配置。

## 对不同类型可复用模块的测试

### 工具库类型

针对工具库类型的模块，可以直接使用 Modern.js 提供的测试功能以及配置。例如针对源码：

``` tsx
export default function () {
  return 'hello world';
}
```

其测试文件可以如下：

``` tsx
import main from '@/index';

describe('默认值 cases', () => {
  test('Have returns', () => {
    const drink = jest.fn(main);
    drink();
    expect(drink).toHaveReturned();
  });
});
```

### UI 组件类型

针对组件类型的可复用模块项目，Modern.js 的 Runtime API 提供了用于测试 UI 组件的功能，其功能由 `@modern-js/runtime/testing` 提供。

例如有以下组件源码：

```tsx
export const default () {
  return (
    <div>This is a UI Component</div>
  );
}
```

其测试代码如下：

``` tsx
import { render, screen } from '@modern-js/runtime/testing';

import Component from '@/index';

describe('默认值 cases', () => {
  test('Rendered', () => {
    render(<Component />);
    expect(screen.getByText('This is a UI Component')).toBeInTheDocument();
  });
});
```

:::info 注
项目需要安装 `@modern-js/rutime` 模块，可以通过 [微生成器](/docs/guides/features/modules/micro-generator) 来开启。
:::

### 业务模型类型

针对业务模型类型的可复用模块项目，Modern.js 的 Runtime API 提供了用于业务模型的功能，其功能由 `@modern-js/runtime/model` 提供。

关于如何进行业务模型的测试，可以阅读 [测试 Model](/docs/guides/features/runtime/model/test-model)。

