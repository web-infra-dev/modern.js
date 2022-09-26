- Type: `Object | Function`
- Default: `undefined`

By `tools.babel` you can modify [babel-loader](https://github.com/babel/babel-loader)'s' options.

### Type

#### Object

When `tools.babel`'s type is `Object`, the config will be merged with default config by Object.assign.

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

#### Function

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

### Util Functions

When `tools.babel` is of type Function, the tool functions available for the second parameter are as follows:

#### addPlugins

Add Babel plugin. For exapmle:

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

To remove the Babel plugin, just pass in the name of the plugin to be removed.

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

To remove the Babel preset configuration, pass in the name of the preset to be removed.

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

By default, Babel will only compile the application code in the src directory. With addIncludes you can specify that Babel compile some files in node_modules. For example:

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

Modify the configuration of `@babel/preset-env`, the configuration you pass in will be shallowly merged with default config. For example:

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

Modify the configuration of `@babel/preset-react`, the configuration you pass in will be shallowly merged with default config. For example:

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
