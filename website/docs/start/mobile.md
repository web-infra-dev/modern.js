---
sidebar_position: 2
---

# 开发移动页面

本章将介绍如何使用 Modern.js，进行移动页面的开发。本章对应的代码仓库地址在[这里查看](https://github.com/modern-js-dev/modern-js-examples/tree/main/quick-start/mobile-pages)。

通过本章你可以了解到：

- 如何创建一个移动端网页项目。
- 如何为项目创建新入口。
- 如何使用 Modern.js 配置选项。
- 如何使用组件样式。
- 如何开发和使用 BFF API。
- 如何配置项目所需的静态资源、自定义 HTML。
- 如何使用测试功能。

:::info 在线预览
在 StackBlitz 中预览：<a alt="StackBlitz" target="\_blank" rel="noopener noreferrer" style={{ verticalAlign: '-5px', marginLeft: '5px' }} href="https://stackblitz.com/edit/modern-js-mwa"><img src="https://developer.stackblitz.com/img/open_in_stackblitz.svg" /></a>
:::

## 环境准备

import EnvPrepare from '@site/docs/components/env-prepare.md';

<EnvPrepare/>

## 创建项目

使用 `@modern-js/create` 创建新项目，运行命令如下：

```bash
npx @modern-js/create mobile-pages
```

:::info 注
`mobile-pages` 为创建的项目名。
:::

按照如下选择，生成项目：

```bash
? 请选择你想创建的工程类型： 应用
? 请选择开发语言： TS
? 请选择包管理工具： pnpm
? 是否需要支持以下类型应用： 不需要
? 是否需要调整默认配置： 否
```

## 开发调试

进入项目根目录， 之后执行 `pnpm run dev` 即可启动开发服务器：

```bash
# 进入项目根目录
cd mobile-pages

# 启动开发服务器
pnpm run dev
```

浏览器中访问 `http://localhost:8080`，可以看到应用已经正常启动。

修改 `src/pages/index.tsx` 会触发重新编译和热更新，浏览器中页面会自动展示对应变化。

### IDE 支持

import DevIDE from '@site/docs/components/dev-ide.md'

<DevIDE/>

## 创建入口

在 Modern.js 中，一个[入口](/docs/guides/tutorials/c07-app-entry/7.1-intro)，经过构建后会生成一个对应的 HTML 文件。默认生成的项目只包含一个入口，而一个移动项目通常包含多个独立页面，现在我们创建一个新入口。

在项目根目录下，执行 `pnpm run new`，进行如下选择：

```bash
? 请选择你想要的操作： 创建工程元素
? 创建工程元素： 新建「应用入口」
? 填写入口名称： activity
? 是否修改默认的应用入口配置：否
```

创建完成，项目的 `src/` 目录结构如下：

```md
.
├── src/
│   ├── activity/
│   │   └── App.tsx
│   ├── mobile-pages/
│   │   └── App.tsx
│   ├── .eslintrc.json
```

其中， `activity/` 目录对应新建的入口，项目默认的入口（主入口）代码被移动到 `mobile-pages/` 目录下。

:::info 注
使用生成器将应用从单入口转换成多入口时，原本主入口的代码将会被移动到与当前应用 `package.json` 同名的目录下。
:::

重新启动应用，控制台会输出不同入口对应的访问地址。默认情况下，主入口对应的访问地址为 **{域名根路径}**，其他入口对应的访问地址为 **{域名根路径}/{入口名称}**，如下所示：

```bash
App running at:

  > Local:
    activity        http://localhost:8080/activity
    mobile-pages    http://localhost:8080/
```

:::info 补充信息
更多信息，请参考【[添加应用入口](/docs/guides/tutorials/c07-app-entry/7.2-add-entry-in-cli)】。
:::

## 关闭客户端路由和状态管理

默认生成的项目是开启客户端路由和状态管理功能的，而一个移动项目一般都是由多个相对简单的独立页面组成，不涉及客户端路由和复杂的状态管理，此时我们可以关闭客户端路由和状态管理功能，以减少项目打包后的体积大小，提高页面性能。

我们打开项目根路径下的 `modern.config.js`，目前应该是这样的：

```js title="modern.config.js"
export default defineConfig({
  runtime: {
    state: true,
    router: true,
  },
});
```

然后我们将 `state` 和 `router` 这两个配置项设置为 `false`，就关闭了客户端路由和状态管理功能。

:::info 补充信息
更多用法，请参考【[`state`](/docs/apis/config/runtime/state)】、【[`router`](/docs/apis/config/runtime/router)】。
:::

## 组件样式

### Utility Class

Utility Class 是对通用功能（如文字居中、水平对齐等）涉及的 CSS 规则的封装。开发者可以直接使用这些 CSS Class 进行样式设置。

Modern.js 集成了主流的 Utility Class 解决方案 —— [Tailwind CSS](https://tailwindcss.com/)，我们利用 [Tailwind CSS](https://tailwindcss.com/)
设置组件的通用样式。

首先，需要开启 Tailwind CSS 支持，在项目根目录下执行 `pnpm run new`，进行如下选择：

```bash
? 请选择你想要的操作: 启用可选功能
? 启用可选功能: 启用 Tailwind CSS 支持
```

然后在入口的根组件，这里我们以主入口为例，在 `src/mobile-pages/App.tsx` 添加如下代码：

```js title="src/mobile-pages/App.tsx"
import 'tailwindcss/base.css';
import 'tailwindcss/components.css';
import 'tailwindcss/utilities.css';
```

这样我们就可以在主入口下的组件中使用 Tailwind CSS 提供的 Utility Class 了。我们使用 `text-center` 这个 Class，为 `App.tsx` 中的文字设置居中效果：

```js title="src/mobile-pages/App.tsx"
const App: React.FC = () => (
  <div className="text-center">Hello, Modern.js!</div>
);
```

浏览器访问 `http://localhost:8080`，会发现 `Hello, Modern.js!` 已经居中显示了。

:::info 补充信息
关于 Tailwind CSS 使用的更多介绍，请参考【[Tailwind CSS](/docs/guides/usages/css/tailwindcss)】。
:::

### CSS in JS

组件有时候需要设置自己的特有样式，这时候使用 Utility Class 就不是很方便了。我们可以用 CSS in JS 的写法直接在组件的 JS 代码中编写特有样式。Modern.js 通过集成 [styled-components](https://styled-components.com/) 提供 CSS in JS 的支持。

接下来，我们使用 CSS in JS 实现 `activity` 入口组件样式。

首先，我们在 `src/activity/App.tsx` 里修改顶部的代码，引入 `styled` 模块：

```js
import styled from '@modern-js/runtime/styled';
```

`styled` 模块的使用方式同 [styled-components](https://styled-components.com/) 一致，我们可以定义如下用于给页面标题添加样式的组件：

```js
const TitleWrapper = styled.div`
  font-size: 2rem;
  text-align: center;
  margin: 0.5rem 0;
  color: goldenrod;
`;
```

此时，`src/activity/App.tsx` 的完整代码如下：

```js title="src/activity/App.tsx"
import styled from '@modern-js/runtime/styled';

const TitleWrapper = styled.div`
  font-size: 2rem;
  text-align: center;
  margin: 0.5rem 0;
  color: goldenrod;
`;
const App: React.FC = () => {
  return (
    <div>
      <TitleWrapper>Promotion Campaign</TitleWrapper>
    </div>
  );
};

export default App;
```

:::info 注
上面的示例也可以通过 Tailwind CSS 提供的 Utility Class 实现，这里仅用于举例说明 CSS in JS 的使用方式。通常，Utility Class + CSS in JS 的方案可以满足绝大多数项目的样式编写需求。
:::

:::info 补充信息
关于组件样式的更多用法，请参考【[CSS 开发方案](/docs/guides/usages/css/css-in-js)】。
:::

## 客户端兼容性

Modern.js 提供自动 Polyfill、Browserslist 配置、差异化分发等特性，能够最大化的兼顾客户端兼容性和资源加载性能。关于这部分内容的更多介绍，请参考【[客户端兼容性](/docs/guides/usages/compatibility)】。

## 一体化 BFF

现在 `activity` 入口页面还没有数据，我们可以通过服务端 API 动态获取数据（商品列表数据）。服务端 API 地址为：<https://lf3-static.bytednsdoc.com/obj/eden-cn/beeh7uvzhq/products.json>。

但这个 API 并不是专门为当前项目提供的，部署也是在一个独立的域名下。

通常情况下，项目需要创建一个和当前项目部署在同一域名下的专属 API，并在这个 API 内部去调用原始数据获取，并进行裁剪聚合等。在前端，这样的需求通常使用 BFF 层来实现。

Modern.js 提供了开箱即用的 BFF 能力，支持和前端代码共同开发、调试、部署。

:::info 注
如果已经具备了为前端项目专门开发的、部署在同域下的 API，则不需要再创建 BFF 层，前端代码直接调用 API 即可。
:::

我们执行 `pnpm run new` 来开启 BFF 功能：

import LaunchBFFChoices from '@site/docs/components/launch-bff-choices.md';

<LaunchBFFChoices />

执行完成后，项目中新增了 `api/` 目录，添加 `api/products.ts` 文件，实现对数据获取 API 的调用（需要先安装 axios 依赖）：

```js
import axios from 'axios';

export default async (): Promise<
  { id: string, name: string, price: number }[],
> => {
  const res = await axios.get(
    'https://lf3-static.bytednsdoc.com/obj/eden-cn/beeh7uvzhq/products.json',
  );
  return res.data;
};
```

重新执行 `dev` 命令，我们已经可以访问 `http://localhost:8080/api/products`，并成功获取推荐的商品数据。

接下来修改 `src/activity/App.tsx`，调用 BFF API 来获取数据。

通常情况下，组件代码中通过 `axios`，执行请求地址来获取数据。但是 Modern.js 提供了一种更加简洁的方式，可以像使用函数一样来调用 API，关键代码如下：

```js title="src/activity/App.tsx"
import React, {useEffect, useState} from 'react';
import products from '@api/products';

const App: React.FC = () => {

  const [data, setData] = useState([]);

  useEffect(() => {
    const load = async () => {
      const _data = await products();
      setData(_data);
    };

    load();
  }, []);

  // ...
```

我们从 `@api/products` 路径下导入 `products`，然后直接把 `products` 作为函数调用，即等价于通过 `axios` 调用 API 获取数据的效果，这就是一体化 BFF。

渲染商品列表数据的关键代码如下：

```js title="src/activity/App.tsx"
// ...

const App: React.FC = () => {
  const [data, setData] = useState([]);

  // ...

  return (
    <div>
      <TitleWrapper>Promotion Campaign</TitleWrapper>
      <div>
        {data.map(item => {
          const { id, name, price } = item;
          return (
            <ItemWrapper key={id}>
              <span>{name}</span>
              <span>${price}</span>
            </ItemWrapper>
          );
        })}
      </div>
    </div>
  );
};

export default App;
```

:::info 补充信息
利用一体化 BFF，我们可以实现以往需要专门的服务端项目支持才能实现的需求，如集成微信 JS SDK 时的权限验证逻辑。更多信息请参考【[一体化 BFF](/docs/guides/features/server-side/bff/function)】。
:::

## 配置 Favicon 等通用静态资源

在 `config/` 目录下，添加 `favicon.ico` 图标文件，构建生成的 HTML 页面将包含 favicon 信息。

在 `config/public` 目录下，可以放置任意格式的静态资源化文件，文件会被 Serve 在应用同域名下。

在微信网页开发时，[绑定 JS 接口安全域名](https://developers.weixin.qq.com/doc/offiaccount/OA_Web_Apps/JS-SDK.html#2)需要上传一个微信提供的 txt 文件到自己的 Web 服务器，并保证文件可以被正常访问。

我们可以把这个文件放到 `config/public` 目录，然后访问 **{域名}/{文件名}**就可以获取文件内容。例如，我们在该目录下新建 `MP_verify_abcdef.txt` 文件，重新启动应用，访问 `http://localhost:8080/MP_verify_abcdef.txt` 即可获取文件内容。

:::info 补充信息
关于静态资源的更多使用方法，请参考配置 【[`config/public`](/docs/apis/hooks/mwa/config/public)】。
:::

## 自定义 HTML

Modern.js 支持修改默认使用的 HTML 模板文件。

例如，当我们需要集成 Google Analytics 等工具，统计分析用户的行为信息。我们可以通过自定义项目使用的 HTML 模板，在模板中添加相关工具的 JS SDK 引用代码，实现集成。

以 Google Analytics 为例，我们新建 `config/html/top.html` 文件，内容如下：

```js
<!-- Global Site Tag (gtag.js) - Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

在构建生成的 HTML 页面 `<head>` 标签内，将包含上面的代码，如下图所示：

![custom-html](https://lf3-static.bytednsdoc.com/obj/eden-cn/aphqeh7uhohpquloj/modern-js/start/custom-html.png)

:::info 补充信息
更多信息，请参考【[自定义 HTML 模板](/docs/guides/usages/html)】。
:::

## 测试

Modern.js 内置 [Jest](https://jestjs.io/) 、[Testing Library](https://testing-library.com/) 等测试库/框架，提供单元测试、组件/页面集成测试、业务模型 Model 测试等功能。

使用测试功能，需要先开启该功能。在项目根目录下，执行 `pnpm run new`，进行如下选择：

```bash
? 请选择你想要的操作： 启用可选功能
? 启用可选功能： 启用「单元测试 / 集成测试」功能
```

安装依赖后，可以看到 package.json 中新增了一项依赖：

```bash
+ @modern-js/plugin-testing
```

这一插件提供了 Testing API 用于页面集成测试，我们以主入口为例，演示页面的集成测试。

新建 `src/mobile-pages/__tests__/` 目录，用于放置测试用例，并编写测试用例 `App.test.tsx`：

```js title="App.test.tsx" {1,6-7}
import { renderApp } from '@modern-js/runtime/testing';
import App from '../App';

describe('main entry', () => {
  it('should have contents', () => {
    const { getByText } = renderApp(<App />);
    expect(getByText('Hello, Modern.js !')).toBeInTheDocument();
  });
});
```

默认情况下，`src/` 目录下文件名匹配规则 `*.test.(t|j)sx?` 的文件都会被识别为测试用例。

执行 `pnpm run test`，会运行项目下的所有测试用例。

:::info 补充信息
更多用法，请参考【[Testing API](/docs/apis/runtime/testing/render)】。
:::

## 部署

import Deploy from '@site/docs/components/deploy.md';

<Deploy/>
