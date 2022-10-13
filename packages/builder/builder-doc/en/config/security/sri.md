- **Type**:

```ts
type SRIOptions = {
  hashFuncNames?: []string;
  enabled?: "auto" | true | false;
  hashLoading?: "eager" | "lazy";
} | boolean;
```

- **Default**: `undefined`

Adding an integrity attribute (`integrity`) to sub-resources introduced by HTML allows the browser to verify the integrity of the introduced resource, thus preventing tampering with the downloaded resource.

Enabling this option will set the webpack [output.crossOriginLoading](https://webpack.js.org/configuration/output/#outputcrossoriginloading) configuration item to `anonymous`.

#### Introduce SRI

Subresource Integrity (SRI) is a security feature that enables browsers to verify that resources they fetch (for example, from a CDN) are delivered without unexpected manipulation. It works by allowing you to provide a cryptographic hash that a fetched resource must match.

For script tags, the result is to refuse to execute the code; for CSS links, the result is not to load the styles.

For more on subresource integrity, see [Subresource Integrity - MDN](https://developer.mozilla.org/en-US/docs/Web/Security/Subresource_Integrity).

#### Example

By default, `SRI` is not turned on, and when it is, its default configuration is as follows:

```js
{
  hashFuncNames: ['sha384'];
  enabled: "auto",
  hashLoading: "eager",
}
```

You can customize the configuration items according to your own needs:

```js
export default {
  security: {
    sri: {
      hashFuncNames: ['sha-256'],
      enabled: true,
      hashLoading: 'lazy',
    },
  },
};
```
