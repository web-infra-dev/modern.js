// L1-02 (build_check): SSR with string rendering — server.ssr object with
// mode:'string'; ssr:true (no mode) or mode:'stream' = 0; build passes and
// emits the SSR server bundle.
import fs from 'node:fs';
import path from 'node:path';

export default async function grade(ctx, c) {
  const conf = ctx.stripComments(
    ctx.read('modern.config.ts') ?? ctx.read('modern.config.js'),
  );
  if (!c.add('config-exists', !!conf, 'modern.config.ts missing')) return;
  const server = ctx.extractBlock(conf, 'server') ?? '';
  const ssrBlock = ctx.extractBlock(server, 'ssr');
  c.add(
    'ssr-mode-string',
    !!ssrBlock && /mode\s*:\s*['"]string['"]/.test(ssrBlock),
    "expects server.ssr as an object with mode: 'string' (ssr:true or mode:'stream' fail)",
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
  c.add(
    'ssr-server-bundle',
    found,
    'no SSR server bundle (bundles/*.js) emitted',
  );
}
