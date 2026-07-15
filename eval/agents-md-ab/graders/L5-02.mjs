// L5-02 (file_ast, version-trap): isBrowser via v3 API — RuntimeContext
// imported from '@modern-js/runtime', consumed with use(RuntimeContext) or
// useContext(RuntimeContext), isBrowser destructured at the top level.
// Any useRuntimeContext() call (v2, deprecated) = 0. Build passes.
export default async function grade(ctx, c) {
  const layout = ctx.stripComments(ctx.read('src/routes/layout.tsx') ?? '');
  if (!c.add('layout-exists', !!layout, 'src/routes/layout.tsx missing'))
    return;
  c.add(
    'runtime-context-import',
    /import\s*\{[^}]*RuntimeContext[^}]*\}\s*from\s*['"]@modern-js\/runtime['"]/.test(
      layout,
    ),
    "expects import { RuntimeContext } from '@modern-js/runtime'",
  );
  c.add(
    'use-runtime-context-value',
    /\buse(Context)?\s*\(\s*RuntimeContext\s*\)/.test(layout),
    'expects use(RuntimeContext) or useContext(RuntimeContext)',
  );
  // v3 moved isBrowser to the TOP LEVEL of the context value: it must be
  // destructured directly from the use(RuntimeContext)/useContext(...) return
  // value ({ isBrowser } = ...), not read as context.isBrowser (v2 shape).
  c.add(
    'isbrowser-top-level-destructure',
    /(?:const|let|var)\s*\{[^}]*\bisBrowser\b[^}]*\}\s*=\s*use(?:Context)?\s*\(\s*RuntimeContext\s*\)/.test(
      layout,
    ),
    'isBrowser must be destructured at the top level of use(RuntimeContext)/useContext(RuntimeContext) — context.isBrowser property access (v2 shape) = 0',
  );
  c.add(
    'console-log-is-browser',
    /console\.log\s*\(\s*['"]is-browser['"]\s*,\s*isBrowser\s*[,)]/.test(
      layout,
    ),
    "expects console.log('is-browser', isBrowser) — first arg the literal 'is-browser', second the destructured isBrowser variable",
  );
  c.add(
    'no-deprecated-hook',
    !/useRuntimeContext\s*\(/.test(layout),
    'useRuntimeContext() is deprecated in v3 = 0',
  );
  if (c.checks.some(x => !x.ok)) return;
  const b = await ctx.build();
  c.add(
    'build',
    b.ok,
    b.ok ? '' : `pnpm build exit ${b.code}: ${b.tail.slice(-300)}`,
  );
}
