---
sidebar_position: 5
---

# Hook API

在 Modern.js 中主要构建了三套 Manager 模型：CLI、Runtime、Server，其中 CLI 是三套工程方案都有的，而 Runtime、Server 则是 MWA 独有的，不同的工程方案中 Manager 模型的功能是不同的。

## 基础

这一部分的 Hook 模型是所有工程方案都有的，就是说在任意的工程方案中都可以在插件中添加实现对应的中间件函数。

接下来对支持的所有基础 Hook 分别进行介绍。

#### `config`

- 功能：收集配置
- 执行阶段：解析完 `modern.config.ts` 中的配置之后
- Hook 模型：ParallelWorkflow
- 类型：`ParallelWorkflow<void, unknown>`
- 使用示例：

```ts
import type { CliPlugin } from '@modern-js/core';

export default (): CliPlugin => ({
  setup(api) {
    return {
      config: () => {
        return {
          /** some config */
        };
      },
    };
  },
});
```

这里返回的配置信息，会被收集和统一处理合并。

#### `validateSchema`

- 功能：收集各个插件中配置的用来校验用户配置的 [JSON Schema](https://json-schema.org/)
- 执行阶段：`config` Hook 运行完之后。
- Hook 模型：ParallelWorkflow
- 类型：`ParallelWorkflow<void, unknown>`
- 使用示例：

```ts
import type { CliPlugin } from '@modern-js/core';

export default (): CliPlugin => ({
  setup(api) {
    return {
      validateSchema: () => {
        return {
          // target is field
          target: 'foo',
          schema: {
            type: 'string',
          },
        };
      },
    };
  },
});
```

这里返回的 JSON Schema 会用来校验 `modern.config.js` 中的配置信息。

比如这里返回：

```json
{
  "target": "foo",
  "schema": {
    "type": "string"
  }
}
```

就可以在 `modern.config.ts` 中这样配置：

```ts title="modern.config.ts"
export default defineConfig({
  foo: 'test',
});
```

如果是别的类型，校验就不通过会报错，比如这样：

```ts title="modern.config.ts"
export default defineConfig({
  foo: {},
});
```

就会报错：

```sh
$ modern dev
  1 | {
> 2 |   "foo": {},
    |   ^^^^^  Property foo is not expected to be here
```

#### `prepare`

- 功能：运行主流程的前置准备流程
- 执行阶段：校验完配置之后
- Hook 模型：AsyncWorkflow
- 类型：`AsyncWorkflow<void, void>`
- 使用示例：

```ts
import type { CliPlugin } from '@modern-js/core';

export default (): CliPlugin => ({
  setup(api) {
    return {
      prepare: () => {
        // do something
      },
    };
  },
});
```

#### `commands`

- 功能：为 command 添加新的命令
- 执行阶段：`prepare` Hook 运行完之后
- Hook 模型：AsyncWorkflow
- 类型：`AsyncWorkflow<{ program: Command; }, void>`
- 使用示例：

```ts
import type { CliPlugin } from '@modern-js/core';

export default (): CliPlugin => ({
  setup(api) {
    return {
      commands: ({ program }) => {
        program.command('foo').action(async () => {
          // do something
          console.log('foo');
        });
      },
    };
  },
});
```

将上面这个插件添加到 `modern.config.ts` 中：

```ts title="modern.config.ts"
import MyPlugin from './config/plugin/MyPlugin';

export default defineConfig({
  plugins: [MyPlugin()],
});
```

运行 `modern foo` 就可以看到控制台输出：

```sh
$ modern foo
foo
```

#### `beforeExit`

- 功能：在退出进程前，重置一些文件状态
- 执行阶段：进程退出之前
- Hook 模型：AsyncWorkflow
- 类型：`AsyncWorkflow<void, void>`
- 使用示例：

```ts
import type { CliPlugin } from '@modern-js/core';

export default (): CliPlugin => ({
  setup(api) {
    return {
      beforeExit: () => {
        // do something
      },
    };
  },
});
```

## MWA 工程方案

MWA 工程方案支持添加到项目中的插件主要有三种：CLI 插件、 Server 插件、Runtime 插件。他们是基于同一套插件系统实现的，但它们所支持的 Hook 不同、功能不同、运行的时机也不同。

不同的 Manager 对应 Hook 模型和运行时机是不同的，所以接下来会对 CLI、Server、Runtime 的 Hook 模型分开讨论。

### CLI

MWA 工程方案中除了上面提到的基础的 CLI Hook 之外还有一些 MWA 场景下特定的 Hook。

#### `beforeDev`

- 功能：运行 dev 主流程的之前的任务
- 执行阶段：`dev` 命令运行时，项目开始启动前执行
- Hook 模型：AsyncWorkflow
- 类型：`AsyncWorkflow<void, unknown>`
- 使用示例：

```ts
import type { CliPlugin } from '@modern-js/core';

export default (): CliPlugin => ({
  setup(api) {
    return {
      beforeDev: () => {
        // do something
      },
    };
  },
});
```

#### `afterDev`

- 功能：运行 dev 主流程的之后的任务
- 执行阶段：`dev` 命令运行时，项目启动完成之后执行
- Hook 模型：AsyncWorkflow
- 类型：`AsyncWorkflow<void, unknown>`
- 使用示例：

```ts
import type { CliPlugin } from '@modern-js/core';

export default (): CliPlugin => ({
  setup(api) {
    return {
      afterDev: () => {
        // do something
      },
    };
  },
});
```

#### `beforeCreateCompiler`

- 功能：在中间件函数中可以拿到创建 Webpack Compiler 的 Webpack 配置
- 执行阶段：创建 Webpack Compiler 之前执行
- Hook 模型：AsyncWorkflow
- 类型：`AsyncWorkflow<{ webpackConfigs: Configuration[];}, unknown>`
- 使用示例：

```ts
import type { CliPlugin } from '@modern-js/core';

export default (): CliPlugin => ({
  setup(api) {
    return {
      beforeCreateCompiler: ({ webpackConfigs }) => {
        // do something
      },
    };
  },
});
```

#### `afterCreateCompiler`

- 功能：在中间件函数中可以拿到创建的 Webpack Compiler
- 执行阶段：创建 Webpack Compiler 之后执行
- Hook 模型：AsyncWorkflow
- 类型：`AsyncWorkflow<{ compiler: Compiler | MultiCompiler | undefined; }, unknown>`
- 使用示例：

```ts
import type { CliPlugin } from '@modern-js/core';

export default (): CliPlugin => ({
  setup(api) {
    return {
      afterCreateCompiler: ({ compiler }) => {
        // do something
      },
    };
  },
});
```

#### `beforePrintInstructions`

- 功能：在中间件函数中可以拿到即将打印的日志信息，并对其进行修改
- 执行阶段：打印日志信息之前执行
- Hook 模型：AsyncWaterfall
- 类型：`AsyncWaterfall<{ instructions: string }>`
- 使用示例：

```ts
import type { CliPlugin } from '@modern-js/core';

export default (): CliPlugin => ({
  setup(api) {
    return {
      beforePrintInstructions: ({ instructions }) => {
        // do something
        return {
          instructions: [...instructions, 'some new message'],
        };
      },
    };
  },
});
```

#### `beforeBuild`

- 功能：运行 build 主流程的之前的任务，可以拿到构建的 Webpack 配置
- 执行阶段：`build` 命令运行时，项目构建启动前执行
- Hook 模型：AsyncWorkflow
- 类型：`AsyncWorkflow<{ webpackConfigs: Configuration[]; }>`
- 使用示例：

```ts
import type { CliPlugin } from '@modern-js/core';

export default (): CliPlugin => ({
  setup(api) {
    return {
      beforeBuild: () => {
        // do something
      },
    };
  },
});
```

#### `afterBuild`

- 功能：运行 build 主流程的之后的任务
- 执行阶段：`build` 命令运行时，项目构建完成之后执行
- Hook 模型：AsyncWorkflow
- 类型：`AsyncWorkflow<void, unknown>`
- 使用示例：

```ts
import type { CliPlugin } from '@modern-js/core';

export default (): CliPlugin => ({
  setup(api) {
    return {
      afterBuild: () => {
        // do something
      },
    };
  },
});
```

#### `modifyEntryImports`

- 功能：用于修改、添加生成入口文件中的 `import` 语句
- 执行阶段：生成入口文件之前，[`prepare`](#prepare) 阶段触发
- Hook 模型：AsyncWaterfall
- 类型：`AsyncWaterfall<{ imports: ImportStatement[]; entrypoint: Entrypoint; }>`
- 使用示例：

```ts
import type { CliPlugin } from '@modern-js/core';

export default (): CliPlugin => ({
  setup(api) {
    return {
      modifyEntryImports({ entrypoint, imports }) {
        // 添加 `import React from 'React'`
        imports.push({
          value: 'react',
          specifiers: [
            {
              imported: 'unmountComponentAtNode',
            },
          ],
        });

        return { entrypoint, imports };
      },
    };
  },
});
```

#### `modifyEntryExport`

- 功能：用于修改生成入口文件中的 `export` 语句
- 执行阶段：生成入口文件之前，[`prepare`](#prepare) 阶段触发
- Hook 模型：AsyncWaterfall
- 类型：`AsyncWaterfall<{ entrypoint: Entrypoint; exportStatement: string; }>`
- 使用示例：

```ts
import type { CliPlugin } from '@modern-js/core';

export default (): CliPlugin => ({
  setup(api) {
    return {
      modifyEntryImports({ entrypoint, exportStatement }) {
        return {
          entrypoint,
          exportStatement: [`export const foo = 'test'`, exportStatement].join(
            '\n',
          ),
        };
      },
    };
  },
});
```

#### `modifyEntryRuntimePlugins`

- 功能：用于添加、修改生成入口文件中的 [Runtime 插件](#Runtime)
- 执行阶段：生成入口文件之前，[`prepare`](#prepare) 阶段触发
- Hook 模型：AsyncWaterfall
- 类型：`AsyncWaterfall<{ entrypoint: Entrypoint; plugins: RuntimePlugin[]; }>`
- 使用示例：

```ts
import type { CliPlugin } from '@modern-js/core';

export default (): CliPlugin => ({
  setup(api) {
    return {
      modifyEntryRuntimePlugins({ entrypoint, plugins }) {
        const name = 'customPlugin';
        const options = {
          /** 可序列化的内容 */
        };

        return {
          plugins: [
            ...plugins,
            {
              name,
              options: JSON.stringify(options),
            },
          ],
        };
      },
    };
  },
});
```

#### `modifyEntryRenderFunction`

- 功能：用于修改生成入口文件中 `render` 函数
- 执行阶段：生成入口文件之前，[`prepare`](#prepare) 阶段触发
- Hook 模型：AsyncWaterfall
- 类型：`AsyncWaterfall<{ entrypoint: Entrypoint; code: string; }>`
- 使用示例：

```ts
import type { CliPlugin } from '@modern-js/core';

export default (): CliPlugin => ({
  setup(api) {
    return {
      modifyEntryRenderFunction({ entrypoint, code }) {
        const customRender = `/** render function body */`;
        return {
          entrypoint,
          code: customRender,
        };
      },
    };
  },
});
```

#### `modifyFileSystemRoutes`

- 功能：用于修改生成前端页面路由文件中的内容，内容都是需要可序列化的
- 执行阶段：生成前端路由文件之前，[`prepare`](#prepare) 阶段触发
- Hook 模型：AsyncWaterfall
- 类型：`AsyncWaterfall<{ entrypoint: Entrypoint; routes: Route[]; }>`
- 使用示例：

```tsx
import type { CliPlugin } from '@modern-js/core';

export default (): CliPlugin => ({
  setup(api) {
    return {
      modifyFileSystemRoutes({ entrypoint, routes }) {
        return {
          entrypoint,
          routes: [
            ...routes,
            {
              path: '/custom_page',
              component: require.resolve('./Component'),
              exact: true,
            },
          ],
        };
      },
    };
  },
});
```

这样就为前端新增了一个页面路由。

#### `modifyServerRoutes`

- 功能：用于修改生成服务器路由中的内容
- 执行阶段：生成 Server 路由文件之前，[`prepare`](#prepare) 阶段触发
- Hook 模型：AsyncWaterfall
- 类型：`AsyncWaterfall<{ routes: ServerRoute[]; }>`
- 使用示例：

```ts
import type { CliPlugin } from '@modern-js/core';

export default (): CliPlugin => ({
  setup(api) {
    return {
      modifyServerRoutes({ routes }) {
        return {
          routes: [
            ...routes,
            {
              urlPath: '/api/foo',
              isApi: true,
              entryPath: '',
              isSPA: false,
              isSSR: false,
            },
          ],
        };
      },
    };
  },
});
```

#### `htmlPartials`

- 功能：用于定制生成的 HTML 页面模版
- 执行阶段：[`prepare`](#prepare) 阶段触发
- Hook 模型：AsyncWaterfall
- 类型：`AsyncWaterfall<{ entrypoint: Entrypoint; partials: HtmlPartials; }>`
- 使用示例：

```ts
import type { CliPlugin } from '@modern-js/core';

export default (): CliPlugin => ({
  setup(api) {
    return {
      async htmlPartials({ entrypoint, partials }) {
        partials.head.push('<script>console.log("test")</script>');
        return {
          entrypoint,
          partials,
        };
      },
    };
  },
});
```

这样就为 HTML 模版中新增了一个 Script 标签。

### Server

MWA 工程方案中的 Server 部分也支持了插件。其中的 Hook 将会提供一些特定阶段调用和特殊功能的 Hook。

#### `create`

- 功能：在中间件函数中会拿到 Server 初始化用到的指标测量工具配置 `measureOptions` 和日志工具配置 `loggerOptions`，并返回自定义的指标测量工具 `measure` 和日志工具配置 `logger`
- 执行阶段：Server 初始化
- Hook 模型：AsyncPipeline
- 类型：`AsyncPipeline<ServerInitInput, InitExtension>`
- 使用示例：

```ts
import type { ServerPlugin } from '@modern-js/server-core';

export default (): ServerPlugin => ({
  setup(api) {
    return {
      create: ({ measureOptions, loggerOptions }) => {
        // do something
      },
    };
  },
});
```

#### `prepareWebServer`

- 功能：设置 Web 路由的处理函数，在中间件函数中可以拿到 Web Server 的前置中间件
- 执行阶段：在请求到达的时候
- Hook 模型：AsyncPipeline
- 类型：`AsyncPipeline<WebServerStartInput, Adapter>`
- 使用示例：

```ts
import type { ServerPlugin } from '@modern-js/server-core';

export default (): ServerPlugin => ({
  setup(api) {
    return {
      prepareWebServer: ({ middleware }) => {
        // do something

        return (req, res) => {
          // do response
        };
      },
    };
  },
});
```

#### `prepareApiServer`

- 功能：设置 API 路由的处理函数，在中间件函数中可以拿到 API Server 的前置中间件
- 执行阶段：请求到达并且 match bff basename 之后执行
- Hook 模型：AsyncPipeline
- 类型：`AsyncPipeline<APIServerStartInput, Adapter>`
- 使用示例：

```ts
import type { ServerPlugin } from '@modern-js/server-core';

export default (): ServerPlugin => ({
  setup(api) {
    return {
      prepareApiServer: ({ middleware }) => {
        // do something

        return (req, res) => {
          // do response
        };
      },
    };
  },
});
```

### Runtime

Runtime 插件主要用于开发者修改需要渲染的组件与 Element 和定制服务器端、客户端的渲染过程。

#### `init`

- 功能：执行 `App.init`
- 执行阶段：渲染（SSR/CSR）
- Hook 模型：AsyncPipeline
- 类型：`AsyncPipeline<{ context: RuntimeContext; }, unknown>`
- 使用示例：

```ts
import type { Plugin } from '@modern-js/runtime-core';

export default (): Plugin => ({
  setup(api) {
    return {
      init({ context }, next) {
        // do something
        return next({ context });
      },
    };
  },
});
```

#### `hoc`

- 功能：修改需要渲染的组件
- 执行阶段：渲染（SSR/CSR）
- Hook 模型：Pipeline
- 类型：`Pipeline<{ App: React.ComponentType<any>; }, React.ComponentType<any>>`
- 使用示例：

```ts
import { createContext } from 'react';
import type { Plugin } from '@modern-js/runtime-core';

export default (): Plugin => ({
  setup(api) {
    const FooContext = createContext('');
    return {
      hoc({ App }, next) {
        return next({
          App: (props: any) => {
            return (
              <FooContext.Provider store={'test'}>
                <App {...props} />
              </FooContext.Provider>
            );
          },
        });
      },
    };
  },
});
```

#### `provide`

- 功能：修改需要渲染的 Element
- 执行阶段：渲染（SSR/CSR）
- Hook 模型：Pipeline
- 类型：`Pipeline<{ element: JSX.Element; props: AppProps; context: RuntimeContext }, JSX.Element>`
- 使用示例：

```ts
import { createContext } from 'react';
import type { Plugin } from '@modern-js/runtime-core';

export default (): Plugin => ({
  setup(api) {
    const FooContext = createContext('');

    return {
      provide: ({ element }) => <div>{element}</div>,
    };
  },
});
```

#### `client`

- 功能：定制客户端渲染流程
- 执行阶段：在浏览器客户端渲染
- Hook 模型：AsyncPipeline
- 类型：`AsyncPipeline<{ App: React.ComponentType<any>; context?: RuntimeContext; rootElement: HTMLElement; }, void>`
- 使用示例：

```ts
import ReactDOM from 'react-dom';
import type { Plugin } from '@modern-js/runtime-core';

export default (): Plugin => ({
  setup(api) {
    return {
      client: async ({ App, rootElement }) => {
        ReactDOM.render(
          React.createElement(App, { context: { foo: 'test' } }),
          rootElement,
        );
      },
    };
  },
});
```

#### `server`

- 功能：定制服务器端渲染流程
- 执行阶段：SSR
- Hook 模型：AsyncPipeline
- 类型：`AsyncPipeline<{ App: React.ComponentType<any>; context?: RuntimeContext; }, string>`
- 使用示例：

```ts
import ReactDomServer from 'react-dom/server';
import type { Plugin } from '@modern-js/runtime-core';

export default (): Plugin => ({
  setup(api) {
    return {
      server({ App, context }) {
        return ReactDomServer.renderToString(
          React.createElement(App, { context: { foo: 'test' } }),
        );
      },
    };
  },
});
```

## 模块工程方案

模块工程方案用于开发可复用模块，主要提供编译构建的能力，插件方面则是主要提供了调整编译构建配置的 Hook。

#### `moduleLessConfig`

- 功能：用于设置 [Less](https://lesscss.org/) 文件的编译配置
- 执行阶段：`build` 阶段
- Hook 模型：AsyncPipeline
- 类型：`AsyncPipeline<{ modernConfig: NormalizedConfig }, LessOption | undefined>`
- 使用示例：

```ts
import type { CliPlugin } from '@modern-js/core';

export default (): CliPlugin => ({
  setup(api) {
    return {
      moduleLessConfig: ({ modernConfig }) => {
        // do something

        return {
          // LESS 配置
        };
      },
    };
  },
});
```

#### `moduleSassConfig`

- 功能：用于设置 [Sass](https://sass-lang.com/) 文件的编译配置
- 执行阶段：`build` 阶段
- Hook 模型：AsyncPipeline
- 类型：`AsyncPipeline<{ modernConfig: NormalizedConfig }, SassOptions | undefined>`
- 使用示例：

```ts
import type { CliPlugin } from '@modern-js/core';

export default (): CliPlugin => ({
  setup(api) {
    return {
      moduleSassConfig: ({ modernConfig }) => {
        // do something

        return {
          // SASS 配置
        };
      },
    };
  },
});
```

#### `moduleTailwindConfig`

- 功能：用于设置 [Tailwind CSS](https://tailwindcss.com/) 的相关配置
- 执行阶段：`build` 阶段
- Hook 模型：AsyncPipeline
- 类型：`AsyncPipeline<{ modernConfig: NormalizedConfig }, any>`
- 使用示例：

```ts
import type { CliPlugin } from '@modern-js/core';

export default (): CliPlugin => ({
  setup(api) {
    return {
      moduleTailwindConfig: ({ modernConfig }) => {
        // do something

        return {
          // Tailwind CSS 配置
        };
      },
    };
  },
});
```

## Monorepo 工程方案

Monorepo 工程方案中目前没有设置额外的插件 Hook，可以创建、添加拥有基础 Hook 的插件：[基础](#基础)。
