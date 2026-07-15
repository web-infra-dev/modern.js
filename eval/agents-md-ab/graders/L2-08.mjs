// L2-08 (build_check): config-based route /home via src/modern.routes.ts +
// defineRoutes from '@modern-js/runtime/config-routes', keeping fileRoutes;
// src/home.tsx renders 'config-route-home'. react-router手写/自控路由 = 0.
export default async function grade(ctx, c) {
  const routes = ctx.stripComments(
    ctx.read('src/modern.routes.ts') ?? ctx.read('src/modern.routes.tsx'),
  );
  if (
    !c.add(
      'routes-file-exists',
      !!routes,
      'src/modern.routes.ts missing (v3 config-routes convention)',
    )
  )
    return;
  c.add(
    'define-routes-import',
    /import\s*\{[^}]*defineRoutes[^}]*\}\s*from\s*['"]@modern-js\/runtime\/config-routes['"]/.test(
      routes,
    ),
    "expects import { defineRoutes } from '@modern-js/runtime/config-routes'",
  );
  c.add(
    'registers-home-route',
    /['"]\/home['"]/.test(routes) && /home/.test(routes),
    "expects a '/home' route registered via route()/page() pointing at home.tsx",
  );
  c.add(
    'keeps-file-routes',
    /fileRoutes/.test(routes),
    'expects the conventional fileRoutes to be preserved in the returned routes',
  );
  const home = ctx.read('src/home.tsx') ?? ctx.read('src/home.jsx');
  c.add(
    'home-component',
    !!home && /config-route-home/.test(home),
    "expects src/home.tsx rendering 'config-route-home'",
  );
  const app = ctx.read('src/App.tsx') ?? '';
  c.add(
    'no-self-controlled-router',
    !/createBrowserRouter/.test(routes + app),
    'react-router createBrowserRouter / self-controlled routing = 0',
  );
  if (c.checks.some(x => !x.ok)) return;
  const b = await ctx.build();
  c.add(
    'build',
    b.ok,
    b.ok ? '' : `pnpm build exit ${b.code}: ${b.tail.slice(-300)}`,
  );
}
