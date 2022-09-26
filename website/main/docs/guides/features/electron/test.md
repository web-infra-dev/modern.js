---
title: "测试"
sidebar_position: 8
---

# Electron Test

在此测试框架中，主要测试重点是：**测试套件公开自定义方法**。这有如下几种情况：

1. 主进程中的功能函数
1. 渲染进程中的功能函数
1. Webview 中的功能函数
1. 不同进程之间的功能函数协作流程
1. 测试多应用同时启动的场景

## 测试用例编写基本流程

### 测试用例组织

我们会把所有的测试用例，统一写在：`electron/tests`中。
我们会新建一个 `electron/tests/index.test.ts`：

```ts title='electron/tests/index.test.ts'
/**
 * @jest-environment @modern-js/electron-test/dist/js/node/testEnvironment.js
 */

 jest.setTimeout(100000);
```

我们可以通过这样注释的形式添加一个默认的测试环境，则会为我们启动一个 Electron 实例来进行测试。

:::warning 警告
一般，我们在`electron/tests`目录下，仅会有一个 `*.test.ts` 的文件，并在其中加入注释，注入环境。这样，跑我们所有测试用例的时候，只会开启一个 Electron 实例。若要开启多个实例，可看下方相关示例。
:::

### 测试主进程功能函数

- 注册需要测试的主进程函数。

  首先，我们先注册需要测试的主进程函数`testMainFunc`：

  ```ts title="electron/main.ts"
    import { testServices } from '@modern-js/electron-test/main';

    const services = {
      testMainFunc: (data: string) => data
    }

    testServices({
      ...services,
      winService,
      updateService,
      lifecycleService
    });

    const runtime = new Runtime({
      windowsConfig,
      mainServices: services,
    });
  ```

  :::info 补充信息
  我们除了将用户自定义的服务，通过`testServices`注册以外，我们还注册了框架的一些服务，比如：`winService`。这样在我们的测试用例里也可以使用这些基础服务。
  :::

- 测试主进程`testMainFunc`函数。

  ```ts title="electron/tests/main-process/index.ts"
    // test main services

    import TestDriver from '@modern-js/electron-test';

    let testDriver: TestDriver | null = null;

    jest.setTimeout(100000);

    beforeAll(async () => {
      testDriver = (global as  any).testDriver;

      // 当主进程 Ready 之后。
      await testDriver?.whenReady();
    });

    describe('test main process services', () => {
      it('test testMainFunc', async () => {
        const data = 'test data';

        // 访问主进程服务函数：testMainFunc
        const result = await testDriver?.call({
          funcName: 'testMainFunc',
          args: [data]
        })
        expect(result).toEqual(data);
      })
    })

  ```

### 测试渲染进程功能函数

- 注册渲染进程所需函数`testRenderFunc`。

  ```ts title='electron/preload/browserWindow/index.ts'
  import {
    exposeInMainWorld,
    browserWindowPreloadApis,
  } from '@modern-js/runtime/electron-render';

  import { testServices } from '@modern-js/electron-test/render';

  const { callMain } = browserWindowPreloadApis;

  export const apis = testServices({
    ...browserWindowPreloadApis,
    testRenderFunc: (data: string) => data,
    openWindow: (winName: string) => {
      return callMain('openWindow', winName);
    }

  });

  exposeInMainWorld(apis);

  ```

- 测试窗口中注册的函数`testRenderFunc`。

  ```ts title='electron/tests/render-process/index.ts'
  // test render services

  import TestDriver from '@modern-js/electron-test';

  let testDriver: TestDriver | null = null;

  jest.setTimeout(100000);

  beforeAll(async () => {
    testDriver = (global as  any).testDriver;
    // 当窗口 main 加载完毕
    await testDriver?.whenReady('main');
  });

  describe('test render process services', () => {
    it('test render func', async () => {
      const data = 'test render func';
      // 测试窗口中注册的函数 testRenderFunc
      const result = await testDriver?.call({
        funcName: 'testRenderFunc',
        winName: 'main',
        args: [data]
      })
      expect(result).toEqual(data);
    })
  })

  ```

### 测试 webview 功能函数

