import type { Entrypoint } from '@modern-js/types';
import {
  getEntrypointRoutesDir,
  getEntrypointRoutesOwner,
  modifyEntrypoints,
} from '../../src/router/cli/entry';

describe('router entry ownership metadata', () => {
  test('tracks configured routesDir for custom source entries', () => {
    const customEntry = {
      isAutoMount: true,
      isCustomSourceEntry: true,
      fileSystemRoutes: { globalApp: '' },
      absoluteEntryDir: '/workspace/src/admin',
      entry: '/workspace/src/admin',
    } as unknown as Entrypoint;

    const [modified] = modifyEntrypoints([customEntry], 'views');

    expect(modified.nestedRoutesEntry).toBe('/workspace/src/admin');
    expect(getEntrypointRoutesDir(modified as any)).toBe('views');
  });

  test('falls back to nestedRoutesEntry basename without metadata', () => {
    expect(
      getEntrypointRoutesDir({
        nestedRoutesEntry: '/workspace/src/routes',
      }),
    ).toBe('routes');
  });

  test('preserves a plugin claim when the built-in router runs later', () => {
    const customEntry = {
      isAutoMount: true,
      isCustomSourceEntry: true,
      fileSystemRoutes: { globalApp: '' },
      absoluteEntryDir: '/workspace/src/admin',
      entry: '/workspace/src/admin',
    } as unknown as Entrypoint;
    const [claimed] = modifyEntrypoints([customEntry], 'views', {
      routesOwner: '@modern-js/plugin-tanstack',
    });
    const [modified] = modifyEntrypoints([claimed]);
    expect(getEntrypointRoutesDir(modified)).toBe('views');
    expect(getEntrypointRoutesOwner(modified)).toBe(
      '@modern-js/plugin-tanstack',
    );
  });
});
