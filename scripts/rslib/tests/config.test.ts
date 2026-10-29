import { expect, test } from '@rstest/core';
import { rslibConfig } from '../src';

test('generates shared declarations from a single library target', () => {
  const declarationTargets = rslibConfig.lib.filter(config => config.dts);

  expect(declarationTargets).toHaveLength(1);
  expect(declarationTargets[0]).toMatchObject({
    id: 'esm-node',
    dts: { distPath: 'dist/types' },
  });
});

test('preserves all JavaScript output targets', () => {
  expect(
    rslibConfig.lib.map(config => ({
      id: config.id,
      format: config.format,
      distPath: config.output?.distPath,
    })),
  ).toEqual([
    { id: 'esm-node', format: 'esm', distPath: { root: './dist/esm-node' } },
    { id: 'esm-web', format: 'esm', distPath: { root: './dist/esm' } },
    { id: 'cjs-node', format: 'cjs', distPath: { root: './dist/cjs' } },
  ]);
});
