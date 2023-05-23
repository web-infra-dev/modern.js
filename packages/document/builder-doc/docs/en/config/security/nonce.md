- **Type:**

```ts
type Nonce = string;
```

- **Default:** `undefined`

Add a random attribute value --- nonce, to the scripts resources introduced for HTML. This allows the browser to determine whether the script can be executed when it parses inline scripts with matching nonce values.

#### Introduce nonce

The nonce mechanism plays a crucial role in Content Security Policy (CSP), enhancing webpage security. It allows developers to define a unique and random string value, i.e., nonce, for inline `<script>` tags within CSP.

When the browser parses inline scripts with matching nonce values, it allows them to be executed or applied, otherwise CSP will prevent them from running. This effectively prevents potential Cross-Site Scripting (XSS) attacks. It's worth noting that a new nonce value should be generated each time the page is accessed.

For more information about nonce, you can check [nonce - MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/nonce)。

### Example

By default, `nonce` is not enabled，You can define this value based on your needs:

```js
export default {
  security: {
    nonce: 'my-project-nonce',
  },
};
```

Typically, we can define a fixed value in the project, and replace it with a random value on downstream servers such as Nginx, Web Server, gateway, etc.
