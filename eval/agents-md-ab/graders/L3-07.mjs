// L3-07 (file_ast): router basename '/app' in src/modern.runtime.ts via
// defineRuntimeConfig (v3 location); runtime.router in modern.config.ts = 0;
// build passes.
export default async function grade(ctx, c) {
  const rt = ctx.stripComments(
    ctx.read('src/modern.runtime.ts') ?? ctx.read('src/modern.runtime.tsx'),
  );
  if (
    !c.add(
      'runtime-file-exists',
      !!rt,
      'src/modern.runtime.ts missing (v3 runtime config location)',
    )
  )
    return;
  c.add(
    'define-runtime-config-import',
    /import\s*\{[^}]*defineRuntimeConfig[^}]*\}\s*from\s*['"]@modern-js\/runtime['"]/.test(
      rt,
    ),
    "expects import { defineRuntimeConfig } from '@modern-js/runtime'",
  );
  const routerBlock = ctx.extractBlock(rt, 'router') ?? '';
  c.add(
    'router-basename',
    /basename\s*:\s*['"]\/app['"]/.test(routerBlock),
    "expects router: { basename: '/app' } in defineRuntimeConfig",
  );
  const conf = ctx.stripComments(ctx.read('modern.config.ts') ?? '');
  const confRuntime = ctx.extractBlock(conf, 'runtime') ?? '';
  c.add(
    'no-runtime-in-config',
    !/router/.test(confRuntime),
    'runtime.router must NOT be added to modern.config.ts in v3',
  );
  if (c.checks.some(x => !x.ok)) return;
  const b = await ctx.build();
  c.add(
    'build',
    b.ok,
    b.ok ? '' : `pnpm build exit ${b.code}: ${b.tail.slice(-300)}`,
  );
}
