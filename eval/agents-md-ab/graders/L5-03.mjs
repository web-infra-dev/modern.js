// L5-03 (file_ast, version-trap): /about page in the v3 conventional location
// src/routes/about/page.tsx (default export, 'about-page'); creating a
// src/pages/ directory (v1/Next-style) = 0. Build passes.
export default async function grade(ctx, c) {
  const page =
    ctx.read('src/routes/about/page.tsx') ??
    ctx.read('src/routes/about/page.jsx');
  c.add(
    'about-page-exists',
    !!page && /export\s+default/.test(page) && /about-page/.test(page),
    "expects src/routes/about/page.tsx default-exporting a component rendering 'about-page'",
  );
  c.add(
    'no-pages-directory',
    !ctx.exists('src/pages'),
    'src/pages/ (v1 / Next.js pages router convention) must not exist in v3',
  );
  if (c.checks.some(x => !x.ok)) return;
  const b = await ctx.build();
  c.add(
    'build',
    b.ok,
    b.ok ? '' : `pnpm build exit ${b.code}: ${b.tail.slice(-300)}`,
  );
}
