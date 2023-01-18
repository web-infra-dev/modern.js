---
sidebar_position: 4
---

# Execute microgenerator with JS code

In addition to using the cli method to execute the micro generator, we inevitably need to execute the micro generator in the code. The following describes how to execute the micro generator in the js code.

## install codesmith dependency

```bash
pnpm add @modern-js/codesmith
```

## Create codesmith instance

```ts
import { CodeSmith, Logger } from '@modern-js/codesmith';

const smith = new CodeSmith({
  debug: false, //Whether to enable debug mode, if true, the debug information in the generator will be displayed
});
```

## Call the forge method to execute the generator

```ts
type RunnerTask = Array<{
  name: string;
  config: Record<string, any>;
}>;

const task: RunnerTask = [
  {
    name: 'generator', // generator npm package name
    config: {}, //The default configuration performed by the generator
  },
];

await smith.forge({
  tasks: task.map(runner => ({
    generator: runner.name,
    config: runner.config,
  })),
  pwd: '.', // generator implementation path
});
```
