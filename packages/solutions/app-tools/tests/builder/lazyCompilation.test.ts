import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  aggregateEagerRouteComponentFiles,
  buildSSRLazyCompilationTest,
  collectRouteComponentFiles,
  normalizeModulePath,
  planSSRLazyCompilation,
} from '../../src/builder/shared/lazyCompilation';

describe('normalizeModulePath', () => {
  it('produces an absolute POSIX path', () => {
    const p = normalizeModulePath('/app/src/routes/about/page.tsx');
    // Absolute on either platform (POSIX `/...`, Windows `C:/...`); never a
    // backslash. `startsWith('/')` would wrongly fail on Windows where the
    // normalized path keeps its drive letter (e.g. `C:/app/...`).
    expect(path.isAbsolute(p)).toBe(true);
    expect(p.includes('\\')).toBe(false);
  });

  it('normalizes mixed separators consistently', () => {
    const a = normalizeModulePath('/app/src/routes/about/page.tsx');
    const b = normalizeModulePath('/app/src/routes/about/../about/page.tsx');
    expect(a).toBe(b);
  });

  it('resolves symlinks so both sides of the match line up', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'lazycompat-symlink-'));
    const real = path.join(dir, 'real', 'page.tsx');
    fs.mkdirSync(path.dirname(real), { recursive: true });
    fs.writeFileSync(real, '');
    const link = path.join(dir, 'link.tsx');
    try {
      fs.symlinkSync(real, link);
    } catch {
      // Platform without symlink permission (e.g. some Windows CI): skip.
      fs.rmSync(dir, { recursive: true, force: true });
      return;
    }
    expect(normalizeModulePath(link)).toBe(normalizeModulePath(real));
    fs.rmSync(dir, { recursive: true, force: true });
  });
});

describe('buildSSRLazyCompilationTest', () => {
  const routeFile = normalizeModulePath('/app/src/routes/about/page.tsx');
  const eagerRouteFiles = new Set([routeFile]);

  it('forces route component modules eager (false)', () => {
    const test = buildSSRLazyCompilationTest(eagerRouteFiles);
    expect(test({ resource: '/app/src/routes/about/page.tsx' })).toBe(false);
  });

  it('lazy (true) for non-route modules without a user test', () => {
    const test = buildSSRLazyCompilationTest(eagerRouteFiles);
    expect(test({ resource: '/app/src/components/Heavy.tsx' })).toBe(true);
  });

  it('delegates non-route modules to a function user test', () => {
    const userTest = (m: { resource?: string }) =>
      !/Heavy/.test(m.resource || '');
    const test = buildSSRLazyCompilationTest(eagerRouteFiles, userTest);
    expect(test({ resource: '/app/src/components/Heavy.tsx' })).toBe(false);
    expect(test({ resource: '/app/src/components/Light.tsx' })).toBe(true);
  });

  it('supports a RegExp user test', () => {
    const test = buildSSRLazyCompilationTest(eagerRouteFiles, /Heavy/);
    expect(test({ resource: '/app/src/components/Heavy.tsx' })).toBe(true);
    expect(test({ resource: '/app/src/components/Light.tsx' })).toBe(false);
    expect(test({ resource: '/app/src/routes/about/page.tsx' })).toBe(false);
  });

  it('keeps route eager even when user test always returns true', () => {
    const test = buildSSRLazyCompilationTest(eagerRouteFiles, () => true);
    expect(test({ resource: '/app/src/routes/about/page.tsx' })).toBe(false);
  });

  it('falls back to user test / true for empty resource', () => {
    expect(buildSSRLazyCompilationTest(eagerRouteFiles)({})).toBe(true);
    expect(
      buildSSRLazyCompilationTest(
        eagerRouteFiles,
        () => false,
      )({ resource: '' }),
    ).toBe(false);
  });
});

describe('collectRouteComponentFiles', () => {
  let dir: string;
  let srcDir: string;
  const srcAlias = '@_modern_js_src';

  beforeAll(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'lazycompat-'));
    srcDir = path.join(dir, 'src');
    fs.mkdirSync(path.join(srcDir, 'routes', 'about'), { recursive: true });
    fs.mkdirSync(path.join(srcDir, 'routes', 'user'), { recursive: true });
    fs.writeFileSync(path.join(srcDir, 'routes', 'about', 'page.tsx'), '');
    fs.writeFileSync(path.join(srcDir, 'routes', 'user', 'layout.tsx'), '');
  });

  afterAll(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('un-aliases and resolves _component (with/without extension), walks children', () => {
    const { resolvedFiles, unresolvedSpecifiers } = collectRouteComponentFiles(
      [
        {
          _component: `${srcAlias}/routes/user/layout`,
          children: [{ _component: `${srcAlias}/routes/about/page.tsx` }],
        },
      ],
      srcDir,
      srcAlias,
    );
    expect(
      resolvedFiles.has(
        normalizeModulePath(path.join(srcDir, 'routes', 'user', 'layout.tsx')),
      ),
    ).toBe(true);
    expect(
      resolvedFiles.has(
        normalizeModulePath(path.join(srcDir, 'routes', 'about', 'page.tsx')),
      ),
    ).toBe(true);
    expect(unresolvedSpecifiers).toHaveLength(0);
  });

  it('reports unresolvable components instead of dropping them silently', () => {
    const { resolvedFiles, unresolvedSpecifiers } = collectRouteComponentFiles(
      [
        { _component: `${srcAlias}/routes/about/page.tsx` },
        { _component: 'some-npm-pkg/Component' },
        { _component: `${srcAlias}/routes/missing/page` },
      ],
      srcDir,
      srcAlias,
    );
    expect(resolvedFiles.size).toBe(1);
    expect(unresolvedSpecifiers).toEqual([
      'some-npm-pkg/Component',
      `${srcAlias}/routes/missing/page`,
    ]);
  });
});

