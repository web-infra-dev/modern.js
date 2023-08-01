- **Type:** `undefined | Array<string | PreconnectOption>`
```ts
interface PreconnectOption {
  href: string;
  crossorigin?: boolean;
}
```
- **Default:** `undefined`

Specifies that the user agent should preemptively connect to the target resource's origin, refer to [preconnect](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/rel/preconnect).

Configuring this property will establish a connection with the server. If the site is HTTPS, this process includes DNS resolution, TCP connection establishment, and TLS handshake. Combining Preconnect and DnsPrefetch can further reduce the delay of cross-domain requests.

### Example

```js
export default {
  performance: {
    preconnect: ['http://xxx.com'],
  },
};
```
