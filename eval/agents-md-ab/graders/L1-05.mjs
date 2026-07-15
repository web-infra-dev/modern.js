// L1-05 (html_check): html.meta description 'modernjs ab benchmark';
// built html must contain the meta tag (attribute order free).
export default async function grade(ctx, c) {
  const conf = ctx.stripComments(
    ctx.read('modern.config.ts') ?? ctx.read('modern.config.js'),
  );
  c.add(
    'config-html-meta',
    !!conf &&
      /description\s*:/.test(conf) &&
      /modernjs ab benchmark/.test(conf),
    "expects html.meta description: 'modernjs ab benchmark' in modern.config.ts",
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
  const metaRe =
    /<meta[^>]*name=["']description["'][^>]*content=["']modernjs ab benchmark["'][^>]*>|<meta[^>]*content=["']modernjs ab benchmark["'][^>]*name=["']description["'][^>]*>/;
  const ok = ctx.htmlFiles().some(h => metaRe.test(ctx.read(h) ?? ''));
  c.add(
    'html-meta-description',
    ok,
    'meta description "modernjs ab benchmark" not found in built html',
  );
}
