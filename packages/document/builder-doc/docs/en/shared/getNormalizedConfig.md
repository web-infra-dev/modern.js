Get the normalized Builder config, this method must be called after the `modifyBuilderConfig` hook is executed.

Compared with the `api.getBuilderConfig` method, the config returned by this method has been normalized, and the type definition of the config will be narrowed. For example, the `undefined` type of `config.html` will be removed.

It is recommended to use this method to get the Builder config.

- **Type**

```ts
function GetNormalizedConfig(): Readonly<NormalizedConfig>;
```
