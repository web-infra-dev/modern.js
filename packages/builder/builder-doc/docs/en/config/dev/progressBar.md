- **Type:**

```ts
type ProgressBar =
  | boolean
  | {
      id?: string;
    };
```

- **Default:** `true`

Whether to display progress bar during compilation.

```js
export default {
  dev: {
    progressBar: false,
  },
};
```

If you need to modify the text displayed on the left side of the progress bar, you can set the `id` option:

```ts
export default {
  dev: {
    progressBar: {
      id: 'Some Text',
    },
  },
};
```
