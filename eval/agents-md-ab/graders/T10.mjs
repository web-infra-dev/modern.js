// T10 (L2/code, html_check): html.title "Eval App" + meta description
// "eval description" — asserted on the BUILT html (framework config route),
// with a fast static precheck on the config to reject hand-written HTML paths.
export default async function grade(ctx, c) {
  const conf = ctx.stripComments(
    ctx.read('modern.config.ts') ?? ctx.read('modern.config.js'),
  );
  const okConf = c.add(
    'config-has-title',
    conf && /Eval App/.test(conf),
    "modern.config must set the title via framework config (expects 'Eval App' in config)",
  );
  if (!okConf) return;
  const b = await ctx.build();
  if (
    !c.add(
      'build',
      b.ok,
      b.ok
        ? ''
        : `pnpm build exit ${b.code}${b.timedOut ? ' (timeout)' : ''}: ${b.tail.slice(-300)}`,
    )
  )
    return;
  const htmls = ctx.htmlFiles();
  if (!c.add('html-emitted', htmls.length > 0, 'no .html emitted by build'))
    return;
  const titleRe = /<title>\s*Eval App\s*<\/title>/;
  const metaRe =
    /<meta[^>]*name=["']description["'][^>]*content=["']eval description["'][^>]*>|<meta[^>]*content=["']eval description["'][^>]*name=["']description["'][^>]*>/;
  let titleOk = false;
  let metaOk = false;
  for (const h of htmls) {
    const s = ctx.read(h) ?? '';
    if (titleRe.test(s) && metaRe.test(s)) {
      titleOk = true;
      metaOk = true;
      break;
    }
    if (titleRe.test(s)) titleOk = true;
    if (metaRe.test(s)) metaOk = true;
  }
  c.add(
    'html-title',
    titleOk,
    `<title>Eval App</title> not found in built html (${htmls.join(', ')})`,
  );
  c.add(
    'html-meta-description',
    metaOk,
    'meta name="description" content="eval description" not found in built html',
  );
}