describe('aggregateEagerRouteComponentFiles', () => {
  const fileA = normalizeModulePath('/tmp/lazycompat-agg-app/src/a.tsx');

  it('returns an empty info for an undefined per-entry map', () => {
    const { files, unresolvedByEntry } =
      aggregateEagerRouteComponentFiles(undefined);
    expect(files.size).toBe(0);
    expect(unresolvedByEntry.size).toBe(0);
  });

  it('merges files across entries and surfaces unresolved per entry', () => {
    const byEntry = new Map([
      ['main', { resolvedFiles: new Set([fileA]), unresolvedSpecifiers: [] }],
      [
        'admin',
        { resolvedFiles: new Set<string>(), unresolvedSpecifiers: ['pkg/X'] },
      ],
    ]);
    const { files, unresolvedByEntry } =
      aggregateEagerRouteComponentFiles(byEntry);
    expect(files.has(fileA)).toBe(true);
    expect(unresolvedByEntry.get('admin')).toEqual(['pkg/X']);
    // Entries without unresolved specifiers are not added to the map.
    expect(unresolvedByEntry.has('main')).toBe(false);
  });
});

// Timing regression: the eager set must reflect the FINAL routes (after every
// `modifyFileSystemRoutes` consumer ran), not an intermediate snapshot. The
// collection now happens in the router plugin AFTER
// `hooks.modifyFileSystemRoutes.call()` returns, so we simulate that pipeline:
// a later consumer REPLACES a route component, and we assert the collected set
// reflects the replacement (not the original).
describe('route component collection uses FINAL routes (timing)', () => {
  let dir: string;
  let srcDir: string;
  const srcAlias = '@_modern_js_src';

  beforeAll(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'lazycompat-timing-'));
    srcDir = path.join(dir, 'src');
    fs.mkdirSync(path.join(srcDir, 'routes', 'about'), { recursive: true });
    // `original.tsx` is what an early plugin produced; `replaced.tsx` is what a
    // later `modifyFileSystemRoutes` consumer swaps in.
    fs.writeFileSync(path.join(srcDir, 'routes', 'about', 'original.tsx'), '');
    fs.writeFileSync(path.join(srcDir, 'routes', 'about', 'replaced.tsx'), '');
  });

  afterAll(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('collects the replaced component, not the intermediate one', () => {
    // Initial routes (as an early plugin would emit them).
    let routes: any = [{ _component: `${srcAlias}/routes/about/original.tsx` }];

    // Simulate the `modifyFileSystemRoutes` pipeline: a later consumer replaces
    // the route component. Collection must run on this FINAL value.
    const consumers: Array<(r: any) => any> = [
      r => r, // identity consumer
      r => [{ _component: `${srcAlias}/routes/about/replaced.tsx` }], // replaces
    ];
    for (const consumer of consumers) {
      routes = consumer(routes);
    }

    const { resolvedFiles } = collectRouteComponentFiles(
      routes,
      srcDir,
      srcAlias,
    );
    const replaced = normalizeModulePath(
      path.join(srcDir, 'routes', 'about', 'replaced.tsx'),
    );
    const original = normalizeModulePath(
      path.join(srcDir, 'routes', 'about', 'original.tsx'),
    );
    expect(resolvedFiles.has(replaced)).toBe(true);
    // The intermediate component must NOT leak into the eager set.
    expect(resolvedFiles.has(original)).toBe(false);
    expect(resolvedFiles.size).toBe(1);
  });
});

describe('planSSRLazyCompilation', () => {
  const fileA = normalizeModulePath('/app/src/routes/a/page.tsx');
  const lazyOn = { imports: true, entries: false };

  it('does not apply when lazy is not enabled', () => {
    const plan = planSSRLazyCompilation(undefined, {
      files: new Set([fileA]),
      unresolvedByEntry: new Map(),
    });
    expect(plan.apply).toBe(false);
  });

  it('skips (with unresolvedByEntry) when ANY route component is unresolved — even if no files resolved', () => {
    const plan = planSSRLazyCompilation(lazyOn, {
      files: new Set(),
      unresolvedByEntry: new Map([['main', ['pkg/X']]]),
    });
    expect(plan.apply).toBe(false);
    expect(plan.apply === false && plan.unresolvedByEntry?.get('main')).toEqual(
      ['pkg/X'],
    );
  });

  it('skips when unresolved exists alongside resolved files (unresolved wins)', () => {
    const plan = planSSRLazyCompilation(lazyOn, {
      files: new Set([fileA]),
      unresolvedByEntry: new Map([['admin', ['other-alias/Y']]]),
    });
    expect(plan.apply).toBe(false);
    expect(plan.apply === false && plan.unresolvedByEntry?.size).toBe(1);
  });

  it('does not apply when there are no route components at all', () => {
    const plan = planSSRLazyCompilation(lazyOn, {
      files: new Set(),
      unresolvedByEntry: new Map(),
    });
    expect(plan.apply).toBe(false);
  });

  it('applies a route-eager test when all route components resolved', () => {
    const plan = planSSRLazyCompilation(lazyOn, {
      files: new Set([fileA]),
      unresolvedByEntry: new Map(),
    });
    expect(plan.apply).toBe(true);
    if (plan.apply) {
      const test = plan.lazyCompilation.test as (m: {
        resource?: string;
      }) => boolean;
      expect(test({ resource: '/app/src/routes/a/page.tsx' })).toBe(false);
      expect(test({ resource: '/app/src/x.tsx' })).toBe(true);
      expect(plan.lazyCompilation.imports).toBe(true);
    }
  });
});
