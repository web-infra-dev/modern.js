// L1-04 (html_check): html.title = 'AB Demo Title'; built html contains it.
export default async function grade(ctx, c) {
  const conf = ctx.stripComments(
    ctx.read('modern.config.ts') ?? ctx.read('modern.config.js'),
  );
  c.add(
    'config-html-title',
    !!conf && /title\s*:\s*['"]AB Demo Title['"]/.test(conf),
    "expects html.title: 'AB Demo Title' in modern.config.ts",
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
  const ok = ctx
    .htmlFiles()
    .some(h => /<title>\s*AB Demo Title\s*<\/title>/.test(ctx.read(h) ?? ''));
  c.add(
    'html-title',
    ok,
    '<title>AB Demo Title</title> not found in built html',
  );
}
