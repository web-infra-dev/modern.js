- **Type:** `Object | Function`
- **Default**

```js
{
  displayName: true,
  // `isSSR` is true in SSR build
  ssr: isSSR,
  // `pure` is enabled in production to reduce bundle size
  pure: isProd,
  transpileTemplateLiterals: true,
}
```

`tools.styledComponents` config is corresponding to [babel-plugin-styled-components](https://github.com/styled-components/babel-plugin-styled-components).

When the value is an Object, use the Object.assign function to merge with the default config. For example:

```js
export default {
  tools: {
    styledComponents: {
      pure: false,
    },
  },
};
```

When the config is a Function, the first parameter is the default configuration, and the second parameter provides some utility functions that can be called directly:

```js
export default {
  tools: {
    styledComponents(config) {
      config.pure = false;
    },
  },
};
```
