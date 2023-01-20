- Type: `string[] | Record<BuilderTarget, string[]`
- Default: `undefined`

Specifies the range of target browsers that the project is compatible with. This value will be used by [@babel/preset-env](https://babeljs.io/docs/en/babel-preset-env) and [autoprefixer](https://github.com/postcss/autoprefixer) to identify the JavaScript syntax that need to be transformed and the CSS browser prefixes that need to be added.

#### Priority

The `overrideBrowserslist` config will override the `.browserslistrc` config file in the project and the `browserslist` field in package.json.

In most cases, it is recommended to use the `.browserslistrc` file rather than the `overrideBrowserslist` config. Because the `.browserslistrc` file is the official config file, it is more general and can be recognized by other libraries in the community.

#### Default Value

If there is no `browserslist` configs defined in the project, nor `overrideBrowserslist` defined, then Builder will set the default browserslist to:

```js
['> 0.01%', 'not dead', 'not op_mini all'];
```

### Example

An example compatible with mobile scenarios:

```js
export default {
  output: {
    overrideBrowserslist: [
      'iOS 9',
      'Android 4.4',
      'last 2 versions',
      '> 0.2%',
      'not dead',
    ],
  },
};
```

Check out the [browserslist documentation](https://github.com/browserslist/browserslist) to learn more about browserslist.

#### Set according to Targets

When you build multiple targets at the same time, you can set different browser ranges for different targets. At this point, you need to set `overrideBrowserslist` to an object whose key is the corresponding build target.

For example to set different ranges for `web` and `node`:

```js
export default {
  output: {
    overrideBrowserslist: {
      web: ['iOS 9', 'Android 4.4', 'last 2 versions', '> 0.2%', 'not dead'],
      node: ['node >= 14'],
    },
  },
};
```