- 新建 webview 的预加载脚本，注册 `testWebviewFunc` 函数。

  ```ts title='electron/preload/webview/index.ts'
  import {
    webviewPreloadApis,
    exposeInMainWorld,
  } from '@modern-js/runtime/electron-webview';
  import { testServices } from '@modern-js/electron-test/webview';

  export const apis = testServices({
    ...webviewPreloadApis,
    testWebviewFunc: (data: string) => data
  });

  exposeInMainWorld(apis);

  ```

  ```ts title='electron/preload/webview/index.dev.js'
  const { join } = require('path');
  const babel = require('@babel/register');
  const { babelConfig } = require('@modern-js/plugin-electron/tools');

  babel(
    Object.assign(babelConfig, {
      extensions: ['.ts', '.js'],
    }),
  );
  require(join(__dirname, 'index.ts'));

  ```

- 在页面中，增加`webview`，并设置预加载脚本路径。

  首先，渲染进程预加载脚本中注册一个获得路径的方法。

  ```ts title="electron/browserWindow/index.ts"
    ...
    export const apis = testServices({
      ...
      getWebviewPreloadJs: () =>
        join(
          'file://',
          __dirname,
          '..',
          'webview',
          process.env.NODE_ENV === 'development' ? 'index.dev.js' : 'index.js',
        ),
    });
  ```

  其次，添加`webview`组件，加上预加载脚本路径。

  ```ts title="xx/xx.tsx（渲染进程）"
  const App: React.FC = () => (
    <div>
      ...
      <webview
        src={'https://www.baidu.com'}
        id="webview1"
        // @ts-expect-error
        nodeintegration="true"
        preload={bridge.getWebviewPreloadJs()}
        style={{
          width: '100%',
          height: 300,
        }}></webview>
    </div>
  );
  ```

- 编写测试用例。

  ```ts
  import TestDriver from '@modern-js/electron-test';

  let testDriver: TestDriver | null = null;

  const webviewId1 = 'webview1';

  beforeAll(() => {
    testDriver = new TestDriver({
      cwd: process.cwd(),
      envs: {
        TEST_FOLDER: 'webviewBridge',
      },
    });
    return Promise.all(
      [webviewId1].map(async x => {
        await testDriver?.whenReady('main', {
          webviewId: x,
        });
        await testDriver?.call({
          funcName: 'webviewService.addWebview',
          winName: 'main',
          args: [x, true],
        });
      }),
    );
  });

  describe('test webview bridge', () => {
    it('test webview registerServices again', async () => {
      const msg1 = 'this is msg from webview';

      const result = await testDriver?.call({
        funcName: 'webviewService.callWebview',
        winName: 'main',
        args: [webviewId1, 'testWebviewFunc', msg1],
      });

      expect(result).toBe(msg1);

    });
  });

  ```

  :::info 补充信息
  对于 webview 中的服务函数测试较为复杂，一般流程如下：
  - 在 `beforeAll` 中
    - 等待 `webview` 加载完毕。

    ```ts
    await testDriver?.whenReady('main', {
      webviewId: x,
    });
    ```

    - 将 `webview` 加入 `webviewService` 的管理。（`webviewService.addWebview`）。

    ```ts
    await testDriver?.call({
      funcName: 'webviewService.addWebview',
      winName: 'main',
      args: [x, true],
    });
    ```

  - 在测试用例中，我们通过渲染进程中的`webviewService.callWebview`来调用`webview`中注册的服务。

    ```ts
    const result = await testDriver?.call({
      funcName: 'webviewService.callWebview',
      winName: 'main',
      args: [webviewId1, 'testWebviewFunc', msg1],
    });
    ```

  :::

### 测试多个实例

我们可以这样，新建一个实例：

```ts
  const winName = 'main';
  let myDriver: TestDriver | null;
  beforeAll(async () => {
    myDriver = new TestDriver({
      cwd: process.cwd(),
      envs: {
        TEST_FOLDER: 2,
      },
    });
    await myDriver?.whenReady(winName);
  });
```

接着，我们来测试此实例关闭的表现：

```ts
  it(`will quit if set forceQuit=true`, async () => {
    await myDriver?.call({
      funcName: 'lifecycleService.quit',
      args: [
        {
          forceQuit: true,
        },
      ],
    });
    return sleep(1).then(() => {
      expect(myDriver?.isRunning()).toBe(false);
    });
  });
```

:::info 补充信息
[更多测试 API](/docs/apis/runtime/electron/tests/test)。
:::

### 运行测试

我们将所有测试用例从 `index.test.ts` 中引入：

```ts title="electron/tests/index.test.ts"

/**
 * @jest-environment @modern-js/electron-test/dist/js/node/testEnvironment.js
 */

import './main-process';
import './render-process';
import './webview-process';

jest.setTimeout(100000);

```

接着，我们直接跑：`pnpm run test` 即可运行测试用例。
