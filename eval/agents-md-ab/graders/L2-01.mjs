// L2-01 (build_check): dynamic route /user/:id with conventional Data Loader
// in src/routes/user/[id]/page.data.ts (loader uses params); page uses
// useLoaderData from '@modern-js/runtime/router'. Loader inside page.tsx,
// getServerSideProps or useEffect-fetch = 0. Build passes.
export default async function grade(ctx, c) {
  const dataRel = [
    'src/routes/user/[id]/page.data.ts',
    'src/routes/user/[id]/page.data.tsx',
  ].find(p => ctx.exists(p));
  const pageRel = [
    'src/routes/user/[id]/page.tsx',
    'src/routes/user/[id]/page.jsx',
  ].find(p => ctx.exists(p));
  if (
    !c.add(
      'data-file-exists',
      !!dataRel,
      'src/routes/user/[id]/page.data.ts missing',
    )
  )
    return;
  if (!c.add('page-exists', !!pageRel, 'src/routes/user/[id]/page.tsx missing'))
    return;
  const data = ctx.stripComments(ctx.read(dataRel));
  const page = ctx.stripComments(ctx.read(pageRel));
  c.add(
    'loader-exported',
    /export\s+(const|async\s+function|function)\s+loader/.test(data),
    'page.data must export const loader',
  );
  c.add(
    'loader-uses-params',
    /params/.test(data),
    'loader must take params (LoaderFunctionArgs) for the dynamic :id',
  );
  c.add(
    'page-uses-loader-data',
    /useLoaderData/.test(page) &&
      /['"]@modern-js\/runtime\/router['"]/.test(page),
    "page must use useLoaderData imported from '@modern-js/runtime/router'",
  );
  c.add(
    'no-foreign-pattern',
    !/getServerSideProps/.test(page + data) &&
      !/export\s+(const|async\s+function|function)\s+loader/.test(page),
    'loader must live in the .data file, not the page; getServerSideProps is Next.js',
  );
  if (c.checks.some(x => !x.ok)) return;
  const b = await ctx.build();
  c.add(
    'build',
    b.ok,
    b.ok ? '' : `pnpm build exit ${b.code}: ${b.tail.slice(-300)}`,
  );
}
