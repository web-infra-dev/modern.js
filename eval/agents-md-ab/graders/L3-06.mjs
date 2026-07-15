// L3-06 (build_check): /blog subroute (own layout + page 'blog-page') + root
// routes/loading.tsx ('route-loading', default export) with layout.tsx present
// (precondition for Loading). React.lazy+Suspense hand-rolled = 0.
export default async function grade(ctx, c) {
  const loading =
    ctx.read('src/routes/loading.tsx') ?? ctx.read('src/routes/loading.jsx');
  c.add(
    'loading-file',
    !!loading &&
      /export\s+default/.test(loading) &&
      /route-loading/.test(loading),
    "src/routes/loading.tsx must default-export a component rendering 'route-loading'",
  );
  c.add(
    'root-layout-present',
    ctx.exists('src/routes/layout.tsx') || ctx.exists('src/routes/layout.jsx'),
    'src/routes/layout.tsx must exist (loading only works with a same-dir layout)',
  );
  c.add(
    'blog-layout',
    ctx.exists('src/routes/blog/layout.tsx') ||
      ctx.exists('src/routes/blog/layout.jsx'),
    'src/routes/blog/layout.tsx missing',
  );
  const blogPage =
    ctx.read('src/routes/blog/page.tsx') ??
    ctx.read('src/routes/blog/page.jsx');
  c.add(
    'blog-page',
    !!blogPage && /blog-page/.test(blogPage),
    "src/routes/blog/page.tsx rendering 'blog-page' missing",
  );
  c.add(
    'no-manual-lazy',
    !(loading && /React\.lazy|lazy\s*\(/.test(loading)),
    'hand-rolled React.lazy+Suspense loading = 0',
  );
  if (c.checks.some(x => !x.ok)) return;
  const b = await ctx.build();
  c.add(
    'build',
    b.ok,
    b.ok ? '' : `pnpm build exit ${b.code}: ${b.tail.slice(-300)}`,
  );
}
