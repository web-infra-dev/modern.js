- **Type:** `Object | Function`
- **Default:** `undefined`

With `tools.babel` you can modify the options of [babel-loader](https://github.com/babel/babel-loader).

### Usage Scenarios

Please note the limitations of `tools.babel` in the following usage scenarios:

- Rspack scenario: When using Rspack as the bundler, using the `tools.babel` option will significantly slow down the Rspack's build speed. This is because Rspack defaults to using SWC for compilation, and configuring Babel will cause the code to be compiled twice, resulting in additional compilation overhead.
- webpack + SWC scenario: When using webpack as the bundler, if you use Builder's SWC plugin for code compilation, the `tools.babel` option will not take effect.

### Function Type


When `tools.babel` is of type `Function`, the default Babel configuration will be passed as the first parameter. You can directly modify the configuration object or return an object as the final `babel-loader` configuration.

```js
export default {
  tools: {
    babel(config) {
      // Add a Babel plugin
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

The second parameter of the `tools.babel` function provides some more convenient utility functions. Please continue reading the documentation below.

:::tip
The above example is just for reference, usually you don't need to manually configure `babel-plugin-import`, because the Builder already provides a more general `source.transformImport` configuration.
:::

### Object Type

When `tools.babel`'s type is `Object`, the config will be shallow merged with default config by `Object.assign`.

:::caution
Note that `Object.assign` is a shallow copy and will completely overwrite the built-in `presets` or `plugins` array, please use it with caution.
:::

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

- **Type:** `(plugins: BabelPlugin[]) => void`

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

- **Type:** `(presets: BabelPlugin[]) => void`

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

- **Type:** `(plugins: string | string[]) => void`

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

- **Type:** `(presets: string | string[]) => void`

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

- **Type:** `(includes: string | RegExp | (string | RegExp)[]) => void`

By default, Babel will only compile the application code in the src directory. With `addIncludes` you can specify that Babel compile some files in node_modules. For example:

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
The usage of the `addIncludes` function is basically the same as the `source.include` config, please see the [source.include documentation](https://modernjs.dev/builder/api/config-source.html#sourceinclude) for a more detailed usage. You can also use `source.include` directly instead of the `addIncludes` function.
:::

#### addExcludes

- **Type:** `(excludes: string | RegExp | (string | RegExp)[]) => void`

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

:::tip
The usage of the `addExcludes` function is basically the same as the `source.exclude` config, please see the [source.exclude documentation](https://modernjs.dev/builder/api/config-source.html#sourceexclude) for a more detailed usage. You can also use `source.exclude` directly instead of the `addExcludes` function.
:::

#### modifyPresetEnvOptions

- **Type:** `(options: PresetEnvOptions) => void`

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

- **Type:** `(options: PresetReactOptions) => void`

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

### Debugging Babel Configuration

After modifying the `babel-loader` configuration through `tools.babel`, you can view the final generated configuration in [Builder debug mode](https://modernjs.dev/builder/en/guide/debug/debug-mode.html).

First, enable debug mode by using the `DEBUG=builder` parameter:

```bash
# Debug development mode
DEBUG=builder pnpm dev

# Debug production mode
DEBUG=builder pnpm build
```

Then open the generated `(webpack|rspack).config.web.js` file and search for the `babel-loader` keyword to see the complete `babel-loader` configuration.
