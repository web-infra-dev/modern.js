- Type:

```ts
type DisableSourceMap =
  | boolean
  | {
      js?: boolean;
      css?: boolean;
    };
```

- Default:

```ts
const defaultDisableSourceMap = {
  js: false,
  css: process.env.NODE_ENV === 'production',
};
```

Whether to disable Source Map generation.

:::tip What is a Source Map
Source Map is an information file that saves the source code mapping relationship. It records each location of the compiled code and the corresponding pre-compilation location. With Source Map, you can directly view the source code when debugging the compiled code.
:::

By default, Builder's Source Map generation rules are:

- In development build, SourceMap of JS files and CSS files will be generated, which is convenient for debugging.
- In production build, the Source Map of JS files will be generated for debugging and troubleshooting online problems; the Source Map of CSS files will not be generated.

If the project does not need Source Map, you can turned off it to speed up the compile speed.

```js
export default {
  output: {
    disableSourceMap: true,
  },
};
```

If you want to enable Source Map in development and disable it in the production, you can set to:

```js
export default {
  output: {
    disableSourceMap: process.env.NODE_ENV === 'production',
  },
};
```

If you need to individually control the Source Map of JS files or CSS files, you can refer to the following settings:

```js
export default {
  output: {
    disableSourceMap: {
      js: false,
      css: true,
    },
  },
};
```
