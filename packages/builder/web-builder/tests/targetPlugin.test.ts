import { vi, test, expect } from 'vitest';
import { getBrowserslist } from '../src/shared';
import { PluginTarget } from '../src/plugins/target';
import { createStubBuilder } from './utils/builder';

vi.mock('../src/shared');

test('asd', async () => {
  vi.mocked(getBrowserslist).mockResolvedValueOnce(['foo']);
  const { webpackConfigs } = await createStubBuilder({
    target: 'modern-web',
    plugins: [PluginTarget()],
  }).build();
  // console.dir(webpackConfigs);
  expect(webpackConfigs[0].target).toEqual(['web', 'es6']);
});
