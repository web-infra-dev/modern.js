// T06 (L2/code, build_check): /about route with conventional Data Loader.
export default async function grade(ctx, c) {
  const pageRel = [
    'src/routes/about/page.tsx',
    'src/routes/about/page.jsx',
  ].find(p => ctx.exists(p));
  const dataRel = [
    'src/routes/about/page.data.ts',
    'src/routes/about/page.data.tsx',
    'src/routes/about/page.data.js',
  ].find(p => ctx.exists(p));
  if (
    !c.add('about-page-exists', !!pageRel, 'src/routes/about/page.tsx missing')
  )
    return;
  if (
    !c.add(
      'about-page-data-exists',
      !!dataRel,
      'src/routes/about/page.data.ts missing (loader must live in the same-named .data file)',
    )
  )
    return;
  const data = ctx.stripComments(ctx.read(dataRel));
  const page = ctx.stripComments(ctx.read(pageRel));
  const okLoader = c.add(
    'loader-exported',
    /export\s+(const|async\s+function|function)\s+loader/.test(data),
    'page.data must export a loader',
  );
  const okTitle = c.add(
    'loader-returns-about-us',
    /About Us/.test(data),
    "loader must return { title: 'About Us' }",
  );
  const okUse = c.add(
    'page-uses-loader-data',
    /useLoaderData/.test(page) && /<h1[\s>]/.test(page),
    'page must consume loader data via useLoaderData and render an <h1>',
  );
  if (!(okLoader && okTitle && okUse)) return;
  const b = await ctx.build();
  c.add(
    'build',
    b.ok,
    b.ok
      ? ''
      : `pnpm build exit ${b.code}${b.timedOut ? ' (timeout)' : ''}: ${b.tail.slice(-300)}`,
  );
}
