- **Type:** `Record<string, JSONValue> | Function`
- **Default:**

```ts
const defaultGlobalVars = {
  // The environment variable `process.env.NODE_ENV` will be added by default,
  // so you don't need to set it in manually.
  'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
};
```

Used to define global variables. It can replace expressions like `process.env.FOO` in your code after compile. Such as:

```js
console.log(process.env.NODE_ENV);

// ⬇️ Turn into being...
console.log('development');
```

### Example

In the following example, the `ENABLE_VCONSOLE` and `APP_CONTEXT` are injected into the code:

```js
export default {
  source: {
    globalVars: {
      ENABLE_VCONSOLE: true,
      APP_CONTEXT: { answer: 42 },
    },
  },
};
```

You can use them directly in your code:

```js
if (ENABLE_VCONSOLE) {
  // do something
}

console.log(APP_CONTEXT);
```

### Function Usage

- **Type:**

```ts
type GlobalVarsFn = (
  obj: Record<string, JSONValue>,
  utils: { env: NodeEnv; target: BuilderTarget },
) => Record<string, JSONValue> | void;
```

You can set `source.globalVars` to a function to dynamically setting some environment variables.

For example, dynamically set according to the build target:

```js
export default {
  source: {
    globalVars(obj, { target }) {
      obj['MY_TARGET'] = target === 'node' ? 'server' : 'client';
    },
  },
};
```

### Difference with define

You can take `source.globalVars` as the syntax sugar of `source.define`, the only difference is that `source.globalVars` will automatically stringify the value, which makes it easier to set the value of global variables. The values of `globalVars` should be JSON-safe to ensure it can be serialized.

```js
export default {
  source: {
    globalVars: {
      'process.env.BUILD_VERSION': '0.0.1',
      'import.meta.foo': { bar: 42 },
      'import.meta.baz': false,
    },
    define: {
      'process.env.BUILD_VERSION': JSON.stringify('0.0.1'),
      'import.meta': {
        foo: JSON.stringify({ bar: 42 }),
        baz: JSON.stringify(false),
      },
    },
  },
};
```

### Precautions

`source.globalVars` injects environment variables through string replacement, so it cannot take effect on dynamic syntaxes such as destructuring.

When using destructuring assignment, Builder will not be able to determine whether the variable `NODE_ENV` is associated with the expression `process.env.NODE_ENV` to be replaced, so the following usage is invalid:

```js
const { NODE_ENV } = process.env;
console.log(NODE_ENV);
// ❌ Won't get a string.
```
