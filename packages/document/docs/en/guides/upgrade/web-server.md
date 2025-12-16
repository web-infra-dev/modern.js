# Custom Web Server Changes

This chapter covers the upgrade of two types of legacy custom Server APIs:

- **unstableMiddleware**
- **Hook**

These two approaches are mutually exclusive in the legacy version. When migrating, please choose the corresponding path based on the capabilities actually used in the project.

## unstableMiddleware

### Core Differences

- **File Structure**: `server/index.ts` → `server/modern.server.ts`
- **Export Method**: `unstableMiddleware` array → `defineServerConfig`
- **Context API**: Modern.js Server Context → Hono Context (`c.req`/`c.res`)
- **Middleware Execution**: Legacy version could skip calling `next()`, new version must call it for subsequent chain to execute
- **Response Method**: `c.response.raw()` → `c.text()` / `c.json()`

### File and Export

```typescript
// Legacy - server/index.ts
export const unstableMiddleware: UnstableMiddleware[] = [middleware1, middleware2];

// New - server/modern.server.ts
import { defineServerConfig } from '@modern-js/server-runtime';

export default defineServerConfig({
  middlewares: [
    { name: 'middleware1', handler: middleware1 },
    { name: 'middleware2', handler: middleware2 },
  ],
});
```

### Type and next Call

```typescript
// Legacy
import type { UnstableMiddleware, UnstableMiddlewareContext } from '@modern-js/server-runtime';
const middleware: UnstableMiddleware = async (c: UnstableMiddlewareContext, next) => {
  return c.response.raw('response'); // Will continue rendering even without calling next
};

// New
import { defineServerConfig, type MiddlewareHandler } from '@modern-js/server-runtime';
const middleware: MiddlewareHandler = async (c, next) => {
  await next(); // Must call
  return c.text('response');
};
```

### Context API Comparison

| Legacy API               | New API                 | Description     |
| ----------------------- | ----------------------- | --------------- |
| `c.request.cookie`      | `getCookie(c, 'key')`   | Cookie reading  |
| `c.req.cookie()`        | `getCookie(c, 'key')`   | Hono v4 deprecated |
| `c.request.pathname`    | `c.req.path`            | Request path    |
| `c.request.host`        | `c.req.header('Host')` | Request host    |
| `c.request.query`       | `c.req.query()`         | Query parameters |
| `c.request.headers`     | `c.req.header()`        | Request headers |
| `c.response.status`     | `c.status()`            | Response status code |
| `c.response.set`        | `c.res.headers.set`     | Set response headers |
| `c.response.raw`        | `c.text` / `c.json`     | Response body   |

## afterRender Hook

`afterRender` is only used for HTML processing after page rendering is complete.

```typescript
import { defineServerConfig, type MiddlewareHandler } from '@modern-js/server-runtime';

const renderMiddleware: MiddlewareHandler = async (c, next) => {
  await next(); // Wait for page rendering first
  const { res } = c;
  const html = await res.text();

  const modified = html
    .replace('<head>', '<head><meta name="author" content="ByteDance">')
    .replace('<body>', '<body><div id="loading">Loading...</div>')
    .replace('</body>', '<script>console.log("Page loaded")</script></body>');

  c.res = c.body(modified, { status: res.status, headers: res.headers });
};

export default defineServerConfig({
  renderMiddlewares: [{ name: 'custom-content-injection', handler: renderMiddleware }],
});
```

