---
title: hook
---

Used to add framework middleware under BFF function mode, the middleware will execute before BFF function.

## Usage

according to the framework extend plugin, export from the corresponding namespace:

```ts
import { hook } from '@modern-js/runtime/{namespace}';
```

## Function Signature

```ts
type HookOptions = {
  addMiddleware: string | function
}

function hook(options: HookOptions): void
```

### Input

- `options`: a range of hooks provided by Modern.js.
  - `addMiddleware`: add middlewares for BFF.

## Example

middleware for different frameworks should be different(an example is when using the koa framework):

```ts title=api/_app.ts
import { hook } from '@modern-js/runtime/koa';

export default hook(({ addMiddleware }) => {
  addMiddleware(async (ctx, next) => {
    ctx.req.query.id = 'koa';
    await next();
  });
});
```
