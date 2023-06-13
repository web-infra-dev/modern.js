import { expect, describe, it } from 'vitest';
import { normalizeCssLoaderOptions } from '../src/css';

describe('normalizeCssLoaderOptions', () => {
  it('should enable exportOnlyLocals correctly', () => {
    expect(normalizeCssLoaderOptions({ modules: false }, true)).toEqual({
      modules: false,
    });

    expect(normalizeCssLoaderOptions({ modules: true }, true)).toEqual({
      modules: {
        exportOnlyLocals: true,
      },
    });

    expect(normalizeCssLoaderOptions({ modules: true }, false)).toEqual({
      modules: true,
    });

    expect(normalizeCssLoaderOptions({ modules: 'local' }, true)).toEqual({
      modules: {
        mode: 'local',
        exportOnlyLocals: true,
      },
    });

    expect(
      normalizeCssLoaderOptions({ modules: { auto: true } }, true),
    ).toEqual({
      modules: {
        auto: true,
        exportOnlyLocals: true,
      },
    });
  });
});
