// L2-07 (build_check): SSR on + homepage Data Loader in its own conventional
// file returning 'ssr-loader-ok'; page uses useLoaderData; build passes with
// SSR server bundle.
import fs from 'node:fs';
import path from 'node:path';

export default async function grade(ctx, c) {
  const conf = ctx.stripComments(
    ctx.read('modern.config.ts') ?? ctx.read('modern.config.js'),
  );
  const server = conf ? (ctx.extractBlock(conf, 'server') ?? '') : '';
  c.add(
    'ssr-enabled',
    /ssr\s*:\s*(true|\{)/.test(server),
    'expects server.ssr: true (or valid object)',
  );
  const dataRel = ['src/routes/page.data.ts', 'src/routes/page.data.tsx'].find(
    p => ctx.exists(p),
  );
  if (
    !c.add(
      'data-file-exists',
      !!dataRel,
      'src/routes/page.data.ts missing (loader must be in the conventional separate file)',
    )
  )
    return;
  const data = ctx.stripComments(ctx.read(dataRel));
  c.add(
    'loader-exported',
    /export\s+(const|async\s+function|function)\s+loader/.test(data),
    'page.data must export const loader',
  );
  c.add(
    'loader-returns-token',
    /ssr-loader-ok/.test(data),
    "loader must return { now: 'ssr-loader-ok' }",
  );
  const page = ctx.read('src/routes/page.tsx') ?? '';
  c.add(
    'page-uses-loader-data',
    /useLoaderData/.test(page),
    'page.tsx must use useLoaderData',
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
  let found = false;
  for (const root of ['dist', 'build', 'build_output']) {
    const dir = path.join(ctx.runDir, root, 'bundles');
    if (fs.existsSync(dir) && fs.readdirSync(dir).some(f => f.endsWith('.js')))
      found = true;
  }
  c.add('ssr-server-bundle', found, 'no SSR server bundle emitted');
}
