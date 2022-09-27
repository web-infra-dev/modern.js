---
sidebar_position: 4
---

# 扩展插件 Hook

本章节介绍如何通过动态注册 [Hook 模型](/docs/apis/runtime/plugin/hook#hook-模型) 的方式来扩展插件 Hook。

## 示例

这里我们用一个简单的例子演示一下。假设我们要添加一些管理控制台输出信息的 Hook。

首先我们初始化一个空的项目文件，并添加基础依赖：

```console
$ npx @modern-js/create modern-js-demo
```

### 创建 Hook

我们先创建一个 Hook 模型：

```ts title=config/plugin/MyPlugin.ts
import { createWaterfall } from '@modern-js/plugin';

const message = createWaterfall<string[]>();
```

然后注册它：

```ts title=config/plugin/MyPlugin.ts
import type { CliPlugin } from '@modern-js/core';

export default (): CliPlugin => ({
  name: 'my-plugin',

  registerHook: {
    message,
  },
});
```

添加 Hook 类型：

```ts title=config/plugin/MyPlugin.ts
declare module '@modern-js/core' {
  export interface Hooks {
    message: typeof message;
  }
}
```

### 使用 Hook

创建插件，通过 `commands` Hook 函数，添加命令处理逻辑：

```ts title=config/plugin/MyPlugin.ts
import type { CliPlugin } from '@modern-js/core';

export default (): CliPlugin => ({
  name: 'my-plugin',

  setup(api) {
    return {
      commands({ program }) {
        program.command('message').action(async () => {
          const hookRunners = api.useHookRunners();
          const messages = hookRunners.message([]);
          console.log(messages.join('\n'));
        });
      },
    };
  },
});
```

最后 `config/plugin/MyPlugin.ts` 的状态是：

```ts title=config/plugin/MyPlugin.ts
import { createWaterfall } from '@modern-js/plugin';
import type { CliPlugin } from '@modern-js/core';

const message = createWaterfall<string[]>();

export default (): CliPlugin => ({
  name: 'my-plugin',

  registerHook: {
    message,
  },

  setup(api) {
    return {
      commands({ program }) {
        program.command('message').action(async () => {
          const hookRunners = api.useHookRunners();
          const messages = hookRunners.message([]);
          console.log(messages.join('\n'));
        });
      },
    };
  },
});

declare module '@modern-js/core' {
  export interface Hooks {
    message: typeof message;
  }
}
```

然后在 `modern.config.ts` 中添加这个插件：

```ts title="modern.config.ts"
import { defineConfig } from '@modern-js/app-tools';
import MyPlugin from './config/plugin/MyPlugin';

export default defineConfig({
  plugins: [MyPlugin()],
});
```

这时运行 `npx modern message` 就会执行相关逻辑，但由于没有收集到任何信息，所以控制台输出为空。

那这里我们添加一个：

```ts title=config/plugin/OtherPlugin.ts
import type { CliPlugin } from '@modern-js/core';

export default (): CliPlugin => ({
  name: 'my-plugin',

  setup(api) {
    return {
      message(list) {
        return [...list, '[foo] line 0', '[foo] line 1'];
      },
    };
  },
});
```

将它添加到配置中：

```ts title="modern.config.ts"
import { defineConfig } from '@modern-js/app-tools';
import MyPlugin from './config/plugin/MyPlugin';
import OtherPlugin from './config/plugin/OtherPlugin';

export default defineConfig({
  plugins: [MyPlugin(), OtherPlugin()],
});
```

这时运行 `npx modern message` 就可以在控制台看到信息了：

```console
$ modern message
[foo] line 0
[foo] line 1
```

以上面这种方式就可以扩展出拥有各种能力的插件 Hook。
