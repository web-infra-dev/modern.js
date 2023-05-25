- **Type:** `boolean | 'anonymous' | 'use-credentials'`
- **Default:** `false`

Set the [crossorigin](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/crossorigin) attribute of the `<script>` and `<style>` tags.

- If `true` is passed, it will automatically be set to `crossorigin="anonymous"`.
- If `false` is passed, it will not set the `crossorigin` attr.

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

The `<style>` tag becomes:

```html
<link href="/static/css/main.css" rel="stylesheet" crossorigin="anonymous" />
```

### Optional Values

`crossorigin` can the set to the following values:

- `anonymous`: Request uses CORS headers and credentials flag is set to 'same-origin'. There is no exchange of user credentials via cookies, client-side SSL certificates or HTTP authentication, unless destination is the same origin.
- `use-credentials`: Request uses CORS headers, credentials flag is set to 'include' and user credentials are always included.
