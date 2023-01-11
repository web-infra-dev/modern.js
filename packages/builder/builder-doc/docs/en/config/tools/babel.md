- Type: `Object | Function`
- Default: `undefined`

By `tools.babel` you can modify the options of [babel-loader](https://github.com/babel/babel-loader).

### Function Type

When `tools.babel`'s type is Function，the default babel config will be passed in as the first parameter, the config object can be modified directly, or a value can be returned as the final result. The second parameter provides some util functions that can be called directly:

```js
export default {
  tools: {
    babel(config) {
      // Add a babel plugin
      // note: the plugin have been added to the default config to support antd load on demand
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

### Object Type

When `tools.babel`'s type is `Object`, the config will be merged with default config by `Object.assign`. Note that `Object.assign` is a shallow copy and will completely overwrite the built-in `presets` or `plugins` array, please use it with caution.

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

### Util Functions

When `tools.babel` is a Function, the tool functions available for the second parameter are as follows:

#### addPlugins

- Type: `(plugins: BabelPlugin[]) => void`

Add some Babel plugins. For example:

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

- Type: `(presets: BabelPlugin[]) => void`

Add Babel preset configuration. (No need to add presets in most cases)

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

- Type: `(plugins: string | string[]) => void`

To remove the Babel plugin, just pass in the name of the plugin to be removed, you can pass in a single string or an array of strings.

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

- Type: `(presets: string | string[]) => void`

To remove the Babel preset configuration, pass in the name of the preset to be removed, you can pass in a single string or an array of strings.

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

- Type: `(includes: string | RegExp | (string | RegExp)[]) => void`

By default, Babel will only compile the application code in the src directory. With `addIncludes` you can specify that Babel compile some files in node_modules. For example:

```js
export default {
  tools: {
    babel(config, { addIncludes }) {
      addIncludes('node_modules/xxx-components');
    },
  },
};
```

Note that Babel cannot compile CommonJS modules by default. When you use `source.include` to compile CommonJS modules, you need to set Babel's `sourceType` config to `unambiguous`:

```ts
export default {
  tools: {
    babel(config) {
      config.sourceType = 'unambiguous';
    },
  },
};
```

Setting `sourceType` to `unambiguous` may have some other effects, please refer to [Babel official documentation](https://babeljs.io/docs/en/options#sourcetype).

:::tip
Builder provides a more general [source.include](https://modernjs.dev/builder/en/api/config-source.html#source-include) config than `addIncludes`, and it is recommended to use this configuration item first.
:::

#### addExcludes

- Type: `(excludes: string | RegExp | (string | RegExp)[]) => void`

Contrary to `addIncludes`, specifies that certain files are excluded from Babel's compilation.

For example, without compiling files in the `src/example` directory:

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

- Type: `(options: PresetEnvOptions) => void`

Modify the configuration of [@babel/preset-env](https://babeljs.io/docs/en/babel-preset-env), the configuration you pass in will be shallowly merged with default config. For example:

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

- Type: `(options: PresetReactOptions) => void`

Modify the configuration of [@babel/preset-react](https://babeljs.io/docs/en/babel-preset-react), the configuration you pass in will be shallowly merged with default config. For example:

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
