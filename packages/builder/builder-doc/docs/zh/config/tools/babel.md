- **类型：** `Object | Function`
- **默认值：** `undefined`

通过 `tools.babel` 可以修改 [babel-loader](https://github.com/babel/babel-loader) 的配置项。

### Function 类型

当 `tools.babel` 为 Function 类型时，默认配置作为第一个参数传入，可以直接修改配置对象，也可以返回一个值作为最终结果，第二个参数提供了一些可以直接调用的工具函数：

```js
export default {
  tools: {
    babel(config) {
      // 添加一个插件，比如配置某个组件库的按需引入
      // 目前内置了 antd 的按需引入规则
      config.plugins.push([
        'babel-plugin-import',
        {
          libraryName: 'xxx-components',
          libraryDirectory: 'es',
          style: true,
        },
      ]);
    },
  },
};
```

### Object 类型

当 `tools.babel` 的值为 `Object` 类型时，会与默认配置通过 `Object.assign` 合并。注意 `Object.assign` 是浅拷贝，会完全覆盖内置的 `presets` 或 `plugins` 数组，请谨慎使用。

```js
export default {
  tools: {
    babel: {
      plugins: [
        [
          'babel-plugin-import',
          {
            libraryName: 'xxx-components',
            libraryDirectory: 'es',
            style: true,
          },
        ],
      ],
    },
  },
};
```

### 工具函数

`tools.babel` 为 Function 类型时，第二个参数可用的工具函数如下:

#### addPlugins

- **类型：** `(plugins: BabelPlugin[]) => void`

添加若干个 Babel 插件。

```js
export default {
  tools: {
    babel(config, { addPlugins }) {
      addPlugins([
        [
          'babel-plugin-import',
          {
            libraryName: 'xxx-components',
            libraryDirectory: 'es',
            style: true,
          },
        ],
      ]);
    },
  },
};
```

#### addPresets

- **类型：** `(presets: BabelPlugin[]) => void`

添加若干个 Babel 预设配置 (大多数情况下不需要增加预设)。

```js
export default {
  tools: {
    babel(config, { addPresets }) {
      addPresets(['@babel/preset-env']);
    },
  },
};
```

#### removePlugins

- **类型：** `(plugins: string | string[]) => void`

移除 Babel 插件，传入需要移除的插件名称即可，你可以传入单个字符串，也可以传入一个字符串数组。

```js
export default {
  tools: {
    babel(config, { removePlugins }) {
      removePlugins('babel-plugin-import');
    },
  },
};
```

#### removePresets

- **类型：** `(presets: string | string[]) => void`

移除 Babel 预设配置，传入需要移除的预设名称即可，你可以传入单个字符串，也可以传入一个字符串数组。

```js
export default {
  tools: {
    babel(config, { removePresets }) {
      removePresets('@babel/preset-env');
    },
  },
};
```

#### addIncludes

- **类型：** `(includes: string | RegExp | (string | RegExp)[]) => void`

默认情况下 Babel 只会编译 src 目录下的业务代码，使用 `addIncludes` 你可以指定 Babel 编译 node_modules 下的一些文件。比如编译 `query-string` 依赖：

```js
export default {
  tools: {
    babel(config, { addIncludes }) {
      addIncludes(/\/query-string\//);
    },
  },
};
```

:::tip
`addIncludes` 函数的用法与 `source.include` 配置项基本一致，请查看 [source.include 文档](/api/config-source.html#sourceinclude) 来查看更详细的用法说明。也可以直接使用 `source.include` 来代替 `addIncludes` 函数。
:::

#### addExcludes

- **类型：** `(excludes: string | RegExp | (string | RegExp)[]) => void`

`addExcludes` 和 `addIncludes` 的用处相反，指定 Babel 编译时排除某些文件。

比如不编译 `src/example` 目录下的文件:

```js
export default {
  tools: {
    babel(config, { addExcludes }) {
      addExcludes('src/example');
    },
  },
};
```

:::tip
`addExcludes` 函数的用法与 `source.exclude` 配置项基本一致，请查看 [source.exclude 文档](/api/config-source.html#sourceexclude) 来查看更详细的用法说明。也可以直接使用 `source.exclude` 来代替 `addExcludes` 函数。
:::

#### modifyPresetEnvOptions

- **类型：** `(options: PresetEnvOptions) => void`

修改 [@babel/preset-env](https://babeljs.io/docs/en/babel-preset-env) 的配置项，传入的配置会与默认配置进行浅层合并，比如:

```js
export default {
  tools: {
    babel(config, { modifyPresetEnvOptions }) {
      modifyPresetEnvOptions({
        targets: {
          browsers: ['last 2 versions'],
        },
      });
    },
  },
};
```

#### modifyPresetReactOptions

- **类型：** `(options: PresetReactOptions) => void`

修改 [@babel/preset-react](https://babeljs.io/docs/en/babel-preset-react) 的配置项，传入的配置会与默认配置进行浅层合并，比如:

```js
export default {
  tools: {
    babel(config, { modifyPresetReactOptions }) {
      modifyPresetReactOptions({
        pragma: 'React.createElement',
      });
    },
  },
};
```
