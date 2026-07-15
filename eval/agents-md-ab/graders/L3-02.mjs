// L3-02 (build_check — server-runtime preinstalled in templates): v3 custom web server —
// server/modern.server.ts + defineServerConfig from '@modern-js/server-runtime',
// middleware { name: 'request-timing', handler } with await next() and
// x-render-by header; tsconfig include "server"; build must pass (deps preinstalled).
export default async function grade(ctx, c) {
  const src = ctx.stripComments(
    ctx.read('server/modern.server.ts') ?? ctx.read('server/modern.server.js'),
  );
  if (
    !c.add(
      'server-file-exists',
      !!src,
      'server/modern.server.ts missing (v2 server/index.ts hook form = 0)',
    )
  )
    return;
  c.add(
    'define-server-config-import',
    /import\s*\{[^}]*defineServerConfig[^}]*\}\s*from\s*['"]@modern-js\/server-runtime['"]/.test(
      src,
    ),
    "expects import { defineServerConfig } from '@modern-js/server-runtime'",
  );
  c.add(
    'middleware-request-timing',
    /middlewares/.test(src) &&
      /['"]request-timing['"]/.test(src) &&
      /handler/.test(src),
    "expects middlewares: [{ name: 'request-timing', handler }]",
  );
  c.add(
    'handler-await-next',
    /await\s+next\s*\(/.test(src),
    'handler must await next()',
  );
  c.add(
    'x-render-by-header',
    /x-render-by/.test(src),
    'handler must set the x-render-by response header',
  );
  c.add(
    'no-v2-convention',
    !ctx.exists('server/index.ts') && !ctx.exists('server/index.js'),
    'server/index.ts (v2 hook convention) = 0',
  );
  let ts;
  try {
    ts = JSON.parse(ctx.stripComments(ctx.read('tsconfig.json')));
  } catch {
    ts = null;
  }
  c.add(
    'tsconfig-include-server',
    Array.isArray(ts?.include) && ts.include.includes('server'),
    'tsconfig include must contain "server"',
  );
}
