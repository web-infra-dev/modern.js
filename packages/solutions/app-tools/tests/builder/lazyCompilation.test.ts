import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  buildSSRLazyCompilationTest,
  clearRouteComponentFiles,
  collectRouteComponentFiles,
  getRouteComponentFiles,
  normalizeModulePath,
  planSSRLazyCompilation,
  setRouteComponentFiles,
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
  const routeFiles = new Set([routeFile]);

  it('forces route component modules eager (false)', () => {
    const test = buildSSRLazyCompilationTest(routeFiles);
    expect(test({ resource: '/app/src/routes/about/page.tsx' })).toBe(false);
  });

  it('lazy (true) for non-route modules without a user test', () => {
    const test = buildSSRLazyCompilationTest(routeFiles);
    expect(test({ resource: '/app/src/components/Heavy.tsx' })).toBe(true);
  });

  it('delegates non-route modules to a function user test', () => {
    const userTest = (m: { resource?: string }) =>
      !/Heavy/.test(m.resource || '');
    const test = buildSSRLazyCompilationTest(routeFiles, userTest);
    expect(test({ resource: '/app/src/components/Heavy.tsx' })).toBe(false);
    expect(test({ resource: '/app/src/components/Light.tsx' })).toBe(true);
  });

  it('supports a RegExp user test', () => {
    const test = buildSSRLazyCompilationTest(routeFiles, /Heavy/);
    expect(test({ resource: '/app/src/components/Heavy.tsx' })).toBe(true);
    expect(test({ resource: '/app/src/components/Light.tsx' })).toBe(false);
    expect(test({ resource: '/app/src/routes/about/page.tsx' })).toBe(false);
  });

  it('keeps route eager even when user test always returns true', () => {
    const test = buildSSRLazyCompilationTest(routeFiles, () => true);
    expect(test({ resource: '/app/src/routes/about/page.tsx' })).toBe(false);
  });

  it('falls back to user test / true for empty resource', () => {
    expect(buildSSRLazyCompilationTest(routeFiles)({})).toBe(true);
    expect(
      buildSSRLazyCompilationTest(routeFiles, () => false)({ resource: '' }),
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
    const { files, unresolved } = collectRouteComponentFiles(
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
      files.has(
        normalizeModulePath(path.join(srcDir, 'routes', 'user', 'layout.tsx')),
      ),
    ).toBe(true);
    expect(
      files.has(
        normalizeModulePath(path.join(srcDir, 'routes', 'about', 'page.tsx')),
      ),
    ).toBe(true);
    expect(unresolved).toHaveLength(0);
  });

  it('reports unresolvable components instead of dropping them silently', () => {
    const { files, unresolved } = collectRouteComponentFiles(
      [
        { _component: `${srcAlias}/routes/about/page.tsx` },
        { _component: 'some-npm-pkg/Component' },
        { _component: `${srcAlias}/routes/missing/page` },
      ],
      srcDir,
      srcAlias,
    );
    expect(files.size).toBe(1);
    expect(unresolved).toEqual([
      'some-npm-pkg/Component',
      `${srcAlias}/routes/missing/page`,
    ]);
  });
});

describe('route component store', () => {
  const appDir = '/tmp/lazycompat-store-app';
  const fileA = normalizeModulePath('/tmp/lazycompat-store-app/src/a.tsx');

  it('merges files across entries and surfaces unresolved per entry', () => {
    setRouteComponentFiles(appDir, 'main', {
      files: new Set([fileA]),
      unresolved: [],
    });
    setRouteComponentFiles(appDir, 'admin', {
      files: new Set(),
      unresolved: ['pkg/X'],
    });
    const { files, unresolvedByEntry } = getRouteComponentFiles(appDir);
    expect(files.has(fileA)).toBe(true);
    expect(unresolvedByEntry.get('admin')).toEqual(['pkg/X']);
  });

  it('recomputes (overrides) an entry instead of appending', () => {
    setRouteComponentFiles(appDir, 'admin', {
      files: new Set(),
      unresolved: [],
    });
    const { unresolvedByEntry } = getRouteComponentFiles(appDir);
    expect(unresolvedByEntry.has('admin')).toBe(false);
  });

  it('clearRouteComponentFiles drops all entries for the app', () => {
    setRouteComponentFiles(appDir, 'main', {
      files: new Set([fileA]),
      unresolved: [],
    });
    clearRouteComponentFiles(appDir);
    expect(getRouteComponentFiles(appDir).files.size).toBe(0);
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
