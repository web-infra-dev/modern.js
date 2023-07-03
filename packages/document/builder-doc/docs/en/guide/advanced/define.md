# Environment Variables

Builder supports injecting environment variables or expressions into the code during compilation, which is helpful for distinguishing the running environment or injecting constant values. This chapter introduces how to use environment variables.

## Default Variables

### process.env.NODE_ENV

By default, Builder will automatically set the `process.env.NODE_ENV` environment variable to `'development'` in development mode and `'production'` in production mode.

You can use `process.env.NODE_ENV` directly in Node.js and in the runtime code.

```ts
if (process.env.NODE_ENV === 'development') {
  console.log('this is a development log');
}
```

In the development environment, the above code will be compiled as:

```js
if (true) {
  console.log('this is a development log');
}
```

In the production environment, the above code will be compiled as:

```js
if (false) {
  console.log('this is a development log');
}
```

After code minification, `if (false) { ... }` will be recognized as invalid code and removed automatically.

### process.env.ASSET_PREFIX

You can use `process.env.ASSET_PREFIX` in the runtime code to access the URL prefix of static assets.

- In development, it is equivalent to the value set by [dev.assetPrefix](/api/config-dev.html#dev-assetprefix).
- In production, it is equivalent to the value set by [output.assetPrefix](/api/config-output.html#output-assetprefix).
- Builder will automatically remove the trailing slash from `assetPrefix` to make string concatenation easier.

For example, we copy the `static/icon.png` image to the `dist` directory through [output.copy](/api/config-output.html#output-copy) configuration:

```ts
export default {
  dev: {
    assetPrefix: '/',
  },
  output: {
    copy: [{ from: './static', to: 'static' }],
    assetPrefix: 'https://example.com',
  },
};
```

Then we can access the image URL in the runtime code:

```jsx
const Image = <img src={`${process.env.ASSET_PREFIX}/static/icon.png`} />;
```

In the development environment, the above code will be compiled as:

```jsx
const Image = <img src={`/static/icon.png`} />;
```

In the production environment, the above code will be compiled as:

```jsx
const Image = <img src={`https://example.com/static/icon.png`} />;
```

## Using define config

By configuring the [source.define](/en/api/config-source.html#sourcedefine), you can replace expressions with other expressions or values in compile time.

`Define` looks like macro definitions in other programming languages. But JavaScript has powerful runtime capabilities, so you don't need to use it as a complicated code generator. You can use it to pass simple data, such as environment variables, from compile time to runtime. Almost there, it can be used to work with Builder to shake trees.

### Replace Expressions

The most basic use case for `Define` is to replace expressions in compile time.

The value of the environment variable `NODE_ENV` will change the behavior of many vendor packages. Usually, we need to set it to `production`.

```js
export default {
  source: {
    define: {
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
    },
  },
};
```

Note that the value provided here must be a JSON string, e.g. `process.env.NODE_ENV` with a value of `"production"` should be passed in as `"\"production\""` to be processed correctly.

Similarly `{ foo: "bar" }` should be converted to `"{\"foo\":\"bar\"}"`, which if passed directly into the original object would mean replacing the expression `process.env.NODE_ENV.foo` with the identifier `bar`.

For more about `source.define`, just refer to [API References](/api/config-source.html#sourcedefine).

:::tip
The environment variable `NODE_ENV` shown in the example above is already injected by the Builder, and you usually do not need to configure it manually.
:::

### process.env Injection

When using `source.define` or `source.globalVars`, please avoid injecting the entire `process.env` object, e.g. the following usage is not recommended:

```js
export default {
  source: {
    define: {
      'process.env': JSON.stringify(process.env),
    },
  },
};
```

If the above usage is adopted, the following problems will be caused:

1. Some unused environment variables are additionally injected, causing the environment variables of the development environment to be leaked into the front-end code.
2. As each `process.env` code will be replaced by a complete environment variable object, the bundle size of the front-end code will increase and the performance will decrease.

So please avoid full injection, just inject the used variables from `process.env`.

## Setup Environment Variables

You may often need to set environment variables, in which case you can instead use the [source.globalVars](/en/api/config-source.html#sourceglobalvars) configuration to simplify configuration. It is a syntax sugar of `source.define`, the only difference is that `source.globalVars` will automatically stringify the value, which makes it easier to set the value of global variables and avoid writing a lot of `JSON.stringify(...)` stuffs.

```js
export default {
  source: {
    globalVars: {
      'process.env.NODE_ENV': 'production',
      'import.meta.foo': { bar: 42 },
      'import.meta.baz': false,
    },
  },
};
```

Note that either of these methods will only match the full expression; destructing the expression will prevent the Builder from correctly recognizing it.

```js
console.log(process.env.NODE_ENV);
// => production

const { NODE_ENV } = process.env;
console.log(NODE_ENV);
// => undefined

const vars = process.env;
console.log(vars.NODE_ENV);
// => undefined
```

## Declare type of environment variable

When you read an environment variable in a TypeScript file, TypeScript may prompt that the variable lacks a type definition, and you need to add the corresponding type declaration.

For example, if you reference a `CUSTOM_VAR` variable, the following prompt will appear in the TypeScript file:

```
TS2304: Cannot find name 'CUSTOM_VAR'.
```

To fix this, you can create a `src/env.d.ts` file in your project and add the following content:

```ts title="src/env.d.ts"
declare const CUSTOM_VAR: string;
```

## Tree Shaking

`Define` can also be used to mark dead code to assist the Builder with Tree Shaking optimization.

Build artifacts for different regions is achieved by replacing `process.env.REGION` with a specific value, for example.

```js
export default {
  source: {
    define: {
      'process.env.REGION': JSON.stringify(process.env.REGION),
    },
    // or...
    globalVars: {
      'process.env.REGION': process.env.REGION,
    },
  },
};
```

For an internationalized app:

```js
const App = () => {
  if (process.env.REGION === 'cn') {
    return <EntryFoo />;
  } else if (process.env.REGION === 'sg') {
    return <EntryBar />;
  } else {
    return <EntryBaz />;
  }
};
```

Specifying the environment variable `REGION=sg` and then executing build will eliminate any dead code.

```js
const App = () => {
  if (false) {
  } else if (true) {
    return <EntryBar />;
  } else {
  }
};
```

Unused components are not bundled into the artifacts, and their external dependencies can be optimized accordingly, resulting in a destination with better size and performance.

## In-source testing

Vitest supports writing tests inside source files to test the behavior of private features without exporting them. Set up `Define` to remove the test code from the production build. Please refer to the [Vitest's documentation](https://vitest.dev/guide/in-source.html) for detailed guidelines

```js
// the implementation
function add(...args) {
  return args.reduce((a, b) => a + b, 0);
}

// in-source test suites
if (import.meta.vitest) {
  const { it, expect } = import.meta.vitest;
  it('add', () => {
    expect(add()).toBe(0);
    expect(add(1)).toBe(1);
    expect(add(1, 2, 3)).toBe(6);
  });
}
```
