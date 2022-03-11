---
sidebar_position: 6
---

# 扩展插件 Hook

这一部分主要是通过【[动态注册 Hook 模型](/docs/apis/runtime/plugin/manager#动态注册-hook-模型)】的方式来扩展。

这里我们用一个简单的例子演示一下。假设我们要添加一些管理控制台输出信息的 Hook。

首先我们初始化一个空的项目文件，并添加基础依赖：

```console
$ npx @modern-js/create modern-js-demo
```

我们先创建一个 Hook 模型：

```ts title=config/plugin/message.ts
import { createWaterfall } from '@modern-js/plugin'

const message = createWaterfall<string[]>()
```

然后注册它：

```ts title=config/plugin/message.ts
import { registerHook } from '@modern-js/core'

registerHook({
  message
})
```

添加 Hook 类型：

```ts title=config/plugin/message.ts
declare module '@modern-js/core' {
  export interface Hooks {
    message: typeof message;
  }
}
```

创建插件，通过 `commands` Hook 函数，添加命令处理逻辑：

```ts title=config/plugin/message.ts
import { createPlugin, mountHook } from '@modern-js/core'

export default createPlugin(() => {
  return {
    commands({ program }) {
      program
        .command('message')
        .action(async () => {
          const messages = mountHook().message([]);
          console.log(messages.join('\n'))
        });
    }
  }
})
```

最后 `config/plugin/message.ts` 的状态是：

```ts title=config/plugin/message.ts
import { createPlugin, registerHook, mountHook } from '@modern-js/core'
import { createWaterfall } from '@modern-js/plugin'

const message = createWaterfall<string[]>()

registerHook({
  message
})

declare module '@modern-js/core' {
  export interface Hooks {
    message: typeof message;
  }
}

export default createPlugin(() => {
  return {
    commands({ program }) {
      program
        .command('message')
        .action(async () => {
          const messages = mountHook().message([]);
          console.log(messages.join('\n'))
        });
    }
  }
});
```

然后在 `modern.config.ts` 中添加这个插件：

```ts title="modern.config.ts"
import { defineConfig } from '@modern-js/runtime'

export default defineConfig({
  plugins: [{
    cli: require.resolve('./config/plugin/message.ts')
  }]
})
```

这时运行 `npx modern message` 就会执行相关逻辑，但由于没有收集到任何信息，所以控制台输出为空。

那这里我们添加一个：

```ts title=config/plugin/foo.ts
import { createPlugin } from '@modern-js/core'

export default createPlugin(() => {
  return {
    message(list) {
      return [
        ...list,
        '[foo] line 0',
        '[foo] line 1',
      ]
    }
  }
})
```

将它添加到配置中：

```ts title="modern.config.ts"
import { defineConfig } from '@modern-js/runtime'

export default defineConfig({
  plugins: [
    require.resolve('./plugin'),
    require.resolve('./fooPlugin'),
  ]
})
```

这时运行 `npx modern message` 就可以在控制台看到信息了：

```console
$ modern message
[foo] line 0
[foo] line 1
```

以上面这种方式就可以扩展出拥有各种能力的插件 Hook。
