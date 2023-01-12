- Type: `Record<string, ArrayOrNot<HtmlInjectTag | HtmlInjectTagHandler>>`
- Default: `undefined`

Used for multiple entry applications, injecting different tags for each entry.

The usage is the same as `tags`, and you can use the "entry name" as the key to set each page individually.

`tagsByEntries` will override the value set in `tags`.

#### Example

```js
export default {
  html: {
    tags: [
      { tag: 'script', attrs: { src: 'a.js' } }
    ],
    tagsByEntries: {
      foo: [
        { tag: 'script', attrs: { src: 'b.js' } }
      ],
    },
  },
};
```

Compile the application and you can see a tag injected on the `foo` page:

```html
<script src="b.js"></script>
```

And for any other pages:

```html
<script src="a.js"></script>
```
