- **Type:** `boolean | 'anonymous' | 'use-credentials'`
- **Default:** `false`

Set the [crossorigin](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/crossorigin) attribute of the `<script>` tag.

When true is passed, it is automatically set to `crossorigin="anonymous"`.

### Example

```js
export default {
  html: {
    crossorigin: 'anonymous',
  },
};
```

After compilation, the `<script>` tag in HTML becomes:

```html
<script defer src="/static/js/main.js" crossorigin="anonymous"></script>
```
