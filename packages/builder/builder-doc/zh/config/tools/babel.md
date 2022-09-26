- Type: `Object | Function`
- Default: `undefined`

通过 `tools.babel` 可以修改 [babel-loader](https://github.com/babel/babel-loader) 的配置项。

### 类型

#### Object 类型

当 `tools.babel` 配置为 `Object` 类型时，与默认配置通过 Object.assign 合并。

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

#### Function 类型

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

### 工具函数

`tools.babel` 为 Function 类型时，第二个参数可用的工具函数如下:

#### addPlugins

添加 Babel 插件。

```js
export default {
  tools: {
    babel(config, { addPlugins }) {
      addPlugins([
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

#### addPresets

添加 Babel 预设配置。(大多数情况下不需要增加预设)

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

移除 Babel 插件，传入需要移除的插件名称即可。

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

移除 Babel 预设配置，传入需要移除的预设名称即可。

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

默认情况下 Babel 只会编译 src 目录下的业务代码，使用 addIncludes 你可以指定 Babel 编译 node_modules 下的一些文件。比如:

```js
export default {
  tools: {
    babel(config, { addIncludes }) {
      addIncludes('node_modules/xxx-components');
    },
  },
};
```

#### addExcludes

和 `addIncludes` 相反，指定 Babel 编译时排除某些文件。

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

#### modifyPresetEnvOptions

修改 `@babel/preset-env` 的配置项，传入的配置会与默认配置进行浅层合并，比如:

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

修改 `@babel/preset-react` 的配置项，传入的配置会与默认配置进行浅层合并，比如:

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
