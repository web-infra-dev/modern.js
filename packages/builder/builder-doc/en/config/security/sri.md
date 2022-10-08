- **Type**:

```ts
type SRIOptions = {
  hashFuncNames?: []string;
  enabled?: "auto" | true | false;
  hashLoading?: "eager" | "lazy";
} | boolean;
```

- **Default**: `undefined`

Enables the browser to verify the integrity of the subresources it acquires as a way to prevent tampering with the downloaded resources.

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
