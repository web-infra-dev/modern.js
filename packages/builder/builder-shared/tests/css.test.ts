import { expect, describe, it } from 'vitest';
import {
  normalizeCssLoaderOptions,
  isCssModules,
  getCssModulesAutoRule,
  isLooseCssModules,
} from '../src/css';

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

it('check isCssModules', () => {
  expect(isCssModules('src/index.css', false)).toBeFalsy();
  expect(isCssModules('src/index.css', { auto: false })).toBeFalsy();
  expect(isCssModules('src/index.module.css', { auto: false })).toBeFalsy();

  expect(isCssModules('src/index.css', true)).toBeTruthy();

  expect(isCssModules('src/index.css', { auto: true })).toBeFalsy();
  expect(isCssModules('src/index.module.css', { auto: true })).toBeTruthy();

  expect(
    isCssModules('src/index.module.css', {
      auto: path => {
        return path.includes('.module.');
      },
    }),
  ).toBeTruthy();

  expect(
    isCssModules('src/index.css', {
      auto: path => {
        return path.includes('.module.');
      },
    }),
  ).toBeFalsy();

  expect(
    isCssModules('src/index.module.css', {
      auto: /\.module\./i,
    }),
  ).toBeTruthy();

  expect(
    isCssModules('src/index.css', {
      auto: /\.module\./i,
    }),
  ).toBeFalsy();
});

it('getCssModulesAutoRule', () => {
  expect(getCssModulesAutoRule(undefined, true)).toEqual(isLooseCssModules);

  expect(
    getCssModulesAutoRule(
      {
        auto: false,
      },
      true,
    ),
  ).toBeFalsy();

  expect(
    getCssModulesAutoRule(
      {
        auto: true,
      },
      true,
    ),
  ).toBeTruthy();

  const autoFn = () => true;

  expect(
    getCssModulesAutoRule(
      {
        auto: autoFn,
      },
      true,
    ),
  ).toEqual(autoFn);
});
