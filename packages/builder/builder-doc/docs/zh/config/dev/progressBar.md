- **Type:**

```ts
type ProgressBar =
  | boolean
  | {
      id?: string;
    };
```

- **Default:** `true`

是否在编译过程中展示进度条。

```js
export default {
  dev: {
    progressBar: false,
  },
};
```

如果需要修改进度条左侧显示的文本内容，可以设置 `id` 选项：

```ts
export default {
  dev: {
    progressBar: {
      id: 'Some Text',
    },
  },
};
```
