// L1-01 (file_ast): dev/serve port 3100 via server.port; dev.port and
// tools.devServer are v2 spellings and judged 0; build passes.
export default async function grade(ctx, c) {
  const conf = ctx.stripComments(
    ctx.read('modern.config.ts') ?? ctx.read('modern.config.js'),
  );
  if (!c.add('config-exists', !!conf, 'modern.config.ts missing')) return;
  const server = ctx.extractBlock(conf, 'server');
  c.add(
    'server-port-3100',
    !!server && /port\s*:\s*3100\b/.test(server),
    'expects server: { port: 3100 }',
  );
  const dev = ctx.extractBlock(conf, 'dev');
  const devPort = !!dev && /port\s*:/.test(dev);
  c.add(
    'no-v2-spelling',
    !devPort && !/tools\s*:[\s\S]*devServer|tools\.devServer/.test(conf),
    'dev.port / tools.devServer are v2 spellings (removed in v3)',
  );
  if (c.checks.some(x => !x.ok)) return;
  const b = await ctx.build();
  c.add(
    'build',
    b.ok,
    b.ok ? '' : `pnpm build exit ${b.code}: ${b.tail.slice(-300)}`,
  );
}
