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

Enabling this option will set the Webpack [output.crossOriginLoading](https://webpack.js.org/configuration/output/#outputcrossoriginloading) configuration item to `anonymous`.

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
