- Type: `Object | Function`
- Default

```js
{
  pure: true,
  displayName: true,
  // `isSSR` is true in SSR build
  ssr: isSSR,
  transpileTemplateLiterals: true,
}
```

`tools.styledComponents` config is corresponding to [babel-plugin-styled-components](https://github.com/styled-components/babel-plugin-styled-components).

When the value is of type `Object`, use the Object.assign function to merge with the default config. For example:

```js
export default {
  tools: {
    styledComponents: {
      pure: false,
    },
  },
};
```

When the config is of type `Function`, the first parameter is the default configuration, and the second parameter provides some utility functions that can be called directly:

```js
export default {
  tools: {
    styledComponents(config) {
      config.pure = false;
    },
  },
};
```
