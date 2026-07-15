// L3-08 (build_check): data write loop — src/routes/notes/page.data.ts exports
// BOTH loader and action (action uses request); page uses useFetcher (from
// '@modern-js/runtime/router') + .submit + useLoaderData. Action in the
// component file or hand-rolled fetch POST = 0. Build passes.
export default async function grade(ctx, c) {
  const dataRel = [
    'src/routes/notes/page.data.ts',
    'src/routes/notes/page.data.tsx',
  ].find(p => ctx.exists(p));
  if (
    !c.add(
      'data-file-exists',
      !!dataRel,
      'src/routes/notes/page.data.ts missing',
    )
  )
    return;
  const data = ctx.stripComments(ctx.read(dataRel));
  c.add(
    'loader-exported',
    /export\s+(const|async\s+function|function)\s+loader/.test(data),
    'page.data must export loader',
  );
  const actionM = /export\s+(const|async\s+function|function)\s+action/.test(
    data,
  );
  c.add('action-exported', actionM, 'page.data must export action');
  c.add(
    'action-uses-request',
    actionM && /action[^;]*\(\s*\{[^}]*request|request\s*\}/s.test(data),
    'action must read data from its request argument',
  );
  const page = ctx.stripComments(ctx.read('src/routes/notes/page.tsx') ?? '');
  c.add(
    'use-fetcher-submit',
    /import\s*\{[^}]*useFetcher[^}]*\}\s*from\s*['"]@modern-js\/runtime\/router['"]/.test(
      page,
    ) && /\.submit\s*\(|submit\s*\(/.test(page),
    "page must obtain submit via useFetcher (from '@modern-js/runtime/router') and call it",
  );
  c.add(
    'use-loader-data',
    /useLoaderData/.test(page),
    'page must render the list via useLoaderData',
  );
  c.add(
    'no-diy-endpoint',
    !/export\s+(const|async\s+function|function)\s+action/.test(page) &&
      !/fetch\s*\(\s*['"][^'"]*['"]\s*,\s*\{[^}]*post/is.test(page),
    'action in the component file / hand-rolled fetch POST endpoint = 0',
  );
  if (c.checks.some(x => !x.ok)) return;
  const b = await ctx.build();
  c.add(
    'build',
    b.ok,
    b.ok ? '' : `pnpm build exit ${b.code}: ${b.tail.slice(-300)}`,
  );
}
