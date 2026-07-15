// L1-06 (build_check): '@common' path alias via resolve.alias (source.alias is
// deprecated in v3 → 0); page imports '@common/greeting'; build passes.
export default async function grade(ctx, c) {
  const greeting =
    ctx.read('src/common/greeting.ts') ?? ctx.read('src/common/greeting.tsx');
  c.add(
    'greeting-file',
    !!greeting && /GREETING/.test(greeting) && /hello-alias/.test(greeting),
    "expects src/common/greeting.ts exporting GREETING = 'hello-alias'",
  );
  const conf = ctx.stripComments(
    ctx.read('modern.config.ts') ?? ctx.read('modern.config.js'),
  );
  if (!c.add('config-exists', !!conf, 'modern.config.ts missing')) return;
  const resolveBlock = ctx.extractBlock(conf, 'resolve');
  c.add(
    'resolve-alias',
    !!resolveBlock &&
      /alias/.test(resolveBlock) &&
      /@common/.test(resolveBlock),
    "expects resolve.alias with '@common'",
  );
  const sourceBlock = ctx.extractBlock(conf, 'source');
  c.add(
    'no-deprecated-source-alias',
    !(sourceBlock && /alias/.test(sourceBlock)),
    'source.alias is deprecated in v3 — must use resolve.alias',
  );
  const page = ctx.read('src/routes/page.tsx') ?? '';
  c.add(
    'page-imports-alias',
    /from\s+['"]@common\/greeting['"]/.test(page),
    "page.tsx must import from '@common/greeting'",
  );
  if (c.checks.some(x => !x.ok)) return;
  const b = await ctx.build();
  c.add(
    'build',
    b.ok,
    b.ok ? '' : `pnpm build exit ${b.code}: ${b.tail.slice(-300)}`,
  );
}
