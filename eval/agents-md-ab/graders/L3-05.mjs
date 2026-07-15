// L3-05 (html_check): multi-entry — main entry moved to src/demo-app/routes/
// (same as package.json name), new src/admin/routes/page.tsx ('admin-entry'),
// no top-level src/routes/ left; build emits index.html for both entries.
import path from 'node:path';

export default async function grade(ctx, c) {
  c.add(
    'main-entry-dir',
    ctx.exists('src/demo-app/routes') &&
      ctx.findFiles(r => r.startsWith('src/demo-app/routes/')).length > 0,
    'src/demo-app/routes/ (package.json name convention) missing',
  );
  const admin =
    ctx.read('src/admin/routes/page.tsx') ??
    ctx.read('src/admin/routes/page.jsx');
  c.add(
    'admin-entry-page',
    !!admin && /admin-entry/.test(admin),
    "src/admin/routes/page.tsx rendering 'admin-entry' missing",
  );
  c.add(
    'no-top-level-routes',
    !ctx.exists('src/routes'),
    'src/routes/ must be migrated into the named main-entry directory',
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
  const htmls = ctx.htmlFiles().filter(h => path.basename(h) === 'index.html');
  const adminHtml = htmls.some(h => h.split('/').includes('admin'));
  const mainHtml = htmls.some(h => !h.split('/').includes('admin'));
  c.add(
    'two-entry-htmls',
    adminHtml && mainHtml,
    `expected index.html for both entries, got: ${htmls.join(', ') || 'none'}`,
  );
}
