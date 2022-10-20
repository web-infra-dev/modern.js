import { vi, expect, describe, it } from 'vitest';
import * as shared from '@modern-js/builder-shared';
import { PluginTarget } from '../../src/plugins/target';
import { createStubBuilder } from '../../src/stub';

describe('plugins/target', () => {
  const cases = [
    {
      target: 'node',
      browserslist: ['foo'],
      expected: { target: 'node' },
    },
    {
      target: 'modern-web',
      browserslist: ['foo'],
      expected: { target: ['web', 'browserslist'] },
    },
    {
      target: 'modern-web',
      browserslist: null,
      expected: { target: ['web', 'es6'] },
    },
    {
      target: 'web',
      browserslist: null,
      expected: { target: ['web', 'es5'] },
    },
    {
      target: 'web-worker',
      browserslist: null,
      expected: { target: ['webworker', 'es5'] },
    },
  ];

  it.each(cases)('%j', async item => {
    const $getBrowserslist = vi
      .spyOn(shared, 'getBrowserslist')
      .mockResolvedValueOnce(item.browserslist);

    const builder = await createStubBuilder({
      plugins: [PluginTarget()],
      target: item.target as any,
    });
    const config = await builder.unwrapWebpackConfig();

    expect(config).toEqual(item.expected);
    $getBrowserslist.mockRestore();
  });
});
