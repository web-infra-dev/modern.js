- **Type:** `undefined | string[]`

- **Default:** `undefined`

Specifies that the user agent should preemptively perform DNS resolution for the target resource's origin, refer to [dns-prefetch](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/rel/dns-prefetch).

After this property is set, the domain name can be resolved before the resource is requested, reducing request latency and improving loading performance.

See [Using dns-prefetch](https://developer.mozilla.org/en-US/docs/Web/Performance/dns-prefetch) for more details.

### Example

```js
export default {
  performance: {
    dnsPrefetch: ['http://xxx.com'],
  },
};
```
