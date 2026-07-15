// L3-04 (build_check): route-level error boundary — src/routes/boom/page.tsx
// throws; src/routes/boom/error.tsx default-exports a component using
// useRouteError from '@modern-js/runtime/router'; build passes.
// class ErrorBoundary(componentDidCatch) or misplaced error file = 0.
export default async function grade(ctx, c) {
  const page = ctx.stripComments(ctx.read('src/routes/boom/page.tsx') ?? '');
  c.add(
    'boom-page-throws',
    /throw\s+new\s+Error\s*\(\s*['"]boom-error['"]/.test(page) ||
      (/throw\b/.test(page) && !!page),
    page ? 'boom page must throw' : 'src/routes/boom/page.tsx missing',
  );
  const err = ctx.stripComments(
    ctx.read('src/routes/boom/error.tsx') ??
      ctx.read('src/routes/boom/error.jsx') ??
      '',
  );
  if (
    !c.add(
      'error-file-exists',
      !!err,
      'src/routes/boom/error.tsx missing (conventional error boundary location)',
    )
  )
    return;
  c.add(
    'error-default-export',
    /export\s+default/.test(err),
    'error.tsx must default-export a component',
  );
  c.add(
    'use-route-error',
    /import\s*\{[^}]*useRouteError[^}]*\}\s*from\s*['"]@modern-js\/runtime\/router['"]/.test(
      err,
    ),
    "expects useRouteError imported from '@modern-js/runtime/router'",
  );
  c.add(
    'no-class-error-boundary',
    !/componentDidCatch/.test(err + page),
    'hand-written class ErrorBoundary = 0',
  );
  if (c.checks.some(x => !x.ok)) return;
  const b = await ctx.build();
  c.add(
    'build',
    b.ok,
    b.ok ? '' : `pnpm build exit ${b.code}: ${b.tail.slice(-300)}`,
  );
}
