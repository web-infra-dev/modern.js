// L3-01 (http_check, needs_serve): full BFF enablement — bffPlugin registered,
// tsconfig @api alias + include api, api/lambda/hello.ts export const get,
// page.tsx unified invocation via '@api/hello' (fetch('/api/hello') = 0);
// build → serve → GET /api/hello 200 containing 'Hello Modern.js'.
export default async function grade(ctx, c) {
  const conf = ctx.stripComments(
    ctx.read('modern.config.ts') ?? ctx.read('modern.config.js'),
  );
  c.add(
    'bff-plugin-registered',
    !!conf &&
      /import\s*\{[^}]*bffPlugin[^}]*\}\s*from\s*['"]@modern-js\/plugin-bff['"]/.test(
        conf,
      ) &&
      /bffPlugin\s*\(/.test(conf),
    'modern.config must import + register bffPlugin() from @modern-js/plugin-bff',
  );
  let ts;
  try {
    ts = JSON.parse(ctx.stripComments(ctx.read('tsconfig.json')));
  } catch {
    ts = null;
  }
  const paths = ts?.compilerOptions?.paths ?? {};
  const apiAlias = paths['@api/*'];
  c.add(
    'tsconfig-api-alias',
    Array.isArray(apiAlias) && apiAlias.some(p => /api\/lambda/.test(p)),
    'tsconfig paths must map "@api/*" → api/lambda',
  );
  c.add(
    'tsconfig-include-api',
    Array.isArray(ts?.include) && ts.include.includes('api'),
    'tsconfig include must contain "api"',
  );
  const api = ctx.stripComments(
    ctx.read('api/lambda/hello.ts') ?? ctx.read('api/lambda/hello.js') ?? '',
  );
  c.add(
    'api-hello-get',
    /export\s+(const|let|async\s+function|function)\s+get\b/i.test(api),
    'api/lambda/hello.ts must export const get',
  );
  const page = ctx.read('src/routes/page.tsx') ?? '';
  c.add(
    'unified-invocation',
    /from\s+['"]@api\/hello['"]/.test(page),
    "page.tsx must import from '@api/hello' (unified invocation)",
  );
  c.add(
    'no-plain-fetch',
    !/fetch\s*\(\s*['"`]\/api\/hello/.test(page),
    "fetch('/api/hello') instead of unified invocation = 0",
  );
  if (c.checks.some(x => !x.ok)) return;

  const b = await ctx.build();
  if (
    !c.add(
      'build',
      b.ok,
      b.ok ? '' : `pnpm build exit ${b.code}: ${b.tail.slice(-300)}`,
    )
  )
    return;

  await ctx.withServer(async srv => {
    if (
      !c.add(
        'serve-ready',
        srv.ready,
        srv.ready
          ? `port=${srv.port}`
          : `server not ready in 30s: ${srv.log()}`,
      )
    )
      return;
    let res;
    try {
      res = await srv.get('/api/hello');
    } catch (e) {
      c.add('http-api-hello', false, `GET /api/hello failed: ${e.message}`);
      return;
    }
    c.add(
      'http-api-hello',
      res.status === 200 && /Hello Modern\.js/.test(res.text),
      `GET /api/hello → ${res.status}, body: ${res.text.slice(0, 120)}`,
    );
  });
}
