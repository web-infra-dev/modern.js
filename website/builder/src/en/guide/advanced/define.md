# Environment Variables

Builder supports injecting environment variables or expressions into the code during compilation, which is helpful for distinguishing the running environment or injecting constant values. This chapter introduces how to use environment variables.

# Using define config

By configuring the [source.define](/en/api/config-source.html#source-define), you can replace expressions with other expressions or values in compile time.

`Define` looks like macro definitions in other programming languages. But JavaScript has powerful runtime capabilities, so you don't need to use it as a complicated code generator. You can use it to pass simple data, such as environment variables, from compile time to runtime. Almost there, it can be used to work with Builder to shake trees.

## Replace Expressions

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

For more about `source.define`, just refer to [API References](/api/config-source.html#source-define)。

## Setup Environment Variables

You may often need to set environment variables, in which case you can instead use the [source.globalVars](/en/api/config-source.html#source-globalvars) configuration to simplify configuration. It is a syntax sugar of `source.define`, the only difference is that `source.globalVars` will automatically stringify the value, which makes it easier to set the value of global variables and avoid writing a lot of `JSON.stringify(...)` stuffs.

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

The environment variable `NODE_ENV` shown in the example above is already injected by the Builder, and you usually do not need to configure it manually.

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

## Tree Shaking

`Define` can also be used to mark dead code to assist the Builder with Tree Shaking optimization.

Building products for different regions is achieved by replacing `process.env.REGION` with a specific value, for example.

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

Unused components are not packaged into the product, and their external dependencies can be optimized accordingly, resulting in a destination with better size and performance.

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
