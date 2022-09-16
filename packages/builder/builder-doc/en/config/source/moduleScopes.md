- Type: `Array<string | Regexp> | Function`
- Default: `undefined`

Restrict importing paths. After configuring this option, all source files can only import code from the specific paths, and import code from other paths is not allowed.

#### Example

First, we configure `moduleScopes` to only include the `src` directory:

```js
export default {
  source: {
    moduleScopes: ['./src'],
  },
};
```

Then we import the `utils/a` module outside the `src` directory in `src/App.tsx`:

```js
import a from '../utils/a';
```

After compiling, there will be a reference path error:

![scopes-error](https://lf3-static.bytednsdoc.com/obj/eden-cn/aphqeh7uhohpquloj/modern-js/docs/module-scopes-error.png)

If we configure the `utils` directory in `moduleScopes`, the error will disappear.

```js
export default {
  source: {
    moduleScopes: ['./src', './utils'],
  },
};
```

#### Array Type

You can directly set several paths like this:

```js
export default {
  source: {
    moduleScopes: ['./src', './shared', './utils'],
  },
};
```

#### Function Type

`moduleScopes` also supports setting as a function, which can be modified instead of overriding the default value:

```js
export default {
  source: {
    moduleScopes: scopes => {
      scopes.push('./shared');
    },
  },
};
```
