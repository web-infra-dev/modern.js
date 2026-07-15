// L3-03 (build_check): streaming SSR + deferred data — defer from
// '@modern-js/runtime/router' returning defer({...}) (object, not bare
// Promise); page uses <Await resolve> inside <Suspense>; build passes.
export default async function grade(ctx, c) {
  const conf = ctx.stripComments(
    ctx.read('modern.config.ts') ?? ctx.read('modern.config.js'),
  );
  const server = conf ? (ctx.extractBlock(conf, 'server') ?? '') : '';
  c.add(
    'ssr-stream-enabled',
    /ssr\s*:\s*true/.test(server) || /mode\s*:\s*['"]stream['"]/.test(server),
    "expects streaming SSR on (server.ssr true or mode:'stream')",
  );
  const dataRel = [
    'src/routes/stream/page.data.ts',
    'src/routes/stream/page.data.tsx',
  ].find(p => ctx.exists(p));
  if (
    !c.add(
      'data-file-exists',
      !!dataRel,
      'src/routes/stream/page.data.ts missing',
    )
  )
    return;
  const data = ctx.stripComments(ctx.read(dataRel));
  c.add(
    'defer-import',
    /import\s*\{[^}]*\bdefer\b[^}]*\}\s*from\s*['"]@modern-js\/runtime\/router['"]/.test(
      data,
    ),
    "defer must be imported from '@modern-js/runtime/router' (react-router-dom = 0)",
  );
  c.add(
    'defer-returns-object',
    /return\s+defer\s*\(\s*\{/.test(data),
    'defer must receive an object ({ data: promise }), not a bare Promise',
  );
  const page = ctx.read('src/routes/stream/page.tsx') ?? '';
  c.add(
    'await-in-suspense',
    /<Await[^>]*resolve=\{/.test(page) &&
      /Suspense/.test(page) &&
      /['"]@modern-js\/runtime\/router['"]/.test(page),
    "page must render <Await resolve={...}> (from '@modern-js/runtime/router') wrapped in <Suspense>",
  );
  if (c.checks.some(x => !x.ok)) return;
  const b = await ctx.build();
  c.add(
    'build',
    b.ok,
    b.ok ? '' : `pnpm build exit ${b.code}: ${b.tail.slice(-300)}`,
  );
}
