// L1-07 (file_ast): dev proxy — v3 spelling dev.server.proxy with '/ext' →
// https://example.com (string or {target}); tools.devServer.proxy / dev.proxy
// (proxy directly under dev) = 0; build passes (TS validates the field).
export default async function grade(ctx, c) {
  const conf = ctx.stripComments(
    ctx.read('modern.config.ts') ?? ctx.read('modern.config.js'),
  );
  if (!c.add('config-exists', !!conf, 'modern.config.ts missing')) return;
  const dev = ctx.extractBlock(conf, 'dev') ?? '';
  const devServer = ctx.extractBlock(dev, 'server') ?? '';
  const proxyBlock = ctx.extractBlock(devServer, 'proxy') ?? '';
  const hasExt =
    /['"]\/ext['"]\s*:/.test(proxyBlock) &&
    /https:\/\/example\.com/.test(proxyBlock);
  c.add(
    'dev-server-proxy',
    hasExt,
    "expects dev.server.proxy with '/ext' → 'https://example.com'",
  );
  const devProxyDirect = (() => {
    // proxy directly under dev (not under dev.server) — v2-ish spelling
    const devWithoutServer = dev.replace(devServer, '');
    return /proxy\s*:/.test(devWithoutServer);
  })();
  c.add(
    'no-v2-spelling',
    !/tools\.devServer|devServer\s*:/.test(conf) && !devProxyDirect,
    'tools.devServer.proxy / dev.proxy are not the v3 location (dev.server.proxy)',
  );
  if (c.checks.some(x => !x.ok)) return;
  const b = await ctx.build();
  c.add(
    'build',
    b.ok,
    b.ok ? '' : `pnpm build exit ${b.code}: ${b.tail.slice(-300)}`,
  );
}
