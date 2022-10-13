---
sidebar_position: 6
---

# 代码编译
在主进程中，我们为了保持主进程代码的目录结构，这对于我们在主进程中使用一些动态导入等会更加方便。但也带来了一些问题：
- 我们主进程通过 babel 编译，因此在编译不同的目录的时候，需要通过命令参数 --extra 来指定进行编译。
- 我们在主进程使用的 node_modules 会通过 babel 去分析识别，生成 dist/package.json ，从而在构建的时候将依赖打包到应用中。未被识别的一些间接引用，则需要通过 externalDependencies 来指定。

## 指定额外目录

我们现在的主进程代码，默认都放在 electron 目录下，前端代码放在 src 目录下。有时候，主进程、渲染进程有些通用的常量可能需要放到一个公用的目录下，比如放在 shared 目录中。

首先，我们创建 shared 目录和 `shared/index.ts`，在里面写上：

```ts
export const a = 1;
```


### 渲染进程中使用

我们在根目录的 `tsconfig.json` 中加上 `includes: [...,'shared']`，我们可以配置上别名：
```json
...
"paths": {
  ...
  "@shared/*": ["./shared/*"]
}
```

这样，我们就可以在渲染进程中使用：
```tsx
import { a } from '@shared/index';

console.log("test shared a:", a);

```


### 主进程中使用

同样我们需要在 `electron/tsconfig.json` 中加上 `includes: [...,'../shared/']`，我们也可以配置上别名：

```json
"paths": {
  "@shared/*": ["../shared/*"]
}
```
tsconfig.json 中的配置便于给代码编辑器识别。在实际运行时，由于主进程是通过 babel 编译，因此 babel 里的别名也需要配置。
我们在 modern.config.js 中配置：

```js
...
electron: {
  ...,
  babel: defaultConfig => {
    defaultConfig.plugins.push([
      require.resolve('babel-plugin-module-resolver'),
      {
        root: ['./'],
        alias: {
          '@shared': './shared',
        },
      },
    ]);
    return defaultConfig;
  },
}
```


这样，我们就可以在渲染进程中使用：
```ts-main.ts
import { a } from '@shared/index';

console.log("test shared a:", a);

```

### 构建
在构建**主进程**的时候，我们需要指定编译的额外目录：

```ts
"build:main": "modern build electron-main --extra shared",
```

或者：

```ts
"build:electron": "PLATFORM=mac modern build electron --extra shared",
```

当然，如果有多个目录，可以继续指定，比如：


```ts
"build:main": "modern build electron-main --extra shared xxxx xxx",
```

## 构建时的依赖安装

在构建主进程的时候，我们通过 babel 分析了主进程的依赖，并生成了 package.json，在构建的时候，会基于此 package.json 安装对应的依赖。
但有些时候，我们需要的依赖可能是一种间接的引用，我们可以通过配置来将其识别并放入 package.json 中。比如：我们使用了 xxx@1.0.0 这个包，我们可以在项目根目录下 package.json 中配置：

```ts
"externalDependencies": {
  "xxx": "1.0.0"
}
```

这样，我们在生成最终的 package.json 的时候也会将这个 `externalDependencies` 带上，放入最终 package.json 中的 `dependencies` 下。这样在进行最后的构建依赖安装的时候即可安装上。

