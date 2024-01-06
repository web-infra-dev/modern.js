- **Type:** `undefined | true | PrefetchOption`
```ts
type IncludeType = 'async-chunks' | 'initial' | 'all-assets' | 'all-chunks';

type Filter = Array<string | RegExp> | ((filename: string) => boolean);

interface PrefetchOption {
  type?: IncludeType;
  include?: Filter;
  exclude?: Filter;
}
```
- **Default:** `undefined`

Specifies that the user agent should preemptively fetch and cache the target resource as it is likely to be required for a followup navigation. Refer to [prefetch](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/rel/prefetch).

### Boolean Type

When setting `performance.prefetch` to `true`, resources will be prefetched according to the following configuration:

```js
{
  type: 'async-chunks',
}
```

### Object Type

When the value of `performance.prefetch` is `object` type, the Builder will enable the prefetch capability for the specified resource according to the current configuration.

#### prefetch.type

The `type` field controls which resources will be pre-fetched, and supports secondary filtering of specified resources through `include` and `exclude`.

Currently supported resource types are as follows:

- `async-chunks`: prefetch all asynchronous resources (on the current page), including asynchronous js and its associated css, image, font and other resources.
- `initial`: prefetch all non-async resources (on the current page). It should be noted that if the current script has been added to the html template, no additional pre-fetching will be performed.
- `all-chunks`: prefetch all resources (on the current page), including all asynchronous and non-asynchronous resources.
- `all-assets`: prefetch all resources, and resources of other pages will be included in the MPA scenario.

#### Example

When you want to prefetch all image resources in png format on the current page, you can configure it as follows:

```js
export default {
  performance: {
    prefetch: {
      type: 'all-chunks',
      include: [/.*\.png$/]
    },
  },
};
```
