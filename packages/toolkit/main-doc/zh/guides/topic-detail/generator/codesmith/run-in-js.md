---
sidebar_position: 4
---

# 使用 JS 代码执行微生成器

除了使用 cli 的方式执行微生成器，我们免不了需要在代码中执行微生成器，下面就介绍在 js 代码中如何执行微生成器。

## 安装 codesmith 依赖

```bash
pnpm add @modern-js/codesmith
```

## 创建 codesmith 实例

```ts
import { CodeSmith, Logger } from '@modern-js/codesmith';

const smith = new CodeSmith({
  debug: false, // 是否开启 debug 模式，为 true 时会展示生成器中的 debug 信息
});
```

## 调用 forge 方法执行生成器

```ts
type RunnerTask = Array<{
  name: string;
  config: Record<string, any>;
}>;

const task: RunnerTask = [
  {
    name: 'generator', // 生成器 npm 包名称
    config: {}, // 生成器执行的默认配置
  },
];

await smith.forge({
  tasks: task.map(runner => ({
    generator: runner.name,
    config: runner.config,
  })),
  pwd: '.', // 生成器执行路径
});
```
