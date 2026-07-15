// L3-02 (build_check — @modern-js/server-runtime preinstalled in BOTH
// templates): v3 custom web server. Bank v2.2 rules, all asserted here:
//   - server/modern.server.ts exists (v2 server/index.ts hook form = 0)
//   - import { defineServerConfig } from '@modern-js/server-runtime'
//   - the config object is the DEFAULT EXPORT (export default
//     defineServerConfig(...) directly or via an intermediate const)
//   - middlewares contains { name: 'request-timing', handler }
//   - handler awaits next() and sets the x-render-by header to 'modern-ab'
//   - no v2 server/index.ts convention left behind
//   - tsconfig.json include contains "server"
//   - `pnpm build` exits 0 (runs only after every static assertion passes)
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
  // default export of the defineServerConfig(...) config object — either
  // `export default defineServerConfig(` or `const cfg = defineServerConfig(`
  // + `export default cfg`.
  const directDefault = /export\s+default\s+defineServerConfig\s*\(/.test(src);
  const viaConst = (() => {
    const m = src.match(/export\s+default\s+([A-Za-z_$][\w$]*)\s*;?/);
    if (!m) return false;
    return new RegExp(
      `(const|let|var)\\s+${m[1].replace(/\$/g, '\\$')}\\s*=\\s*defineServerConfig\\s*\\(`,
    ).test(src);
  })();
  c.add(
    'default-export-config',
    directDefault || viaConst,
    'the defineServerConfig({...}) config object must be the default export',
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
    'x-render-by-header-value',
    /['"]x-render-by['"]\s*[,:]\s*['"]modern-ab['"]/.test(src),
    "handler must set the x-render-by response header to 'modern-ab'",
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
  if (c.checks.some(x => !x.ok)) return;
  const b = await ctx.build();
  c.add(
    'build',
    b.ok,
    b.ok
      ? ''
      : `pnpm build exit ${b.code}${b.timedOut ? ' (timeout)' : ''}: ${b.tail.slice(-300)}`,
  );
}
