- Type: `string | string[]`
- Default: `undefined`

Add a script before the entry file of each page. This script will be executed before the page code. It can be used to execute global logics, such as injecting polyfills, setting global styles, etc.

#### Add a single script

First create a `src/polyfill.ts` file:

```js
console.log('I am a polyfill');
```

Then configure `src/polyfill.ts` to `source.preEntry`:

```js
export default {
  source: {
    preEntry: './src/polyfill.ts',
  },
};
```

Re-run the compilation and visit any page, you can see that the code in `src/polyfill.ts` has been executed, and the `I am a polyfill` is logged in the console.

#### Add global style

You can also configure the global style through `source.preEntry`, this CSS code will be loaded earlier than the page code, such as introducing a `normalize.css` file:

```js
export default {
  source: {
    preEntry: './src/normalize.css',
  },
};
```

#### Add multiple scripts

You can add multiple scripts by setting `preEntry` to an array, and they will be executed in array order:

```js
export default {
  source: {
    preEntry: ['./src/polyfill-a.ts', './src/polyfill-b.ts'],
  },
};
```
