// L0-01 (file_ast): main title "AB Bench Home" + data-testid="main-title" in
// src/routes/page.tsx; build passes; "no other files changed" is checked via
// ctx.changedFiles() — a MANIFEST-based comparison (run dirs are not git
// repos) whose ignore list covers runner artifacts (.home/, .final-answer.txt,
// ANSWER.md, AGENTS.md/CLAUDE.md, node_modules, build outputs) so they never
// count as extra changes.
export default async function grade(ctx, c) {
  const page = ctx.read('src/routes/page.tsx');
  if (!c.add('page-exists', !!page, 'src/routes/page.tsx missing')) return;
  c.add(
    'title-text',
    /AB Bench Home/.test(page),
    'expects exact string "AB Bench Home"',
  );
  c.add(
    'data-testid',
    /data-testid=["']main-title["']/.test(page),
    'expects data-testid="main-title" on the title element',
  );
  const { modified, added, removed } = ctx.changedFiles();
  const extra = [
    ...modified.filter(f => f !== 'src/routes/page.tsx'),
    ...added,
    ...removed.map(f => `-${f}`),
  ];
  c.add(
    'only-page-changed',
    modified.includes('src/routes/page.tsx') && extra.length === 0,
    extra.length
      ? `other files changed: ${extra.slice(0, 5).join(', ')}`
      : 'src/routes/page.tsx not modified',
  );
  if (c.checks.some(x => !x.ok)) return;
  const b = await ctx.build();
  c.add(
    'build',
    b.ok,
    b.ok ? '' : `pnpm build exit ${b.code}: ${b.tail.slice(-300)}`,
  );
}
