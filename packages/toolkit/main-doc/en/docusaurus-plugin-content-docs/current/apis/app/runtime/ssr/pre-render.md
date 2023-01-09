---
title: PreRender
---

A Helmet-like HOC without content implements SPA routing-level caching, manner without additional configuration.

## Usage

```tsx
import { PreRender } from '@modern-js/runtime/ssr';

export default () => (
  <>
    <PreRender interval={5} />
  </>
);
```

## Function Signature

The `PreRender` provides a set of configuration for controlling caching rules, expiration times, caching algorithms, and more.

```tsx
type Props {
  interval: number;
  staleLimit: number;
  level: number;
  include: { header?: string[], query?: string[] };
  matches: { header?: Record<string, any>, query?: Record<string, any> }
}

function PreRender(props: Props): React.Component
```

### Input

- `interval`: set the time the cache keep fresh，seconds. During this time, the cache will be used directly and not invoke asynchronous rendering.
- `staleLimit`: sets the time when the cache is completely expired，seconds。During this time, The cache can be returned and asynchronous rendering will be invoke, otherwise must wait for the re-rendered result.
- `level`: sets the calculation rule level for the cache identity, usually used with `includes` and `matches`. The default value is `0`.

```bash
0: pathname
1: pathname + querystring
2: pathname + headers
3: pathname + querystring + headers
```

- `includes`: sets the content that needs to be included in the cache identifier, used when the `level` is not `0`. The default value is `null`.
- `matches`: sets the rewriting rule for the value of query or header in cache identity, usually used in cache category, supports regular expressions. The default value is `null`.

## Example

```tsx
import { PreRender } from '@modern-js/runtime/ssr';

export default function App() {
  return (
    <>
      <PreRender interval={10} />
      <div>Hello Modern</div>
    </>
  );
}
```

The following example shows how to add the parameters in the query and header into the cache identifier calculation:

```tsx
/* calculate cache identifier using channel in query and language in header */
<PreRender
  interval={10}
  level={2}
  includes={{
    query: ['channel'],
    header: ['language'],
  }}
/>
```

The following example shows how not to let the test channel affect the online cache:

```tsx
/* rewrite the channel value starting with test_ in the query as "testChannel", otherwise rewrite it as "otherChannel" */
<PreRender interval={10} level={2} includes={{
  query: ["channel"],
  header: ["language"]
}} matches={{
  query: {
    channel: {
      "testChannel", "^test_",
      "otherChannel", ".*"
    }
  }
}} />
```
