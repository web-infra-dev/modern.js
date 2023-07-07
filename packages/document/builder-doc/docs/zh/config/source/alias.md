- **类型：** `Record<string, string | string[]> | Function`
- **默认值：** `undefined`

设置文件引用的别名，对应 webpack 的 [resolve.alias](https://webpack.js.org/configuration/resolve/#resolvealias) 配置。

:::tip
对于 TypeScript 项目，你只需要在 `tsconfig.json` 中配置 [compilerOptions.paths](https://www.typescriptlang.org/tsconfig#paths) 即可，Builder 会自动识别它，不需要额外配置 `source.alias` 字段，详见 [「路径别名」](https://modernjs.dev/builder/guide/advanced/alias.html)。
:::

### Object 类型

`alias` 的值可以定义为 Object 类型，其中的相对路径会自动被 Builder 转换为绝对路径。

```js
export default {
  source: {
    alias: {
      '@common': './src/common',
    },
  },
};
```

以上配置完成后，如果你在代码中引用 `@common/Foo.tsx`, 则会映射到 `<project>/src/common/Foo.tsx` 路径上。

### Function 类型

`alias` 的值定义为函数时，可以接受预设的 alias 对象，并对其进行修改。

```js
export default {
  source: {
    alias: alias => {
      alias['@common'] = './src/common';
    },
  },
};
```

也可以在函数中返回一个新对象作为最终结果，新对象会覆盖预设的 alias 对象。

```js
export default {
  source: {
    alias: alias => {
      return {
        '@common': './src/common',
      };
    },
  },
};
```

### 精确匹配

默认情况，`source.alias` 会自动匹配子路径，比如以下配置：

```js
import path from 'path';

export default {
  source: {
    alias: {
      '@common': './src/common',
    },
  },
};
```

它的匹配结果如下：

```js
import a from '@common'; // 解析为 `./src/common`
import b from '@common/util'; // 解析为 `./src/common/util`
```

你可以添加 `$` 符号来开启精确匹配，开启后将不会自动匹配子路径。

```js
import path from 'path';

export default {
  source: {
    alias: {
      '@common$': './src/common',
    },
  },
};
```

它的匹配结果如下：

```js
import a from '@common'; // 解析为 `./src/common`
import b from '@common/util'; // 保持 `@common/util` 不变
```

### 处理 npm 包

你可以使用 `alias` 将某个 npm 包指向统一的目录。

比如项目中安装了多份 `react`，你可以将 `react` 统一指向根目录的 `node_modules` 中安装的版本，避免出现打包多份 React 代码的问题。

```js
import path from 'path';

export default {
  source: {
    alias: {
      react: path.resolve(__dirname, './node_modules/react'),
    },
  },
};
```

当你在使用 alias 处理 npm 包时，请留意项目中是否使用了这个包不同的 major 版本。

比如你的项目中某个模块或 npm 依赖使用了 React 18 的 API，如果你将 React alias 到 17 版本，就会导致该模块无法引用到 React 18 的 API，导致代码异常。
